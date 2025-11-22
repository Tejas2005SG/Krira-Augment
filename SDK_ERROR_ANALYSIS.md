# Krira Labs Python SDK Error Analysis

## Problem Summary
When using the Python SDK to query the bot with ID "employee3", you're receiving:
```
The information is not available in the provided context.
```

This indicates that the RAG pipeline is executing but **no relevant context/chunks are being retrieved from Pinecone**.

## SDK Flow Analysis

### 1. **SDK Client (`kriralabs SDK`)**
**File:** `kriralabs-sdk/kriralabs/client.py`

- Default Base URL: `https://rag-python-backend.onrender.com/v1`
- Endpoint: `/v1/chat` (POST)
- Headers: `Authorization: Bearer {apiKey}`
- Payload:
  ```json
  {
    "bot_id": "employee3",
    "query": "give me employees name who has excellent performance"
  }
  ```

### 2. **Public API Route (`python-backend`)**
**File:** `python-backend/src/api/routes/public_api.py`

The `/v1/chat` endpoint:
1. Extracts Bearer token from Authorization header
2. **Verifies API key** by calling Node.js backend at `API_VERIFICATION_URL`
3. Gets bot configuration (LLM + embedding config) from verification response
4. Calls `llm_service.public_chat()` with the bot configuration

### 3. **API Verification (Node.js Backend)**
**File:** `backend/src/controllers/apiKey.controller.js` (line 180-255)

**Expected URL:** The Python backend is configured to verify at:
- Default: `http://localhost:5000/api/keys/verify` (settings.py line 38)
- **Deployment should use:** `https://your-node-backend-url.com/api/keys/verify`

The verification returns:
```json
{
  "valid": true,
  "permissions": ["chat"],
  "bot": {
    "id": "...",
    "name": "...",
    "dataset": {...},
    "embedding": {
      "vectorStore": "pinecone",
      "model": "text-embedding-3-small",
      "dimension": 1536,
      "datasetIds": ["dataset_id_1", "dataset_id_2"],
      "pineconeConfig": {
        "apiKey": "decrypted_pinecone_key",
        "indexName": "your-index-name",
        "namespace": "your-namespace"
      }
    },
    "llm": {
      "provider": "openai",
      "model": "gpt-4",
      "systemPrompt": "...",
      "topK": 30
    }
  }
}
```

### 4. **LLM Service Public Chat**
**File:** `python-backend/src/services/llm.py` (line 910-993)

The `public_chat` method:
1. Validates provider and model
2. Generates embedding for the question using `embedding_service.generate()`
3. Retrieves context using `vector_store_service.query()`
4. Builds LLM chain and invokes with question + context

### 5. **Vector Store Query (Pinecone)**
**File:** `python-backend/src/services/vectorstores.py` (line 319-379)

The `_query_pinecone` method:
1. Creates Pinecone client with API key
2. Gets index by name
3. Queries with:
   - `vector`: query embedding vector
   - `top_k`: number of results (default 30)
   - `namespace`: Pinecone namespace
   - `filter`: `{"dataset_id": {"$in": datasetIds}}`
4. Returns `RetrievedContext` objects

## Root Cause Analysis

The error "The information is not available in the provided context" means **NO chunks were retrieved from Pinecone**. This can happen due to:

### Issue #1: API Verification URL Configuration ❌
**Problem:** The Python backend is trying to verify API keys at the wrong URL

**Where to check:**
- `python-backend/.env` should have:
  ```env
  API_VERIFICATION_URL=https://your-deployed-backend.onrender.com/api/keys/verify
  ```
  
**Current Default:** `http://localhost:5000/api/keys/verify` (won't work in deployment)

### Issue #2: Bot Configuration Not Complete ❌
**Problem:** The bot "employee3" might not have complete configuration

**What to verify in MongoDB:**
1. The bot must exist with proper configuration
2. Must have `embedding` field with:
   - `vectorStore`: "pinecone"
   - `model`: "text-embedding-3-small"
   - `dimension`: 1536
   - `datasetIds`: Array of dataset IDs that contain your employee data
   - `pineconeConfig`:
     - `apiKey`: Encrypted Pinecone API key
     - `indexName`: Your Pinecone index name
     - `namespace`: Your Pinecone namespace (can be empty string)

3. Must have `llm` field with:
   - `provider`: "openai" (or other)
   - `model`: Model ID
   - `systemPrompt`: System prompt
   - `topK`: Number of chunks to retrieve (e.g., 30)

### Issue #3: Pinecone Index Empty or Wrong namespace ❌
**Problem:** No vectors stored in Pinecone, or stored in different namespace

**What to check:**
1. Log into Pinecone dashboard
2. Check if your index has vectors
3. Check if vectors are in the correct namespace
4. Verify dataset_id metadata matches the configuration

### Issue #4: Dataset IDs Not Uploaded ❌
**Problem:** The `datasetIds` in bot config don't match uploaded data

**What to check:**
1. When you uploaded employee data, it was assigned a dataset ID
2. The bot's `embedding.datasetIds` array must include these IDs
3. The vectors in Pinecone must have metadata: `{"dataset_id": "matching_id"}`

### Issue #5: Wrong Embedding Model Dimension ❌
**Problem:** Mismatch between Pinecone index dimension and embedding model

**What to check:**
- Pinecone index dimension must match embedding model output:
  - `text-embedding-3-small`: 1536 dimensions
  - `text-embedding-3-large`: 3072 dimensions

## Debugging Steps

### Step 1: Check Python Backend Environment Variables
```bash
cd python-backend
# Check if these are set correctly:
# - FASTROUTER_API_KEY
# - API_VERIFICATION_URL (must point to deployed Node.js backend)
# - SERVICE_API_SECRET (must match Node.js backend X-SERVICE-KEY)
```

### Step 2: Test API Key Verification Manually
```bash
# Test if verification endpoint is accessible
curl -X POST https://your-backend-url.com/api/keys/verify \
  -H "Content-Type: application/json" \
  -H "x-service-key: YOUR_SERVICE_SECRET" \
  -d '{
    "apiKey": "sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432",
    "botId": "employee3"
  }'
```

### Step 3: Check Bot Configuration in MongoDB
Use MongoDB Compass or shell to query:
```javascript
db.chatbots.findOne({ name: "employee3" })
```

Verify it has:
- `embedding.datasetIds` (not empty)
- `embedding.pineconeConfig.apiKey` (encrypted)
- `embedding.pineconeConfig.indexName`
- `llm.provider` and `llm.model`

### Step 4: Check Pinecone Index
```python
from pinecone import Pinecone

pc = Pinecone(api_key="YOUR_PINECONE_KEY")
index = pc.Index("YOUR_INDEX_NAME")

# Check stats
stats = index.describe_index_stats()
print("Total vectors:", stats)

# Try a query
query_results = index.query(
    vector=[0.1] * 1536,  # dummy vector
    top_k=5,
    include_metadata=True,
    filter={"dataset_id": {"$in": ["YOUR_DATASET_ID"]}}
)
print("Query results:", query_results)
```

### Step 5: Add Logging to Debug
Temporarily add logging to `python-backend/src/services/llm.py` around line 971-978:

```python
if embedding_literal and vector_literal and dataset_id_list:
    try:
        logger.info(f"Generating embedding for question: {question}")
        question_vector = await self._embedding_service.generate(
            embedding_literal,
            [question],
            dimensions=embedding_dimension,
        )
        logger.info(f"Question vector generated, length: {len(question_vector[0])}")
        
        logger.info(f"Querying vector store: {vector_literal}")
        logger.info(f"Dataset IDs: {dataset_id_list}")
        logger.info(f"Pinecone config: index={pinecone.index_name if pinecone else 'None'}, namespace={pinecone.namespace if pinecone else 'None'}")
        
        contexts = await self._retrieve_context(
            vector_literal,
            embedding_literal,
            question_vector[0],
            top_k=max(1, int(top_k) if isinstance(top_k, (int, float)) else 30),
            dataset_ids=dataset_id_list,
            pinecone=pinecone,
        )
        
        logger.info(f"Retrieved {len(contexts)} context chunks")
        for i, ctx in enumerate(contexts[:3]):
            logger.info(f"Context {i}: score={ctx.score}, text={ctx.text[:100]}")
```

## Quick Fix Checklist

- [ ] Verify `API_VERIFICATION_URL` in Python backend `.env` points to deployed Node.js backend
- [ ] Verify `SERVICE_API_SECRET` matches between Python and Node.js backends
- [ ] Verify bot "employee3" exists in MongoDB with complete configuration
- [ ] Verify bot has non-empty `embedding.datasetIds` array
- [ ] Verify Pinecone API key is correctly encrypted in MongoDB
- [ ] Verify Pinecone index exists and has vectors
- [ ] Verify vectors in Pinecone have correct `dataset_id` metadata
- [ ] Verify embedding model dimension matches Pinecone index dimension
- [ ] Test API verification endpoint manually
- [ ] Check Python backend logs for errors during query

## Expected Resolution

Once these issues are fixed, the flow should work as:
1. SDK sends request to Python backend `/v1/chat`
2. Python backend verifies API key with Node.js backend
3. Node.js backend returns bot configuration with decrypted Pinecone key
4. Python backend generates embedding for question
5. Python backend queries Pinecone with proper filters
6. Pinecone returns relevant chunks
7. LLM generates answer using retrieved context
8. SDK receives the answer

## Common Deployment Errors

### URL Configuration
Most likely your deployment has:
- Python backend deployed at: `https://rag-python-backend.onrender.com`
- Node.js backend deployed at: `https://your-node-backend.onrender.com`

But Python backend is trying to verify at `http://localhost:5000/api/keys/verify`

**Fix:** Set environment variable in Render:
```
API_VERIFICATION_URL=https://your-node-backend.onrender.com/api/keys/verify
```

### Service Secret Mismatch
The `SERVICE_API_SECRET` must be the same in both backends so they can communicate securely.

**Fix:** Set the same value in both deployments' environment variables.
