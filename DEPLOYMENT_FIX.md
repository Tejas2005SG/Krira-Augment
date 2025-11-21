# Deployment Architecture & Configuration Fix

## Your Deployment URLs

- **Frontend (Vercel)**: https://krira-ai.vercel.app
- **Node.js Backend (Render)**: https://rag-backend-k46a.onrender.com
- **Python Backend (Render)**: https://rag-python-backend.onrender.com

## Issue Analysis

You're getting 400 errors when calling `/api/datasets/process`. The error is:
```
POST https://rag-backend-k46a.onrender.com/api/datasets/process 400 (Bad Request)
```

This means the frontend IS correctly calling the Node.js backend, but the Node.js backend is returning a 400 error.

## Architecture (Correct)

```
Frontend (Vercel)
  → https://krira-ai.vercel.app
    ↓ calls
Node.js Backend (Render)
  → https://rag-backend-k46a.onrender.com/api
    ↓ proxies to
Python Backend (Render)
  → https://rag-python-backend.onrender.com
```

## Root Cause

The 400 error suggests one of these issues:

### 1. Missing/Incorrect Environment Variables in Node.js Backend

The Node.js backend needs:
```env
PYTHON_BACKEND_URL=https://rag-python-backend.onrender.com
CLIENT_URL=https://krira-ai.vercel.app
```

**To Fix in Render (Node.js Backend):**
1. Go to Render Dashboard → Your Node.js Backend Service
2. Go to "Environment" tab
3. Verify/Add these variables:
   - `PYTHON_BACKEND_URL` = `https://rag-python-backend.onrender.com`
   - `CLIENT_URL` = `https://krira-ai.vercel.app`
4. Click "Save Changes" and redeploy

### 2. Python Backend Not Accessible

The Python backend might not be responding. Test it:
```bash
curl https://rag-python-backend.onrender.com/health
```

Should return: `{"status":"ok","environment":"production"}`

### 3. CORS Issues in Python Backend

The Python backend needs to allow requests from Node.js backend domain.

## Required Environment Variables

### Frontend (Vercel) ✅
```env
NEXT_PUBLIC_BACKEND_URL=https://rag-backend-k46a.onrender.com/api
```

### Node.js Backend (Render) ⚠️ CHECK THIS
```env
CLIENT_URL=https://krira-ai.vercel.app
PYTHON_BACKEND_URL=https://rag-python-backend.onrender.com
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
COOKIE_DOMAIN=.vercel.app
NODE_ENV=production
PORT=10000
# Email config
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
# Redis (if using)
REDIS_URL=your_redis_url
```

### Python Backend (Render) ⚠️ CHECK THIS
```env
ENVIRONMENT=production
# Any other Python-specific env vars
```

## Debugging Steps

### Step 1: Check Node.js Backend Logs
1. Go to Render → Node.js Backend Service → "Logs"
2. Look for errors when the request comes in
3. Check if it's reaching the Python backend

### Step 2: Check Python Backend Health
Open in browser: https://rag-python-backend.onrender.com/health

Should return:
```json
{"status":"ok","environment":"production"}
```

### Step 3: Test Node.js to Python Connection

The Node.js backend tries to call:
```
https://rag-python-backend.onrender.com/uploaddataset
```

If `PYTHON_BACKEND_URL` is missing or wrong, this will fail.

## Most Likely Fix

Go to **Render Dashboard** → **Node.js Backend Service**:

1. Click "Environment" tab
2. Add/Update: `PYTHON_BACKEND_URL` = `https://rag-python-backend.onrender.com`
3. Add/Update: `CLIENT_URL` = `https://krira-ai.vercel.app`
4. Click "Save Changes"
5. Service will auto-redeploy

## Testing After Fix

1. **Test Python Backend Health:**
   ```
   https://rag-python-backend.onrender.com/health
   ```

2. **Test Node.js Backend (from frontend):**
   ```
   https://rag-backend-k46a.onrender.com/api/auth/profile
   ```

3. **Test Dataset Processing:**
   - Go to https://krira-ai.vercel.app/dashboard
   - Try to upload/process a dataset
   - Check Network tab for errors

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 400 Bad Request | Check `PYTHON_BACKEND_URL` in Node.js backend env vars |
| 500 Internal Server Error | Check Node.js backend logs for Python connection errors |
| CORS errors | Ensure `CLIENT_URL` is set correctly in Node.js backend |
| Python backend timeout | Check if Python backend is running (visit /health endpoint) |

## Request Flow Diagram

```
User uploads file in Dashboard
  ↓
Frontend sends FormData to:
  POST https://rag-backend-k46a.onrender.com/api/datasets/process
  ↓
Node.js Backend (dataset.controller.js):
  - Validates request
  - Saves files to disk
  - Formats request
  ↓
Node.js Backend calls Python:
  POST https://rag-python-backend.onrender.com/uploaddataset
  ↓
Python Backend (upload_dataset.py):
  - Processes chunks
  - Returns preview data
  ↓
Node.js Backend sends response back to Frontend
```

## Next Steps

1. **Verify Node.js Backend Environment Variables** (most likely issue)
2. **Check Python Backend is running** (visit /health)
3. **Check Node.js Backend logs** for error details
4. **Redeploy Node.js Backend** after fixing env vars

The 400 error is most likely due to missing `PYTHON_BACKEND_URL` environment variable in your Node.js backend deployment!
