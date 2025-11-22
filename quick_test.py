"""
Quick test of API verification
"""
import requests

response = requests.post(
    "https://rag-backend-k46a.onrender.com/api/keys/verify",
    json={
        "apiKey": "sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432",
        "botId": "employee3"
    },
    headers={
        "Content-Type": "application/json",
        "x-service-key": "krira-shared-service-key"
    },
    timeout=15
)

print(f"Status: {response.status_code}")
print(response.text)

if response.status_code == 200:
    import json
    data = response.json()
    embedding = data.get('bot', {}).get('embedding', {})
    print(f"\nDataset IDs: {embedding.get('datasetIds')}")
    print(f"Pinecone Index: {embedding.get('pineconeConfig', {}).get('indexName')}")
