import { FileDatasetType, LLMProviderId, LLMModelOption } from "./types"

export const FILE_DATASET_TYPES: FileDatasetType[] = ["csv", "json", "pdf"]

export const STEPS = [
  { title: "Create Chatbot", subtitle: "Name your assistant" },
  { title: "Upload Dataset", subtitle: "Ingest your knowledge sources" },
  { title: "Configure Embedding", subtitle: "Select embeddings and storage" },
  { title: "Choose LLM", subtitle: "Connect provider and prompt" },
  { title: "Test & Evaluate", subtitle: "Measure accuracy and quality" },
  { title: "Deploy Chatbot", subtitle: "Customize and ship your bot" },
]

export const EMBEDDING_MODELS = [
  {
    id: "openai-small",
    name: "OpenAI Small",
    badge: "Paid",
    dimensions: 1536,
    // price: "$0.0004 / 1K tokens",
    description: "Great for lightweight semantic search and FAQs.",
    useCases: "Best for knowledge bases and support bots.",
    notes: "Requires OpenAI API access.",
    icon: "/openai.svg",
  },
  {
    id: "openai-large",
    name: "OpenAI Large",
    badge: "Paid",
    dimensions: 3072,
    // price: "$0.0008 / 1K tokens",
    description: "High dimensional embeddings for complex retrieval.",
    useCases: "Recommended for enterprise assistants.",
    notes: "Higher recall with larger context windows.",
    icon: "/openai.svg",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    badge: "Free",
    dimensions: 384,
    // price: "Free",
    description: "Open-source small footprint embeddings for free use.",
    useCases: "Ideal for experimentation and MVPs.",
    notes: "Runs on Krira AI managed infrastructure.",
    icon: "/huggingface.svg",
  },
]

export const LLM_PROVIDERS: Array<{ value: LLMProviderId; label: string; logo: string }> = [
  {
    value: "openai",
    label: "OpenAI",
    
    logo: "/openai.svg",
  },
  {
    value: "anthropic",
    label: "Anthropic",
    
    logo: "/anthropic-logo.webp",
  },
  {
    value: "google",
    label: "Google ",
    
    logo: "/google-logo.png",
  },
  {
    value: "grok",
    label: "xAI",
    
    logo: "/xai-logo.webp",
  },
  {
    value: "deepseek",
    label: "DeepSeek",
    
    logo: "/deepseek-logo.png",
  },
  {
    value: "perplexity",
    label: "Perplexity",
    
    logo: "/perplexity-logo.png",
  },
  {
    value: "glm",
    label: "z-ai",
    
    logo: "/glm-logo.png",
  },
]

// Frontend-side defaults in case the backend does not return configured models.
export const DEFAULT_FRONTEND_MODELS: Record<LLMProviderId, LLMModelOption[]> = {
  openai: [
    { id: "openai/gpt-5", label: "GPT 5", badge: "Paid" },
    { id: "openai/gpt-oss-120b", label: "GPT OSS 120B" },
    { id: "openai/gpt-5.1", label: "GPT 5.1", badge: "Paid" },
    { id: "openai/gpt-4.1", label: "GPT 4.1", badge: "Free" },
  ],
  anthropic: [
    { id: "anthropic/claude-4.5-sonnet", label: "Claude 4.5 Sonnet", badge: "Paid" },
    { id: "anthropic/claude-3-7-sonnet-20250219:thinking", label: "Claude 3.7 Sonnet" },
    { id: "anthropic/claude-opus-4.1", label: "Claude Opus 4.1", badge: "Paid" },
    { id: "anthropic/claude-opus-4-20250514", label: "Claude Opus 4", badge: "Paid" },
  ],
  google: [
    { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", badge: "Paid" },
    { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Free" },
  ],
  grok: [
    { id: "x-ai/grok-4", label: "Grok 4", badge: "Paid" },
    { id: "x-ai/grok-3-mini-beta", label: "Grok 3 Mini", badge: "Paid" },
  ],
  deepseek: [
    { id: "deepseek-ai/DeepSeek-R1", label: "DeepSeek R1" },
    { id: "deepseek/deepseek-v3.1", label: "DeepSeek v3.1", badge: "Paid" },
  ],
  perplexity: [
    { id: "perplexity/sonar-reasoning-pro", label: "Sonar Reasoning Pro", badge: "Paid" },
    { id: "perplexity/sonar-pro", label: "Sonar Pro", badge: "Paid" },
    { id: "perplexity/sonar-deep-research", label: "Sonar Deep Research", badge: "Paid" },
  ],
  glm: [
    { id: "z-ai/glm-4.6", label: "GLM 4.6", badge: "Free" },
    { id: "z-ai/glm-4.5", label: "GLM 4.5", badge: "Free" },
  ],
}

export const CODE_SNIPPETS: Record<string, { language: string; code: string }> = {
  javascript: {
    language: "tsx",
    code: `import { KriraChatbot } from "kriraai";

export function App() {
  return (
    <KriraChatbot
      apiKey={process.env.NEXT_PUBLIC_KRIRA_KEY!}
      botId="support-pro-bot"
      theme="pro"
    />
  );
}`,
  },
  python: {
    language: "python",
    code: `from krira import KriraChatbot\n\nchatbot = KriraChatbot(api_key="YOUR_KEY", bot_id="support-pro-bot")\nresponse = chatbot.ask("How do I reset my password?")\nprint(response.answer)\n`,
  },
  curl: {
    language: "bash",
    code: `curl https://api.krira.ai/v1/chatbots/support-pro-bot/messages \
  -H "Authorization: Bearer $KRIRA_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message":"How can I update billing?"}'`,
  },
}

export const MAX_CONTEXT_PREVIEW = 5
