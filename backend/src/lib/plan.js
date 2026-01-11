import MODEL_ACCESS from "./model-access.json" with { type: "json" };

const NORMALIZED_MODEL_ACCESS = Object.entries(MODEL_ACCESS).reduce((acc, [provider, details]) => {
  const free = Array.isArray(details.freeModels) ? details.freeModels.map((id) => id.toLowerCase()) : [];
  const paid = Array.isArray(details.paidModels) ? details.paidModels.map((id) => id.toLowerCase()) : [];
  acc[provider] = { free, paid };
  return acc;
}, {});

const BASE_PLANS = {
  free: {
    id: "free",
    displayName: "Free",
    badge: "Hobby",
    description: "Best for hobby projects and testing the platform.",
    currency: "usd",
    monthlyPrice: 0,
    questionLimit: 100,
    chatbotLimit: 0, // Unlimited
    storageLimitMb: 50,
    vectorStores: ["chroma"],
    providers: ["openai", "google", "deepseek", "glm"],
    embeddingModels: ["openai-small", "huggingface"],
    analytics: true,
    support: "community",
    watermark: "powered-by-krira",
    features: [
      "Unlimited pipelines",
      "100 requests / month",
      "50 MB total storage pool",
      "Internal vector DB",
      "Internal embedding model",
      "Analytics dashboard",
      "Community support",
    ],
    billingCycle: "monthly",
    isFree: true,
  },
  startup_monthly: {
    id: "startup_monthly",
    displayName: "Starter",
    badge: "Most popular",
    description: "For individuals and teams that need higher storage.",
    currency: "usd",
    monthlyPrice: 49,
    questionLimit: 5000,
    chatbotLimit: 0, // Unlimited
    storageLimitMb: 5120, // 5 GB
    vectorStores: ["chroma", "pinecone"],
    providers: ["openai", "anthropic", "google", "perplexity", "grok", "deepseek", "glm"],
    embeddingModels: ["openai-small", "openai-large", "huggingface"],
    analytics: true,
    support: "priority-email",
    watermark: "custom",
    features: [
      "Unlimited pipelines",
      "5,000 requests / month",
      "5 GB total storage pool",
      "Bring your own vector store",
      "Bring your own embedding model",
      "Full analytics + API",
      "Standard email support",
    ],
    billingCycle: "monthly",
    isFree: false,
  },
  enterprise_monthly: {
    id: "enterprise_monthly",
    displayName: "Enterprise",
    badge: "Maximum Power",
    description: "For teams that need massive infrastructure and storage.",
    currency: "usd",
    monthlyPrice: 200,
    questionLimit: 15000,
    chatbotLimit: 0, // Unlimited
    storageLimitMb: 20480, // 20 GB
    vectorStores: ["chroma", "pinecone"],
    providers: ["openai", "anthropic", "google", "perplexity", "grok", "deepseek", "glm"],
    embeddingModels: ["openai-small", "openai-large", "huggingface"],
    analytics: true,
    support: "priority-email",
    watermark: "custom",
    features: [
      "Unlimited pipelines",
      "15,000 requests / month",
      "20 GB total storage pool",
      "Bring your own vector store",
      "Bring your own embedding model",
      "Full analytics + API",
      "Priority email support",
    ],
    billingCycle: "monthly",
    isFree: false,
  },
};

export const PLAN_CONFIG = BASE_PLANS;

export const getPlanDefinition = (planId = "free") => {
  return PLAN_CONFIG[planId] ?? PLAN_CONFIG.free;
};

export const isPaidPlan = (planId = "free") => {
  return !getPlanDefinition(planId).isFree;
};

export const getPlanCatalog = () => {
  return Object.values(PLAN_CONFIG).map((plan) => ({
    id: plan.id,
    name: plan.displayName,
    description: plan.description,
    badge: plan.badge,
    monthlyPrice: plan.monthlyPrice,
    annualPrice: plan.annualPrice ?? null,
    currency: plan.currency,
    features: plan.features,
    comingSoon: Boolean(plan.comingSoon),
    billingCycle: plan.billingCycle,
    isFree: Boolean(plan.isFree),
    requestLimit: plan.questionLimit,
    pipelineLimit: plan.chatbotLimit,
    storageLimitMb: plan.storageLimitMb,
    providers: plan.providers,
    vectorStores: plan.vectorStores,
    embeddingModels: plan.embeddingModels,
  }));
};

const getNormalizedModelId = (modelId = "") => modelId.trim().toLowerCase();

const getFreeModelsForProvider = (provider) => {
  const entry = NORMALIZED_MODEL_ACCESS[provider];
  return entry ? entry.free : [];
};

export const filterModelsForPlan = (planId, provider, models = []) => {
  const plan = getPlanDefinition(planId);
  if (!plan.isFree) {
    return models;
  }

  const allowed = getFreeModelsForProvider(provider);
  if (allowed.length === 0) {
    return models.filter((model) => {
      const normalized = getNormalizedModelId(model.id);
      const entry = NORMALIZED_MODEL_ACCESS[provider];
      if (!entry) return true;
      if (entry.paid.length === 0) return true;
      return !entry.paid.includes(normalized);
    });
  }

  return models.filter((model) => allowed.includes(getNormalizedModelId(model.id)));
};

export const assertProviderAccess = (planId, provider) => {
  const plan = getPlanDefinition(planId);
  if (plan.providers && !plan.providers.includes(provider)) {
    const error = new Error(`Provider ${provider} is not available for your plan.`);
    error.statusCode = 403;
    throw error;
  }
};

export const assertEmbeddingAccess = (planId, embeddingModel) => {
  const plan = getPlanDefinition(planId);
  if (plan.embeddingModels && !plan.embeddingModels.includes(embeddingModel)) {
    const error = new Error(`Embedding model ${embeddingModel} requires a higher plan.`);
    error.statusCode = 403;
    throw error;
  }
};

export const assertVectorStoreAccess = (planId, vectorStore) => {
  const plan = getPlanDefinition(planId);
  if (plan.vectorStores && !plan.vectorStores.includes(vectorStore)) {
    const error = new Error(`Vector store ${vectorStore} is not available for your plan.`);
    error.statusCode = 403;
    throw error;
  }
};

export const assertModelAccess = (planId, provider, modelId) => {
  const plan = getPlanDefinition(planId);
  if (!plan.isFree) {
    return;
  }

  const allowed = getFreeModelsForProvider(provider);
  if (allowed.length === 0) {
    const entry = NORMALIZED_MODEL_ACCESS[provider];
    if (!entry || entry.paid.length === 0) {
      return;
    }
    if (entry.paid.includes(getNormalizedModelId(modelId))) {
      const error = new Error(`Model ${modelId} requires a paid plan.`);
      error.statusCode = 403;
      throw error;
    }
    return;
  }

  if (!allowed.includes(getNormalizedModelId(modelId))) {
    const error = new Error(`Model ${modelId} requires a paid plan.`);
    error.statusCode = 403;
    throw error;
  }
};
