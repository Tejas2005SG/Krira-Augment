"""
Direct test of chat endpoint to see actual error
"""
import requests
import json

url = "http://localhost:8000/v1/chat"
headers = {
    "Authorization": "Bearer sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432",
    "Content-Type": "application/json"
}
payload = {
    "bot_id": "employee3",
    "query": "give me employees name who has excellent performance"
}

print(f"POST {url}")
print(f"Payload: {json.dumps(payload, indent=2)}")
print("\nSending request...")

try:
    response = requests.post(url, json=payload, headers=headers, timeout=30)
    
    print(f"\nStatus: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✓ Answer: {data.get('answer')}")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
