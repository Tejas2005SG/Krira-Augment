"""
SOLUTION: Fix Python Backend Environment Variable

The issue is in your Python backend .env file.

CURRENT (WRONG):
  API_VERIFICATION_URL=https://localhost:5000/api/keys/verify

SHOULD BE:
  API_VERIFICATION_URL=https://rag-backend-k46a.onrender.com/api/keys/verify

HOW TO FIX:

1. Go to Render Dashboard: https://dashboard.render.com
2. Select your Python backend service: rag-python-backend
3. Go to "Environment" tab
4. Find or add: API_VERIFICATION_URL
5. Set value to: https://rag-backend-k46a.onrender.com/api/keys/verify  
6. Click "Save Changes"
7. The service will automatically redeploy

After this fix, your SDK will work!
"""

print(__doc__)

# Also test if setting it temporarily would work
import os
import sys

# Temporarily set the correct URL
os.environ['API_VERIFICATION_URL'] = 'https://rag-backend-k46a.onrender.com/api/keys/verify'

# Add SDK to path
sys.path.insert(0, r'c:\Users\Tejas\Desktop\kriraai\kriralabs-sdk')

print("\n" + "="*80)
print("Testing SDK with CORRECT verification URL (temporary fix)")
print("="*80)

try:
    from kriralabs import Kriralabs
    
    client = Kriralabs(
        api_key="sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432",
        bot_id="employee3",
        base_url="https://rag-python-backend.onrender.com/v1"
    )
    
    print("\nSending question...")
    response = client.ask("give me employees name who has excellent performance")
    
    print(f"\n✓ Answer: {response.answer}")
    
    if "not available in the provided context" in response.answer.lower():
        print("\n⚠️ Still getting 'not available' - checking Pinecone data...")
        print("\nThis means:")
        print("  1. API verification is now working ✓")
        print("  2. But Pinecone has no data OR wrong dataset ID filter")
        print("\nNext step: Check if data was uploaded to Pinecone")
    else:
        print("\n✓✓✓ SUCCESS! The SDK is working!")
    
    client.close()
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
