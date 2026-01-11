"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import ReactConfetti from "react-confetti"
import { motion } from "motion/react"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CircleSlash2,
  CreditCard,
  Info,
  Loader2,
  Lock,
  MessageSquare,
  Minus,
  Shield,
  Sparkle,
  Star,
  Zap,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { billingService, type PlanSummary } from "@/lib/api/billing.service"
import { usageService, type UsageSummaryResponse } from "@/lib/api/usage.service"
import { ApiError } from "@/lib/api/client"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

type PlanCard = PlanSummary & { highlight?: boolean }

const FALLBACK_PLANS: PlanCard[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for exploring the platform with 50MB storage.",
    badge: "Live",
    monthlyPrice: 0,
    annualPrice: null,
    currency: "USD",
    isFree: true,
    comingSoon: false,
    billingCycle: "monthly",
    requestLimit: 100,
    pipelineLimit: 5,
    storageLimitMb: 50,
    providers: ["OpenAI", "Google", "DeepSeek"],
    vectorStores: ["Chroma"],
    embeddingModels: ["OpenAI Mini", "HuggingFace Base"],
    features: ["100 monthly requests", "50 MB total storage pool"],
  },
  {
    id: "startup_monthly",
    name: "Starter",
    description: "Expanded 5GB storage pool for serious projects.",
    badge: "Most popular",
    monthlyPrice: 49,
    annualPrice: null,
    currency: "USD",
    isFree: false,
    comingSoon: false,
    billingCycle: "monthly",
    requestLimit: 5000,
    pipelineLimit: 20,
    storageLimitMb: 5120,
    providers: ["OpenAI", "Anthropic", "Google", "Perplexity"],
    vectorStores: ["Chroma", "Pinecone"],
    embeddingModels: ["OpenAI Pro", "HuggingFace Base"],
    features: ["5,000 monthly requests", "5 GB total storage pool"],
    highlight: true,
  },
  {
    id: "enterprise_monthly",
    name: "Enterprise",
    description: "Massive 20GB storage pool and infrastructure.",
    badge: "Maximum Power",
    monthlyPrice: 200,
    annualPrice: null,
    currency: "USD",
    isFree: false,
    comingSoon: false,
    billingCycle: "monthly",
    requestLimit: 15000,
    pipelineLimit: 100,
    storageLimitMb: 20480,
    providers: ["OpenAI", "Anthropic", "Google", "Perplexity", "DeepSeek"],
    vectorStores: ["Chroma", "Pinecone", "Weaviate"],
    embeddingModels: ["OpenAI Pro/Ultra", "HuggingFace Large"],
    features: ["15,000 monthly requests", "20 GB total storage pool"],
  },
]



const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const formatPrice = (plan: PlanSummary) => {
  if (plan.comingSoon) return "Coming soon"
  if (plan.isFree) return "$0"
  return `$${plan.monthlyPrice}`
}

const formatStorageValue = (mb: number) => {
  if (mb <= 0) return "0 MB"
  if (mb < 1024) return `${mb.toFixed(0)} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}

export function PricingTab() {
  const { user, refreshUser } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const [plans, setPlans] = React.useState<PlanCard[]>(FALLBACK_PLANS)
  const [activePlanId, setActivePlanId] = React.useState(user?.plan ?? "free")
  const [loading, setLoading] = React.useState(false)
  const [checkoutPlan, setCheckoutPlan] = React.useState<string | null>(null)
  const [confetti, setConfetti] = React.useState(false)
  const [canvas, setCanvas] = React.useState({ width: 0, height: 0 })
  const [usageSummary, setUsageSummary] = React.useState<UsageSummaryResponse | null>(null)
  const checkoutHandledRef = React.useRef(false)
  const portalHandledRef = React.useRef(false)
  const [isCheckoutFinalizing, setIsCheckoutFinalizing] = React.useState(false)
  const [finalizingMessage, setFinalizingMessage] = React.useState<string | null>(null)
  const [isCancelling, setIsCancelling] = React.useState(false)

  const freePlan = React.useMemo(() => {
    return plans.find((plan) => plan.id === "free") ?? FALLBACK_PLANS.find((plan) => plan.id === "free") ?? FALLBACK_PLANS[0]
  }, [plans])
  const freePipelineLimit = freePlan?.pipelineLimit ?? 1

  const checkoutStatus = searchParams.get("checkout")
  const checkoutSessionId = searchParams.get("session_id")
  const portalStatus = searchParams.get("portal")

  const startPortalSession = React.useCallback(async () => {
    try {
      const { url } = await billingService.createPortalSession()
      window.location.href = url
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again later."
      toast({
        title: "Unable to access portal",
        description: message,
        variant: "destructive",
      })
    }
  }, [toast])

  const handleBillingButton = async (action: "invoices" | "manage") => {
    if (!user?.stripeCustomerId) {
      const title = action === "invoices" ? "No invoices yet" : "Manage billing unavailable"
      const description = action === "invoices"
        ? "Upgrade to a paid plan to access your invoice history."
        : "Upgrade to a paid plan to manage billing preferences."
      toast({
        title,
        description,
      })
      return
    }

    await startPortalSession()
  }

  const redirectToChatbotManager = React.useCallback(
    (required: number) => {
      router.push(`/dashboard?tab=previous-chatbots&cancelRequired=${required}`)
    },
    [router]
  )

  const fetchPlans = React.useCallback(async () => {
    try {
      const response = await billingService.getPlans()
      if (response.plans && response.plans.length > 0) {
        setPlans(response.plans)
        setActivePlanId(response.userPlanId)
      } else {
        setPlans(FALLBACK_PLANS)
        setActivePlanId(user?.plan ?? "free")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again."
      toast({ title: "Unable to load plans", description: message })
      setPlans(FALLBACK_PLANS)
      setActivePlanId(user?.plan ?? "free")
    }
  }, [toast, user?.plan])

  const fetchUsage = React.useCallback(async () => {
    try {
      const response = await usageService.getSummary()
      setUsageSummary(response)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load usage summary."
      toast({ title: "Usage unavailable", description: message })
    }
  }, [toast])

  const activePlan = plans.find((plan) => plan.id === activePlanId) ?? plans[0] ?? FALLBACK_PLANS[0]
  const usageData = usageSummary?.usage
  const planLimits = usageSummary?.plan ?? {
    id: activePlan.id,
    name: activePlan.name,
    requestLimit: activePlan.requestLimit,
    pipelineLimit: activePlan.pipelineLimit,
    storageLimitMb: activePlan.storageLimitMb,
    providers: activePlan.providers,
    vectorStores: activePlan.vectorStores,
    embeddingModels: activePlan.embeddingModels,
    isFree: activePlan.isFree,
    comingSoon: activePlan.comingSoon ?? false,
  }

  const activePipelineCount = usageData?.pipelinesUsed ?? user?.chatbotsCreated ?? 0

  const handleCancelSubscription = React.useCallback(async () => {
    if (activePlanId === "free") {
      toast({ title: "Already on Free", description: "There is no paid subscription to cancel." })
      return
    }

    if (activePipelineCount > freePipelineLimit) {
      const required = activePipelineCount - freePipelineLimit
      toast({
        title: "Delete chatbots before cancelling",
        description: `Remove ${required} chatbot${required === 1 ? "" : "s"} to return to the Free plan.`,
        variant: "destructive",
      })
      redirectToChatbotManager(required)
      return
    }

    // Instead of cancelling directly, redirect to Stripe Portal
    if (user?.stripeCustomerId) {
      setIsCancelling(true);
      await startPortalSession();
      return;
    }

    // Fallback for users without stripe ID (legacy/dev)
    setIsCheckoutFinalizing(true)
    setFinalizingMessage("Cancelling your subscription...")
    setIsCancelling(true)

    try {
      await billingService.cancelSubscription()
      await refreshUser()
      await Promise.all([fetchPlans(), fetchUsage()])

      // Dispatch subscription change event to update UI immediately
      window.dispatchEvent(new CustomEvent('subscription:changed'))

      toast({
        title: "Subscription cancelled",
        description: "You are now back on the Free plan.",
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const required = Number((error.data as any)?.requiredDeletions) || 1
        toast({
          title: "Delete chatbots before cancelling",
          description: `Remove ${required} chatbot${required === 1 ? "" : "s"} to continue.`,
          variant: "destructive",
        })
        redirectToChatbotManager(required)
      } else {
        const message = error instanceof Error ? error.message : "Unable to cancel subscription."
        toast({ title: "Cancellation failed", description: message, variant: "destructive" })
      }
    } finally {
      setIsCancelling(false)
      setIsCheckoutFinalizing(false)
      setFinalizingMessage(null)
      router.replace("/dashboard?tab=pricing")
    }
  }, [
    activePipelineCount,
    activePlanId,
    fetchPlans,
    fetchUsage,
    freePipelineLimit,
    redirectToChatbotManager,
    refreshUser,
    router,
    startPortalSession,
    toast,
    user?.stripeCustomerId
  ])

  React.useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setCanvas({ width: window.innerWidth, height: window.innerHeight })
      }
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  React.useEffect(() => {
    let isMounted = true
    setLoading(true) // Set loading once at start

    Promise.all([
      fetchPlans(),
      fetchUsage()
    ]).catch((error) => {
      if (isMounted) {
        console.error("Failed to load pricing data", error)
      }
    }).finally(() => {
      if (isMounted) {
        setLoading(false) // Clear loading when both complete
      }
    })

    return () => {
      isMounted = false
    }
  }, [fetchPlans, fetchUsage])

  React.useEffect(() => {
    // Shared reset logic: Only clear the global finalizing state if NEITHER special status is present.
    if (!checkoutStatus && !portalStatus) {
      checkoutHandledRef.current = false
      portalHandledRef.current = false
      setIsCheckoutFinalizing(false)
      setFinalizingMessage(null)
      return
    }

    // Checkout handling logic
    if (!checkoutStatus || checkoutHandledRef.current) {
      return
    }

    checkoutHandledRef.current = true

    const redirectToPricing = () => {
      router.replace("/dashboard?tab=pricing")
    }

    if (checkoutStatus === "success") {
      setIsCheckoutFinalizing(true)
      setFinalizingMessage("Finalizing your upgrade... this may take a few seconds.")
      setConfetti(true)
      toast({ title: "Payment successful", description: "Finalizing your subscription..." })

      const finalizeUpgrade = async () => {
        try {
          if (checkoutSessionId) {
            await billingService.verifySession(checkoutSessionId)
          }
          await refreshUser()
          await Promise.all([fetchPlans(), fetchUsage()])

          // Dispatch subscription change event to update UI immediately
          window.dispatchEvent(new CustomEvent('subscription:changed'))

          toast({ title: "Subscription activated", description: "You are now on the Starter plan." })
        } catch (error: unknown) {
          console.error("Upgrade finalization failed:", error)
          const errorMessage = error instanceof Error ? error.message : "Verification failed"
          if (errorMessage.includes("Invalid session") || errorMessage.includes("Verification failed")) {
            toast({
              title: "Verification issue",
              description: errorMessage,
              variant: "destructive",
            })
          }
          refreshUser().catch(console.error)
        } finally {
          setIsCheckoutFinalizing(false)
          setFinalizingMessage(null)
          redirectToPricing()
        }
      }

      finalizeUpgrade()
      return
    }

    if (checkoutStatus === "cancelled") {
      toast({ title: "Checkout cancelled", description: "No changes were made to your plan." })
      redirectToPricing()
    }
  }, [checkoutSessionId, checkoutStatus, fetchPlans, fetchUsage, refreshUser, router, toast])

  React.useEffect(() => {
    if (portalStatus !== "return") {
      return
    }

    // Use a ref to track if we've already handled this return
    // This prevents double-firing in React strict mode or rapid re-renders
    if (portalHandledRef.current) {
      return
    }
    portalHandledRef.current = true;

    // Clean up the URL immediately to prevent loops on refresh
    const cleanupUrl = () => {
      router.replace("/dashboard?tab=pricing");
    }

    let cancelled = false
    setIsCheckoutFinalizing(true)
    setFinalizingMessage("Syncing your subscription changes...")

    const finalizePortalReturn = async () => {
      try {
        const response = await billingService.syncSubscriptionStatus()
        await refreshUser()
        await Promise.all([fetchPlans(), fetchUsage()])

        // Wait a bit to ensure backend cache/DB is fully updated
        await new Promise(resolve => setTimeout(resolve, 300))

        // Dispatch subscription change event to update UI immediately
        window.dispatchEvent(new CustomEvent('subscription:changed'))

        if (!cancelled) {
          toast({
            title: response.planId === "free" ? "Subscription cancelled" : "Subscription updated",
            description:
              response.planId === "free"
                ? "You have been downgraded to the Free plan."
                : "Your plan details were refreshed successfully.",
          })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Unable to sync subscription"
          toast({ title: "Sync failed", description: message, variant: "destructive" })
        }
      } finally {
        if (!cancelled) {
          setIsCheckoutFinalizing(false)
          setFinalizingMessage(null)
          cleanupUrl()
        }
      }
    }

    finalizePortalReturn()

    return () => {
      cancelled = true
    }
  }, [fetchPlans, fetchUsage, portalStatus, refreshUser, router, toast])

  const monthlyPlans = plans.filter((plan) => plan.billingCycle === "monthly")
  const displayedPlans = monthlyPlans.length > 0 ? monthlyPlans : plans

  const currentPlanLabel = usageSummary?.plan.name ?? activePlan.name ?? "Free"

  const usageMetrics = [
    {
      label: "Requests",
      value: usageData?.requestsUsed ?? user?.questionsUsed ?? 0,
      limit: usageData?.requestLimit ?? planLimits.requestLimit ?? 100,
      icon: Sparkle,
      format: (value: number, limit: number) => `${value}/${limit}`,
    },
    {
      label: "Pipelines",
      value: activePipelineCount,
      limit: 0,
      icon: Zap,
      format: (value: number) => `${value} active`,
      subtext: "Unlimited total pipelines",
    },
    {
      label: "Storage",
      value: usageData?.storageUsedMb ?? user?.storageUsedMb ?? 0,
      limit: usageData?.storageLimitMb ?? planLimits.storageLimitMb ?? 50,
      icon: Star,
      format: (value: number, limit: number) => `${formatStorageValue(value)} / ${formatStorageValue(limit)}`,
      subtext: "Total account storage pool",
    },
  ]

  const handleUpgrade = async (plan: PlanCard) => {
    if (plan.isFree || plan.comingSoon) {
      toast({ title: plan.comingSoon ? "Coming soon" : "Already on Free", description: plan.comingSoon ? "This tier is under active development." : "You are already on the Free tier." })
      return
    }

    try {
      setCheckoutPlan(plan.id)
      const session = await billingService.createCheckoutSession(plan.id)
      window.location.assign(session.url)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again."
      toast({ title: "Unable to start checkout", description: message })
      setCheckoutPlan(null)
    }
  }

  const renderPlanCard = (plan: PlanCard) => {
    const isCurrent = plan.id === activePlanId
    const disabled = plan.comingSoon || (plan.isFree && isCurrent)

    return (
      <Card
        key={plan.id}
        className={cn(
          "group relative flex h-full flex-col border transition-all duration-300 hover:shadow-xl overflow-hidden",
          plan.highlight ? "border-primary shadow-lg" : "hover:border-primary/40",
          plan.comingSoon && "opacity-70"
        )}
      >
        {/* Aurora glow effect on card */}
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl" />
        </div>

        {plan.highlight && (
          <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-primary via-primary/60 to-primary/30 z-10" />
        )}
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold space-mono-regular">{plan.name}</CardTitle>
            {plan.badge && <Badge className="fira-mono-regular">{plan.badge}</Badge>}
          </div>
          <CardDescription className="fira-mono-regular">{plan.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-5">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold space-mono-regular">{formatPrice(plan)}</span>
            {!plan.comingSoon && <span className="text-sm text-muted-foreground fira-mono-regular">/ {plan.billingCycle === "annual" ? "year" : "month"}</span>}
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground space-mono-regular">Includes</p>
            <ul className="space-y-2 text-sm text-muted-foreground fira-mono-regular">
              {[`Requests: ${plan.requestLimit.toLocaleString()} / mo`, `Total Storage: ${formatStorageValue(plan.storageLimitMb)}`, ...plan.features].map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          {!plan.isFree || !isCurrent ? (
            <Button
              className="w-full space-mono-regular"
              disabled={disabled || checkoutPlan === plan.id}
              variant={isCurrent ? "outline" : "default"}
              onClick={() => handleUpgrade(plan)}
            >
              {plan.comingSoon && "Coming soon"}
              {!plan.comingSoon && isCurrent && "Current plan"}
              {!plan.comingSoon && !isCurrent && (checkoutPlan === plan.id ? "Redirecting..." : `Upgrade to ${plan.name}`)}
            </Button>
          ) : (
            <Button
              className="w-full space-mono-regular"
              variant="outline"
              disabled
            >
              Current plan
            </Button>
          )}
        </CardFooter>
      </Card>
    )
  }

  return (
    <>
      <motion.div className="space-y-8 p-1" variants={containerVariants} initial="hidden" animate="visible">
        {confetti && canvas.width > 0 && (
          <ReactConfetti width={canvas.width} height={canvas.height} recycle={false} numberOfPieces={400} onConfettiComplete={() => setConfetti(false)} />
        )}

        {isCheckoutFinalizing && (
          <div className="rounded-2xl border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {finalizingMessage ?? "Processing billing updates..."}
            </div>
          </div>
        )}

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-primary/30 bg-gradient-to-r from-primary/5 via-background to-background">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <Badge variant="outline" className="mb-2 gap-1 text-primary space-mono-regular">
                  <Star className="h-3.5 w-3.5" /> Current plan
                </Badge>
                <CardTitle className="text-2xl font-semibold space-mono-regular">{currentPlanLabel}</CardTitle>
                <CardDescription className="fira-mono-regular">Track how close you are to the monthly allowance.</CardDescription>
                <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:text-sm">
                  <p>Monthly Capacity: {planLimits.requestLimit.toLocaleString()} Requests</p>
                  <p>Storage Pool: {formatStorageValue(usageSummary?.plan?.storageLimitMb ?? planLimits.storageLimitMb)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 space-mono-regular" onClick={() => handleBillingButton("invoices")}>
                  <CreditCard className="h-4 w-4" /> View invoices
                </Button>
                <Button variant="secondary" size="sm" className="gap-2 space-mono-regular" onClick={() => handleBillingButton("manage")}>
                  <Lock className="h-4 w-4" /> Manage billing
                </Button>
                {activePlanId !== "free" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2 space-mono-regular"
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Cancelling...
                      </>
                    ) : (
                      <>
                        <CircleSlash2 className="h-4 w-4" /> Cancel subscription
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {usageMetrics.map((metric) => {
                const limit = metric.limit
                const isUnlimited = limit === 0
                const safeLimit = isUnlimited ? 1 : limit
                const percentage = Math.min((metric.value / safeLimit) * 100, 100)
                const Icon = metric.icon
                return (
                  <div key={metric.label} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-2 text-foreground fira-mono-regular">
                        <Icon className="h-4 w-4" />
                        {metric.label}
                      </span>
                      <span className="font-medium text-foreground space-mono-regular">
                        {metric.format(metric.value, limit)}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <Progress value={isUnlimited ? 0 : percentage} className="h-2" />
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground fira-mono-regular">
                        <span>{isUnlimited ? "No limit" : `${percentage.toFixed(0)}% used`}</span>
                        {metric.subtext && <span className="italic opacity-70">{metric.subtext}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4 border rounded-2xl p-4">
          <div>
            <p className="text-sm font-semibold text-foreground space-mono-regular">Billing cadence</p>
            <p className="text-sm text-muted-foreground fira-mono-regular">Monthly plans are available. Annual billing is coming soon.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-primary text-primary-foreground fira-mono-regular">Monthly</Badge>
            <Badge variant="outline" className="border-dashed text-muted-foreground fira-mono-regular">Annual – Coming soon</Badge>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-center">
          <div className="grid w-full max-w-6xl gap-6 md:grid-cols-3">
            {displayedPlans.map(renderPlanCard)}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm">
            <CardHeader className="border-b bg-muted/30 pb-8">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border-primary/20">Comparison</Badge>
              </div>
              <CardTitle className="text-2xl space-mono-regular">Compare features</CardTitle>
              <CardDescription className="fira-mono-regular">Detailed breakdown of quotas and capabilities across all tiers.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <div className="min-w-[800px]">
                <table className="w-full border-separate border-spacing-0">
                  <thead className="bg-muted/50">
                    <tr className="space-mono-regular">
                      <th className="py-5 px-6 text-left font-semibold text-sm border-b border-zinc-200 dark:border-zinc-800">Feature</th>
                      {plans.map((plan) => (
                        <th key={plan.id} className="py-5 px-6 text-center font-semibold text-sm border-b border-zinc-200 dark:border-zinc-800">
                          <div className="flex flex-col items-center gap-1">
                            <span>{plan.name}</span>
                            {plan.id === activePlanId && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1 bg-primary/5 text-primary border-primary/20">Current</Badge>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="fira-mono-regular">
                    {[
                      {
                        category: "Quotas",
                        items: [
                          { label: "Monthly Requests", free: "100", starter: "5,000", enterprise: "15,000" },
                          { label: "Total Storage Pool", free: "50 MB", starter: "5 GB", enterprise: "20 GB" },
                        ]
                      },
                      {
                        category: "Capabilities",
                        items: [
                          { label: "Vector Databases", free: "Chroma", starter: "Chroma, Pinecone", enterprise: "Chroma, Pinecone, Weaviate" },
                          { label: "AI Providers", free: "3 Providers", starter: "All (+ Anthropic)", enterprise: "All (+ Dedicated)" },
                          { label: "Embedding Models", free: "2 Models", starter: "All (+ Pro)", enterprise: "All (+ Ultra)" },
                          { label: "Analytics Dashboard", free: true, starter: "Pro Analytics", enterprise: "Enterprise SIEM" },
                          { label: "API Access", free: true, starter: true, enterprise: true },
                        ]
                      },
                      {
                        category: "Support",
                        items: [
                          { label: "Support Level", free: "Community", starter: "Standard (24h)", enterprise: "Priority (Instant)" },
                          { label: "White-labeling", free: false, starter: true, enterprise: true },
                        ]
                      }
                    ].map((section, sIdx) => (
                      <React.Fragment key={section.category}>
                        <tr className="bg-zinc-50 dark:bg-zinc-900/50">
                          <td colSpan={plans.length + 1} className="py-3 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 border-b border-zinc-200 dark:border-zinc-800">
                            {section.category}
                          </td>
                        </tr>
                        {section.items.map((row, rIdx) => (
                          <tr key={row.label} className="group hover:bg-muted/30 transition-colors">
                            <td className="py-4 px-6 text-sm font-medium border-b border-zinc-200 dark:border-zinc-800">{row.label}</td>
                            {plans.map((plan) => {
                              const planKey = (plan.id === 'free' ? 'free' : plan.id === 'startup_monthly' ? 'starter' : 'enterprise') as keyof typeof row;
                              const val = row[planKey];
                              return (
                                <td key={`${row.label}-${plan.id}`} className="py-4 px-6 text-center text-sm border-b border-zinc-200 dark:border-zinc-800">
                                  {typeof val === "boolean" ? (
                                    val ? (
                                      <Check className="mx-auto h-4 w-4 text-emerald-500" strokeWidth={3} />
                                    ) : (
                                      <Minus className="mx-auto h-4 w-4 text-zinc-300 dark:text-zinc-700" />
                                    )
                                  ) : (
                                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">{val as string}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t py-6 justify-center">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Sparkle className="h-3 w-3 text-primary" />
                Enterprise plans include custom contracting and service level agreements (SLAs).
              </p>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Terms & Conditions / Billing Information */}
        <motion.div variants={itemVariants}>
          <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                <div className="flex-1">
                  <CardTitle className="text-lg space-mono-regular">Billing Terms & Conditions</CardTitle>
                  <CardDescription className="mt-1 fira-mono-regular">Important information about how subscriptions and billing work</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground space-mono-regular">Recurring Monthly Billing</p>
                    <p className="text-muted-foreground mt-1 fira-mono-regular">
                      When you subscribe to a paid plan (e.g., $49/month), your payment card will be automatically charged
                      <strong className="text-foreground"> every month</strong> on the same date until you cancel. This ensures uninterrupted access to your plan's features.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Automatic Renewal Process</p>
                    <p className="text-muted-foreground mt-1">
                      Your subscription automatically renews each month. Stripe will charge your saved payment method
                      and your plan access continues seamlessly. You'll receive an email receipt for each successful payment.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CircleSlash2 className="h-4 w-4 text-rose-600 dark:text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Immediate Cancellation Policy</p>
                    <p className="text-muted-foreground mt-1">
                      You can cancel your subscription anytime from your dashboard or Stripe billing portal.
                      <strong className="text-foreground"> Upon cancellation, you will be immediately downgraded to the Free tier</strong>,
                      and no further charges will occur. There are no cancellation fees.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Payment Failure Handling</p>
                    <p className="text-muted-foreground mt-1">
                      If a monthly payment fails (e.g., insufficient funds, expired card), Stripe will automatically retry the charge
                      multiple times using Smart Retries. If all retry attempts fail, your subscription will be cancelled and you'll be
                      <strong className="text-foreground"> automatically downgraded to the Free tier</strong>. Update your payment method in the billing portal to reactivate.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Reactivation</p>
                    <p className="text-muted-foreground mt-1">
                      After cancellation, you can reactivate your subscription anytime through the "Manage Billing" portal or by
                      clicking "Upgrade" again. Your previous payment method will be used for the new subscription.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground space-mono-regular">Secure Payment Processing</p>
                    <p className="text-muted-foreground mt-1 fira-mono-regular">
                      All payments are securely processed through Stripe, a PCI Level 1 certified payment provider.
                      We never store your credit card information. Your payment details are encrypted and handled exclusively by Stripe.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-amber-200 dark:border-amber-900">
                <p className="text-xs text-muted-foreground">
                  By subscribing, you agree to these billing terms. You acknowledge that your subscription will automatically renew each month
                  until cancelled. For any billing questions or issues, please contact our support team.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>



      </motion.div>

    </>
  )
}
