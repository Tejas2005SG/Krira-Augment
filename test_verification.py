import requests
import json

# Test API key verification
NODE_BACKEND = "http://localhost:5000"  # Local backend
API_KEY = "sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432"
BOT_ID = "employee3"

# Get SERVICE_API_SECRET from the backend .env
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv('backend/.env')
SERVICE_SECRET = os.getenv('SERVICE_API_SECRET')

print("Testing API Key Verification...")
print(f"URL: {NODE_BACKEND}/api/keys/verify")
print(f"Service Secret: {SERVICE_SECRET[:10]}..." if SERVICE_SECRET else "NOT FOUND")

headers = {
    "Content-Type": "application/json",
    "x-service-key": SERVICE_SECRET
}

payload = {
    "apiKey": API_KEY,
    "botId": BOT_ID
}

try:
    response = requests.post(
        f"{NODE_BACKEND}/api/keys/verify",
        json=payload,
        headers=headers,
        timeout=10
    )
    
    print(f"\nStatus: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✓ Verification successful!")
        print(json.dumps(data, indent=2))
        
        # Check critical fields
        bot = data.get('bot', {})
        embedding = bot.get('embedding', {})
        
        print("\n=== Critical Check ===")
        print(f"Dataset IDs: {embedding.get('datasetIds')}")
        print(f"Vector Store: {embedding.get('vectorStore')}")
        print(f"Pinecone Index: {embedding.get('pineconeConfig', {}).get('indexName')}")
        
        if not embedding.get('datasetIds'):
            print("\n❌ ISSUE: No dataset IDs returned!")
        else:
            print("\n✓ Dataset IDs present")
            
    else:
        print(f"❌ Verification failed!")
        print(response.text)
        
except Exception as e:
    print(f"❌ Error: {e}")
