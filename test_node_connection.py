"""
Test if Python backend can reach Node backend for verification
"""
import requests
import json

# Try both http and https
urls_to_try = [
    "http://localhost:5000/api/keys/verify",
    "https://localhost:5000/api/keys/verify",
]

headers = {
    "Content-Type": "application/json",
    "x-service-key": "krira-shared-service-key"
}

payload = {
    "apiKey": "sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432",
    "botId": "employee3"
}

for url in urls_to_try:
    print(f"\nTrying: {url}")
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=5, verify=False)
        print(f"  Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"  ✓ Success!")
            print(f"  Bot: {data.get('bot', {}).get('name')}")
            print(f"  Dataset IDs: {data.get('bot', {}).get('embedding', {}).get('datasetIds')}")
            break
        else:
            print(f"  ❌ Error: {response.text}")
    except requests.exceptions.SSLError:
        print(f"  ❌ SSL Error (probably doesn't support https)")
    except requests.exceptions.ConnectionError as e:
        print(f"  ❌ Connection Error: {e}")
    except Exception as e:
        print(f"  ❌ Error: {e}")
