"""
Test if local Python can reach deployed Node backend
"""
import requests

print("Testing if local machine can reach deployed Node backend...")

url = "https://rag-backend-k46a.onrender.com/api/keys/verify"
headers = {
    "Content-Type": "application/json",
    "x-service-key": "krira-shared-service-key"
}
payload = {
    "apiKey": "sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432",
    "botId": "employee3"
}

try:
    print(f"\nPOST {url}")
    response = requests.post(url, json=payload, headers=headers, timeout=15)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✓ Can reach deployed backend successfully!")
        data = response.json()
        print(f"Bot: {data.get('bot', {}).get('name')}")
    else:
        print(f"❌ Error: {response.text}")
        
except Exception as e:
    print(f"❌ Cannot reach deployed backend: {e}")
