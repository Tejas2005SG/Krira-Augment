"""
Test deployed endpoints to verify the issue
"""
import requests
import json

# Your actual deployed URLs
NODE_BACKEND = "https://rag-backend-k46a.onrender.com"
PYTHON_BACKEND = "https://rag-python-backend.onrender.com"

API_KEY = "sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432"
BOT_ID = "employee3"

# Service secret (from .env)
SERVICE_SECRET = "krira-shared-service-key"

print("=" * 80)
print("Testing Deployed Endpoints")
print("=" * 80)

# Test 1: Python backend health
print("\n1. Testing Python backend health...")
try:
    response = requests.get(f"{PYTHON_BACKEND}/health", timeout=10)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   ✓ Response: {response.json()}")
    else:
        print(f"   ❌ Error: {response.text}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Node backend API key verification
print("\n2. Testing Node backend API verification...")
try:
    headers = {
        "Content-Type": "application/json",
        "x-service-key": SERVICE_SECRET
    }
    payload = {
        "apiKey": API_KEY,
        "botId": BOT_ID
    }
    
    response = requests.post(
        f"{NODE_BACKEND}/api/keys/verify",
        json=payload,
        headers=headers,
        timeout=10
    )
    
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ API key verified!")
        
        bot = data.get('bot', {})
        embedding = bot.get('embedding', {})
        
        print(f"\n   Bot Configuration:")
        print(f"     Name: {bot.get('name')}")
        print(f"     Vector Store: {embedding.get('vectorStore')}")
        print(f"     Dataset IDs: {embedding.get('datasetIds')}")
        print(f"     Pinecone Index: {embedding.get('pineconeConfig', {}).get('indexName')}")
        
        if not embedding.get('datasetIds'):
            print(f"\n   ❌ CRITICAL: No dataset IDs configured!")
        else:
            print(f"\n   ✓ Configuration looks good")
            
    else:
        print(f"   ❌ Error: {response.text}")
        
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: SDK chat request
print("\n3. Testing SDK chat request to Python backend...")
try:
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "bot_id": BOT_ID,
        "query": "give me employees name who has excellent performance"
    }
    
    response = requests.post(
        f"{PYTHON_BACKEND}/v1/chat",
        json=payload,
        headers=headers,
        timeout=30
    )
    
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Chat request succeeded!")
        print(f"\n   Answer: {data.get('answer')}")
        
        if "not available in the provided context" in data.get('answer', '').lower():
            print(f"\n   ⚠️  Getting 'not available' response - issue with context retrieval")
    else:
        print(f"   ❌ Error: {response.text}")
        
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "=" * 80)
