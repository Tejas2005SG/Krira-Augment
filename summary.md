# Krira AI Application Summary

## Overview
Krira AI is a comprehensive platform designed to help developers and businesses build, train, and deploy custom AI chatbots using Retrieval-Augmented Generation (RAG). It allows users to ingest their own data (documents, websites), process it into vector embeddings, and connect it to powerful Large Language Models (LLMs) to create intelligent assistants that understand their specific context.

## Core Value Proposition
- **Custom Knowledge Base**: Train AI on your proprietary data (PDFs, CSVs, JSON, Websites) without fine-tuning.
- **No-Code/Low-Code Pipeline**: Visual interface to manage the complex RAG workflow (Chunking, Embedding, Vector Storage).
- **Model Agnostic**: Support for multiple LLM providers (OpenAI, Anthropic, Google, DeepSeek, Perplexity) and embedding models.
- **Evaluation & Testing**: Built-in tools to evaluate chatbot performance with metrics and test questions.
- **Easy Deployment**: Simple API integration to embed chatbots into any application.

## Pricing Models

### Free Plan
*   **Cost**: $0 / month
*   **Target**: Individuals, Developers experimenting
*   **Includes**:
    *   1 RAG Pipeline
    *   100 Monthly Requests
    *   50MB Cloud Storage
    *   Basic Analytics Dashboard
    *   Email and Chat Support
    *   Providers: OpenAI, Google, DeepSeek
    *   Vector Stores: Chroma
    *   Embedding Models: OpenAI Mini, HuggingFace Base

### Starter Plan (Pro/Startup)
*   **Cost**: $49 / month (referenced as "Starter" in code, $19/$29 in some UI mocks, likely $49 is current backend config)
*   **Target**: Startups, Power Users
*   **Includes**:
    *   3 RAG Pipelines
    *   5,000 Monthly Requests
    *   500MB Cloud Storage
    *   Premium Provider Access (Anthropic, Perplexity)
    *   Vector Stores: Pinecone, Chroma
    *   Embedding Models: OpenAI Pro, HuggingFace Base
    *   Priority Support

## Key Features

### 1. Dashboard & Analytics
*   **Usage Tracking**: Monitor requests, storage usage, and pipeline limits.
*   **Visual Reports**: Progress bars and charts for quota management.
*   **Billing Management**: Integrated Stripe portal for subscription management.

### 2. Data Ingestion (Dataset)
*   **Multi-Format Support**: Upload PDF, CSV, JSON files.
*   **Web Scraping**: Ingest content directly from website URLs.
*   **Preview**: View how data is parsed before processing.

### 3. RAG Pipeline Configuration
*   **Chunking Strategy**: Customize chunk size (e.g., 1000 tokens) and overlap (e.g., 200 tokens) for optimal retrieval.
*   **Embedding Models**: Choose between cost-effective (HuggingFace) and high-performance (OpenAI) embedding models.
*   **Vector Database**: Store embeddings in **Pinecone** (managed, scalable) or **Chroma** (local/self-hosted).

### 4. LLM Integration
*   **Provider Selection**: Switch between models like GPT-4, Claude 3.5 Sonnet, Gemini Pro.
*   **System Prompting**: Customize the bot's personality and instructions (e.g., "You are a helpful support assistant").
*   **Temperature/Top-K**: Fine-tune response creativity and retrieval precision.

### 5. Evaluation & Testing
*   **Playground**: Test the chatbot interactively within the dashboard.
*   **Automated Evaluation**: Upload a "Golden Dataset" (CSV with Q&A pairs) to run automated metrics.
*   **Metrics**: Measure retrieval accuracy and response quality.

### 6. Deployment
*   **API Access**: Secure API keys to query your chatbot programmatically.
*   **Integration Snippets**: Ready-to-use code for Python and JavaScript/TypeScript.
*   **Chat Widget**: (Planned) Embeddable UI widget for websites.

## How to Create a RAG Pipeline (Step-by-Step)

Based on the application workflow, here are the 6 key steps to build your AI assistant:

1.  **Create Chatbot**
    *   *Subtitle*: "Name your assistant"
    *   **Action**: Give your chatbot a unique name (e.g., "Support Bot") to initialize the project.

2.  **Upload Dataset**
    *   *Subtitle*: "Ingest your knowledge sources"
    *   **Action**: Upload your source data files (PDF, CSV, JSON) or provide website URLs to scrape. This forms the knowledge base for your AI.

3.  **Configure Embedding**
    *   *Subtitle*: "Select embeddings and storage"
    *   **Action**:
        *   Define **Chunk Size** and **Overlap** (e.g., 1000/200) to optimize how text is split.
        *   Choose an **Embedding Model** (e.g., OpenAI, HuggingFace) to convert text into vectors.
        *   Select a **Vector Store** (e.g., Pinecone, Chroma) to store these vectors for fast retrieval.

4.  **Choose LLM**
    *   *Subtitle*: "Connect provider and prompt"
    *   **Action**:
        *   Select the **LLM Provider** (OpenAI, Anthropic, etc.) and **Model** (GPT-4, Claude 3.5).
        *   Configure the **System Prompt** to define the bot's personality and instructions.

5.  **Test & Evaluate**
    *   *Subtitle*: "Measure accuracy and quality"
    *   **Action**:
        *   Use the playground to chat with your bot manually.
        *   Run automated evaluations using a "Golden Dataset" to measure retrieval accuracy and response quality.

6.  **Deploy Chatbot**
    *   *Subtitle*: "Customize and ship your bot"
    *   **Action**:
        *   Finalize the pipeline to lock your configuration.
        *   Get your API Key and integration snippets.
        *   Customize branding (if applicable) and integrate the bot into your application.

## Technical Architecture
*   **Frontend**: Next.js 14 (React), Tailwind CSS, Lucide Icons, Framer Motion (animations).
*   **Backend**: Node.js (Express) for API/Auth, Python (FastAPI/Flask) for AI processing.
*   **Database**: MongoDB (User data, Chatbot metadata), Redis (Caching/Queues).
*   **AI/ML**: LangChain (Orchestration), OpenAI/Anthropic APIs, Pinecone/Chroma (Vector DB).

## User Benefits
*   **Efficiency**: Reduces the time to build a custom AI bot from weeks to minutes.
*   **Accuracy**: RAG ensures answers are grounded in your actual data, reducing hallucinations.
*   **Scalability**: Built on scalable infrastructure (Pinecone, Cloud Storage) to handle growing data and traffic.
*   **Flexibility**: Swap models and providers as new, better ones are released without rewriting code.
