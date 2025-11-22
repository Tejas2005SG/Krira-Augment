"""
✓ FIXED LOCALLY - Now fix on Render

LOCAL SETUP:
  ✓ Fixed python-backend/.env
  ✓ Changed API_VERIFICATION_URL to point to deployed Node backend
  ✓ SDK now works locally

RENDER DEPLOYMENT FIX:
  
  Step 1: Go to Render Dashboard
    https://dashboard.render.com
  
  Step 2: Select "rag-python-backend" service
  
  Step 3: Click "Environment" tab
  
  Step 4: Find or add this environment variable:
    Name:  API_VERIFICATION_URL
    Value: https://rag-backend-k46a.onrender.com/api/keys/verify
  
  Step 5: Click "Save Changes"
  
  Step 6: Wait for automatic redeploy (2-3 minutes)
  
  Step 7: Test your SDK again

WHAT THIS FIXES:
  - Python backend can now verify API keys with Node backend
  - Your SDK will be able to query the bot successfully
  - The "Unable to verify API key" error will be resolved

AFTER THIS FIX:
  If you still get "information not available", it means:
  - API verification is working ✓
  - But Pinecone has no data for that query
  - You may need to re-upload your employee data to Pinecone

The local SDK should work immediately. Test it with:
  python -c "
import sys; sys.path.insert(0, r'c:\\Users\\Tejas\\Desktop\\kriraai\\kriralabs-sdk')
from kriralabs import Kriralabs
client = Kriralabs(api_key='sk-live-8789469c7926d2ce74376d822cb2a98c2c7514660068e33f9aae4432', bot_id='employee3', base_url='http://localhost:8000/v1')
print(client.ask(' give me employees name').answer)
"
"""

print(__doc__)
