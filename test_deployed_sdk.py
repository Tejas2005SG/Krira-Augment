"""
Test SDK with DEPLOYED Python backend (the actual production setup)
"""
import sys
sys.path.insert(0, r'c:\Users\Tejas\Desktop\kriraai\kriralabs-sdk')

from kriralabs import Kriralabs

print("Testing SDK with DEPLOYED Python backend...")
print("URL: https://rag-python-backend.onrender.com/v1")
print()

try:
    client = Kriralabs(
        api_key="sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432",
        bot_id="employee3",
        base_url="https://rag-python-backend.onrender.com/v1"
    )
    
    print("Sending question: 'give me employees name who has excellent performance'")
    print("This may take a moment as Render services may be cold-starting...")
    print()
    
    response = client.ask("give me employees name who has excellent performance", timeout=60)
    
    print("="*80)
    print(f"ANSWER: {response.answer}")
    print("="*80)
    print()
    
    if "not available in the provided context" not in response.answer.lower():
        print("✓✓✓ SUCCESS! Got actual data from Pinecone!")
    else:
        print("⚠️ Getting 'not available' - this means:")
        print("  ✓ SDK works")
        print("  ✓ API key verification works")
        print("  ❌ No data found in Pinecone for this query")
        print()
        print("The deployed Python backend needs the same .env fix:")
        print("  Go to Render → rag-python-backend → Environment")
        print("  Set: API_VERIFICATION_URL=https://rag-backend-k46a.onrender.com/api/keys/verify")
    
    client.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    
    print()
    print("If you see a 502 error, the deployed Python backend")
    print("still has the wrong API_VERIFICATION_URL.")
    print()
    print("FIX IN RENDER:")
    print("  1. Go to: https://dashboard.render.com")
    print("  2. Select: rag-python-backend")
    print("  3. Go to: Environment tab")
    print("  4. Set: API_VERIFICATION_URL=https://rag-backend-k46a.onrender.com/api/keys/verify")
    print("  5. Save and wait for redeploy")
