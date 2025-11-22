"""
Test SDK with fixed local Python backend
"""
import sys
sys.path.insert(0, r'c:\Users\Tejas\Desktop\kriraai\kriralabs-sdk')

from kriralabs import Kriralabs
import time

print("Waiting for Python backend to start...")
time.sleep(3)

print("\nTesting SDK with LOCAL Python backend (fixed .env)...")

try:
    client = Kriralabs(
        api_key="sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432",
        bot_id="employee3",
        base_url="http://localhost:8000/v1"
    )
    
    print("Sending question: 'give me employees name who has excellent performance'")
    response = client.ask("give me employees name who has excellent performance")
    
    print(f"\n{'='*80}")
    print(f"ANSWER: {response.answer}")
    print(f"{'='*80}")
    
    if "not available in the provided context" in response.answer.lower():
        print("\n⚠️ Still getting 'not available' response")
        print("\nThis means:")
        print("  ✓ SDK is working")
        print("  ✓ API verification is working")
        print("  ✓ Python backend can reach Node backend")
        print("  ❌ BUT: No relevant chunks found in Pinecone")
        print("\nPossible causes:")
        print("  1. Data was not uploaded to Pinecone")
        print("  2. Dataset ID mismatch")
        print("  3. Pinecone namespace issue")
    else:
        print("\n✓✓✓ SUCCESS! Got a real answer from the data!")
    
    client.close()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
