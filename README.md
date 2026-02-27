# Krira Augment - Production Grade RAG in Minutes

A comprehensive platform for building, training, and deploying custom AI chatbots using Retrieval-Augmented Generation (RAG).

## Overview

Krira Augment enables developers and businesses to create intelligent AI assistants grounded in their own data. Upload documents, configure embedding and chunking strategies, connect to LLMs, and deploy via API.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│                     http://localhost:3000                        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐           ┌──────▼──────┐
              │  Backend  │           │  Python AI   │
              │  (Express)│           │   Backend   │
              │   :3001   │───────────│   (FastAPI) │
              └───────────┘           │    :8000    │
                                      └─────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | Next.js 16, React 19, Tailwind CSS, Radix UI, Framer Motion |
| Backend API | Node.js (Express 5), MongoDB, Redis (Upstash) |
| AI Processing | Python (FastAPI), LangChain, OpenAI, Anthropic |
| Vector Stores | Pinecone, Chroma |
| Embeddings | OpenAI, HuggingFace, Sentence Transformers |
| Authentication | JWT, Google OAuth |
| Payments | Stripe |

## Project Structure

```
krira-augment/
├── backend/              # Node.js REST API
│   └── src/
│       ├── controllers/  # Route handlers
│       ├── models/        # MongoDB schemas
│       ├── routes/       # API endpoints
│       ├── services/     # Business logic
│       ├── utils/        # Helpers (email, redis, token)
│       ├── lib/          # Config, embedding models, plans
│       └── middlewares/  # Auth, service auth
├── frontend/             # Next.js web application
│   ├── app/             # App router pages
│   ├── components/      # React components
│   ├── lib/            # Utilities
│   └── public/         # Static assets
├── python-backend/      # FastAPI AI processing
│   └── main.py         # RAG endpoints
├── krira-chunker/      # Rust-based text chunking library
├── kriralabs-sdk/      # Python SDK for API integration
└── uploads/            # User uploaded files
```

## Features

- **Data Ingestion**: Upload PDFs, CSVs, JSON files or scrape websites
- **RAG Pipeline**: Configurable chunking, embeddings, and vector storage
- **Multi-LLM Support**: OpenAI, Anthropic, Google, DeepSeek, Perplexity
- **Playground**: Test chatbots interactively
- **Evaluation**: Upload golden datasets for automated metrics
- **API Access**: Programmatic access with API keys
- **Usage Analytics**: Track requests, storage, and limits

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.13+
- MongoDB
- Redis (Upstash)
- API keys: OpenAI, Pinecone, Stripe

### Environment Variables

Create `.env` files in each service:

**backend/.env**
```
MONGODB_URI=...
JWT_SECRET=...
REDIS_REST_URL=...
STRIPE_SECRET_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=
```

**python-backend/.env**
```
OPENAI_API_KEY=...
PINECONE_API_KEY=...
```

### Installation

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npm run dev

# Python Backend
cd python-backend && uv sync && uvicorn main:app --reload
```

### Running Services

| Service | URL | Command |
|---------|-----|---------|
| Frontend | http://localhost:3000 | `npm run dev` (frontend) |
| Backend API | http://localhost:3001 | `npm run dev` (backend) |
| Python Backend | http://localhost:8000 | `uvicorn main:app --reload` |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/google` - Google OAuth

### Chatbots
- `GET /api/chatbots` - List chatbots
- `POST /api/chatbots` - Create chatbot
- `GET /api/chatbots/:id` - Get chatbot
- `PUT /api/chatbots/:id` - Update chatbot
- `DELETE /api/chatbots/:id` - Delete chatbot

### Datasets
- `POST /api/datasets/upload` - Upload file
- `POST /api/datasets/scrape` - Scrape URL
- `GET /api/datasets/:id` - Get dataset

### Chat
- `POST /v1/chat` - Send message (public API)

### Billing
- `GET /api/billing/portal` - Stripe portal
- `POST /api/billing/webhook` - Stripe webhook

## SDK Usage

```python
from krira_augment import KriraAugment

client = KriraAugment(
    api_key="your-api-key",
    pipeline_name="my-chatbot"
)

response = client.ask("What is your return policy?")
print(response.answer)
```

## ScreenShots

<img width="1919" height="1089" alt="Screenshot 2026-02-14 184034" src="https://github.com/user-attachments/assets/fa692ffe-4332-4805-8956-5143eb1146f6" />

<img width="1919" height="1088" alt="Screenshot 2026-02-14 184728" src="https://github.com/user-attachments/assets/bb6d79cc-4fc5-4655-adfe-6c7109d83ae4" />

<img width="1919" height="1090" alt="Screenshot 2026-02-14 184826" src="https://github.com/user-attachments/assets/97f87a1a-f894-4ef1-922c-e9132786e550" />

<img width="1919" height="1091" alt="Screenshot 2026-02-14 184918" src="https://github.com/user-attachments/assets/de120e89-02f0-408b-8f30-b3bae38e6cff" />

<img width="1919" height="1091" alt="Screenshot 2026-02-14 184955" src="https://github.com/user-attachments/assets/0c5d1629-9ed0-4657-ac2c-b3a04b25399d" />

<img width="1919" height="1091" alt="Screenshot 2026-02-14 185011" src="https://github.com/user-attachments/assets/c392dcfc-f136-4fc9-ae70-4ad0359b6c12" />

<img width="1919" height="1083" alt="Screenshot 2026-02-14 185204" src="https://github.com/user-attachments/assets/3566d92b-cb18-44ca-9d50-13004775d4b2" />

<img width="1919" height="1089" alt="Screenshot 2026-02-14 185247" src="https://github.com/user-attachments/assets/35c94e2b-b335-48c7-9a30-30be2fd6ed2e" />

<img width="1551" height="928" alt="Screenshot 2026-02-14 185301" src="https://github.com/user-attachments/assets/392ba7cc-f881-4e20-95c7-1e3fbaa41705" />

