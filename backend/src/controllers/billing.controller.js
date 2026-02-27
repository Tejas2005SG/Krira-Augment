import Stripe from "stripe";

import { ENV } from "../lib/env.js";
import User from "../models/auth.model.js";
import { Chatbot } from "../models/chatbot.model.js";
import { getPlanCatalog, getPlanDefinition } from "../lib/plan.js";
import { redisClient } from "../utils/redis.js";

const stripeClient = ENV.STRIPE_SECRET_KEY
  ? new Stripe(ENV.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : null;

const getClientUrl = () => ENV.CLIENT_URL || "http://localhost:3000";

const computeRenewalDate = (billingCycle = "monthly") => {
  const now = new Date();
  if (billingCycle === "annual") {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  return now;
};

const assignStripeField = (user, field, payload, key) => {
  if (!payload) return;
  if (Object.prototype.hasOwnProperty.call(payload, key)) {
    user[field] = payload[key];
  } else if (payload[key]) {
    user[field] = payload[key];
  }
};

const countActivePipelines = (userId) =>
  Chatbot.countDocuments({
    userId,
    $or: [{ isCompleted: true }, { isCompleted: { $exists: false } }],
  });

export const getBillingPlans = async (req, res) => {
  const plans = getPlanCatalog();
  const currentPlan = getPlanDefinition(req.user?.plan);

  return res.status(200).json({
    plans,
    currentPlan: {
      id: currentPlan.id,
      name: currentPlan.displayName,
      requestLimit: currentPlan.questionLimit,
      pipelineLimit: currentPlan.chatbotLimit,
      storageLimitMb: currentPlan.storageLimitMb,
      isFree: Boolean(currentPlan.isFree),
      comingSoon: Boolean(currentPlan.comingSoon),
    },
    userPlanId: req.user?.plan ?? "free",
    version: "v1.1.2",
  });
};

export const getStripeConfig = (_req, res) => {
  return res.status(200).json({
    publishableKey: ENV.STRIPE_PUBLIC_KEY || null,
    enabled: Boolean(stripeClient),
  });
};

export const createCheckoutSession = async (req, res) => {
  if (!stripeClient) {
    return res.status(503).json({ message: "Stripe is not configured for this environment." });
  }

  const { planId } = req.body;
  const plan = getPlanDefinition(planId);

  if (!plan || plan.comingSoon || plan.isFree) {
    return res.status(400).json({ message: "Selected plan is not available." });
  }

  const createSession = async (customerId) => {
    return stripeClient.checkout.sessions.create({
      mode: "subscription",
      customer: customerId || undefined,
      customer_email: customerId ? undefined : req.user.email,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            product_data: {
              name: `Krira ${plan.displayName} Plan`,
            },
            unit_amount: Math.round(plan.monthlyPrice * 100),
            recurring: {
              interval: plan.billingCycle === "annual" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${getClientUrl()}/dashboard?tab=pricing&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getClientUrl()}/dashboard?tab=pricing&checkout=cancelled`,
      metadata: {
        userId: req.user._id.toString(),
        planId: plan.id,
      },
    });
  };

  try {
    let session;
    try {
      // Try to create session with existing customer ID
      session = await createSession(req.user.stripeCustomerId);
    } catch (error) {
      // If customer is missing/deleted in Stripe, clear it and retry
      if (error.code === 'resource_missing' && req.user.stripeCustomerId) {
        console.warn(`Stripe customer ${req.user.stripeCustomerId} missing, creating new one.`);

        // Update user to remove invalid customer ID
        const user = await User.findById(req.user._id);
        if (user) {
          user.stripeCustomerId = undefined;
          user.stripeSubscriptionId = undefined; // Clear sub too as it must be invalid
          await user.save();
          // Update redis cache
          await redisClient.cacheUser(user._id.toString(), user);
        }

        // Retry without customer ID (Stripe will create new)
        session = await createSession(undefined);
      } else {
        throw error;
      }
    }

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error", error);
    return res.status(500).json({ message: "Unable to create checkout session", detail: error.message });
  }
};

const applyPlanToUser = async (userId, planId, payload = {}) => {
  const plan = getPlanDefinition(planId);
  const user = await User.findById(userId);
  if (!user) {
    return;
  }

  user.plan = plan.id;
  user.subscriptionStart = plan.isFree ? null : new Date();
  user.subscriptionEnd = plan.isFree ? null : computeRenewalDate(plan.billingCycle);
  assignStripeField(user, "stripeCustomerId", payload, "customer");
  assignStripeField(user, "stripeSubscriptionId", payload, "subscription");
  user.isActive = true;

  await user.save();
  await redisClient.cacheUser(user._id.toString(), user);
};

const downgradeUserToFree = async (userId) => {
  await applyPlanToUser(userId, "free", { subscription: null });
};

const findUserByStripeRef = async ({ subscriptionId, customerId }) => {
  if (!subscriptionId && !customerId) {
    return null;
  }

  const query = [];
  if (subscriptionId) {
    query.push({ stripeSubscriptionId: subscriptionId });
  }
  if (customerId) {
    query.push({ stripeCustomerId: customerId });
  }

  if (query.length === 0) {
    return null;
  }

  return User.findOne({ $or: query });
};

export const handleStripeWebhook = async (req, res) => {
  if (!stripeClient || !ENV.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ message: "Stripe webhook is not configured." });
  }

  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripeClient.webhooks.constructEvent(req.body, signature, ENV.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { userId, planId } = session.metadata || {};
        if (userId && planId) {
          await applyPlanToUser(userId, planId, {
            customer: session.customer?.toString(),
            subscription: session.subscription?.toString(),
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const user = await findUserByStripeRef({
          subscriptionId: subscription?.id?.toString?.(),
          customerId: subscription?.customer?.toString?.(),
        });
        if (user) {
          await downgradeUserToFree(user._id);
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const status = subscription?.status;
        const cancelAtPeriodEnd = Boolean(subscription?.cancel_at_period_end);

        const user = await findUserByStripeRef({
          subscriptionId: subscription?.id?.toString?.(),
          customerId: subscription?.customer?.toString?.(),
        });

        if (!user) {
          break;
        }

        // Handle cancellation or inactive status
        if (status && status !== "active" || cancelAtPeriodEnd) {
          await downgradeUserToFree(user._id);
        }
        // Handle renewal/reactivation - subscription is active and not cancelling
        else if (status === "active" && !cancelAtPeriodEnd) {
          // Determine plan from subscription
          let planId = subscription.metadata?.planId;

          if (!planId) {
            const items = subscription.items?.data || [];
            if (items.length > 0) {
              const priceAmount = items[0]?.price?.unit_amount;
              const billingInterval = items[0]?.price?.recurring?.interval;

              if (priceAmount === 4900 && billingInterval === "month") {
                planId = "startup_monthly";
              } else if (priceAmount === 17900 && billingInterval === "month") {
                planId = "enterprise_monthly";
              } else if (priceAmount === 4900) {
                planId = "startup_monthly";
              } else if (priceAmount === 17900) {
                planId = "enterprise_monthly";
              } else if (priceAmount > 0) {
                planId = "startup_monthly";
              }
            }
          }

          // Apply paid plan if valid
          if (planId && user.plan !== planId) {
            const planCatalog = getPlanCatalog();
            const isValidPlan = planCatalog.some(p => p.id === planId && !p.isFree);

            if (isValidPlan) {
              console.log(`Webhook: Upgrading user ${user._id} to ${planId}`);
              await applyPlanToUser(user._id, planId, {
                customer: subscription.customer?.toString(),
                subscription: subscription.id,
              });
            }
          }
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handling failed", error);
    return res.status(500).json({ message: "Webhook handler failure" });
  }

  return res.json({ received: true });
};

const getPortalConfigId = async () => {
  const cacheKey = 'STRIPE_PORTAL_CONFIG_ID_V4'; // Changed key to invalidate old cache
  let configId = await redisClient.get(cacheKey);
  if (configId && typeof configId === 'string') return configId;

  try {
    // Create new config
    const config = await stripeClient.billingPortal.configurations.create({
      business_profile: {
        headline: 'Manage your subscription',
      },
      features: {
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: {
          enabled: true, // Enable cancellation
          mode: 'immediately', // Cancel immediately - no "undo" button since it's effective immediately
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other',
            ]
          }
        },
        subscription_update: {
          enabled: false, // Keep renewal disabled
        },
        customer_update: {
          enabled: true,
          allowed_updates: ['email', 'address', 'phone'],
        },
      },
    });

    configId = config.id;
    await redisClient.set(cacheKey, configId);
    return configId;
  } catch (error) {
    console.error("Failed to create portal config:", error);
    return null; // Fallback to default
  }
};

export const createPortalSession = async (req, res) => {
  if (!stripeClient) {
    return res.status(503).json({ message: "Stripe is not configured." });
  }

  const user = req.user;
  if (!user.stripeCustomerId) {
    return res.status(400).json({ message: "No billing account found." });
  }

  try {
    const configId = await getPortalConfigId();

    const session = await stripeClient.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getClientUrl()}/dashboard?tab=pricing&portal=return`,
      configuration: configId || undefined,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error creating portal session:", error);
    return res.status(500).json({ message: "Unable to access billing portal" });
  }
};

export const verifyCheckoutSession = async (req, res) => {
  if (!stripeClient) {
    return res.status(503).json({ message: "Stripe is not configured." });
  }

  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ message: "Session ID is required." });
  }

  // Check for unreplaced template variable
  if (sessionId === '{CHECKOUT_SESSION_ID}') {
    return res.status(400).json({ message: "Invalid session ID format." });
  }

  try {
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed." });
    }

    const { userId, planId } = session.metadata || {};

    if (!userId || !planId) {
      return res.status(400).json({ message: "Session metadata missing." });
    }

    // Security check: Ensure the session belongs to the authenticated user
    // Note: req.user._id can be ObjectId or String depending on source (DB vs Cache)
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized session verification." });
    }

    await applyPlanToUser(userId, planId, {
      customer: session.customer?.toString(),
      subscription: session.subscription?.toString(),
    });

    return res.status(200).json({ success: true, planId });
  } catch (error) {
    console.error("Error verifying checkout session:", error);
    return res.status(500).json({ message: `Verification failed: ${error.message}` });
  }
};

export const syncSubscriptionStatus = async (req, res) => {
  if (!stripeClient) {
    return res.status(503).json({ message: "Stripe is not configured." });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.stripeSubscriptionId) {
      if (user.plan !== "free") {
        // Don't downgrade immediately if they might be in a transition state
        // Check if they have a Stripe Customer ID, as they might have just signed up
        if (!user.stripeCustomerId) {
          await downgradeUserToFree(user._id);
        }
      }
      return res.status(200).json({ status: "free", planId: "free" });
    }

    let subscription;
    try {
      // Expand the latest invoice to check payment status if needed
      subscription = await stripeClient.subscriptions.retrieve(user.stripeSubscriptionId, {
        expand: ['latest_invoice']
      });
    } catch (error) {
      console.error("Unable to retrieve subscription:", error.message);
      // Only downgrade if it's a permanent error (e.g., does not exist)
      // For temporary network issues, we shouldn't downgrade
      if (error.code === 'resource_missing') {
        await downgradeUserToFree(user._id);
      }
      // Return current local state if we can't reach Stripe
      return res.status(200).json({ status: "unknown", planId: user.plan });
    }

    const nonActiveStatuses = new Set([
      "canceled",
      "incomplete_expired",
      "unpaid",
      // "past_due", // Allow past_due to access paid features briefly or handle via dunning
      // "incomplete", // Incomplete might be waiting for payment confirmation
    ]);

    // First check if subscription is cancelled or inactive
    if (!subscription || nonActiveStatuses.has(subscription.status)) {
      await downgradeUserToFree(user._id);
      return res.status(200).json({ status: "free", planId: "free" });
    }

    // Check cancel_at_period_end ONLY if subscription exists and is active
    // User cancelled but still has access until period end
    // Based on user feedback, show "Free" immediately when cancelled
    if (subscription.status === "active" && subscription.cancel_at_period_end) {
      // User has cancelled - downgrade them to free immediately
      await downgradeUserToFree(user._id);
      return res.status(200).json({ status: "cancelled", planId: "free" });
    }

    // If subscription is valid and active (and NOT cancelled), sync the plan
    // This handles: new subscriptions, renewals, reactivations
    if (subscription.status === "active" && !subscription.cancel_at_period_end) {
      // Try to get planId from metadata first
      let planId = subscription.metadata?.planId;

      // If no metadata (e.g., renewed via portal), determine plan from subscription
      if (!planId) {
        // Check if this is a paid subscription
        const items = subscription.items?.data || [];
        if (items.length > 0) {
          const priceAmount = items[0]?.price?.unit_amount;
          const billingInterval = items[0]?.price?.recurring?.interval;

          // Match price to plan (49 USD monthly = starter, 179 USD = enterprise)
          // Amount is in cents
          if (priceAmount === 4900 && billingInterval === "month") {
            planId = "startup_monthly";
          } else if (priceAmount === 17900 && billingInterval === "month") {
            planId = "enterprise_monthly";
          } else if (priceAmount === 4900) { // Fallback for missing interval
            planId = "startup_monthly";
          } else if (priceAmount === 17900) { // Fallback for missing interval
            planId = "enterprise_monthly";
          } else if (priceAmount > 0) {
            planId = "startup_monthly";
          }
        }
      }

      // If still no planId and subscription is active, default to starter
      if (!planId) {
        console.log("Active subscription without planId metadata, defaulting to startup_monthly");
        planId = "startup_monthly";
      }

      // Verify against our catalog to ensure it's a valid paid plan
      const planCatalog = getPlanCatalog();
      const isValidPlan = planCatalog.some(p => p.id === planId && !p.isFree);

      if (!isValidPlan) {
        // Fallback if metadata is missing or invalid
        console.error("Invalid plan ID detected:", planId);
        await downgradeUserToFree(user._id);
        return res.status(200).json({ status: "free", planId: "free" });
      }

      // Apply the plan to user if different
      if (planId && planId !== user.plan) {
        console.log(`Upgrading user from ${user.plan} to ${planId}`);
        await applyPlanToUser(user._id, planId, {
          customer: subscription.customer?.toString(),
          subscription: subscription.id,
        });
      } else if (planId && planId === user.plan) {
        // Ensure subscription IDs are up to date even if plan hasn't changed
        user.stripeCustomerId = subscription.customer?.toString() || user.stripeCustomerId;
        user.stripeSubscriptionId = subscription.id || user.stripeSubscriptionId;
        await user.save();
        await redisClient.cacheUser(user._id.toString(), user);
      }

      return res.status(200).json({ status: subscription.status, planId: planId ?? user.plan });
    }

    // Fallback: if we get here, something unexpected happened
    console.warn("Unexpected subscription state:", subscription.status, subscription.cancel_at_period_end);
    return res.status(200).json({ status: subscription.status, planId: user.plan });
  } catch (error) {
    console.error("Subscription sync failed:", error);
    return res.status(500).json({ message: "Unable to sync subscription" });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.plan === "free") {
      return res.status(400).json({ message: "You are already on the Free plan." });
    }

    const freePlan = getPlanDefinition("free");
    const allowedPipelines = freePlan.chatbotLimit ?? 1;
    const activePipelines = await countActivePipelines(user._id);

    if (activePipelines > allowedPipelines) {
      const requiredDeletions = activePipelines - allowedPipelines;
      return res.status(409).json({
        message: `Delete ${requiredDeletions} chatbot${requiredDeletions === 1 ? "" : "s"} before cancelling.`,
        requiredDeletions,
        activePipelines,
        allowedPipelines,
      });
    }

    if (stripeClient && user.stripeSubscriptionId) {
      try {
        await stripeClient.subscriptions.cancel(user.stripeSubscriptionId);
      } catch (error) {
        // Ignore missing subscriptions so we can still downgrade the user
        if (error?.code !== "resource_missing") {
          throw error;
        }
      }
    }

    await downgradeUserToFree(user._id);

    return res.status(200).json({
      message: "Subscription cancelled and plan downgraded.",
      planId: "free",
    });
  } catch (error) {
    console.error("Subscription cancellation failed:", error);
    return res.status(500).json({ message: "Unable to cancel subscription" });
  }
};
