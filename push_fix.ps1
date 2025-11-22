# Push the fix to GitHub
git add python-backend/src/services/llm.py
git commit -m "Fix Pinecone config conversion in LLM service"
git push

Write-Host "✓ Code pushed to GitHub!"
Write-Host "Render will now redeploy automatically."
Write-Host "Wait 2-3 minutes, then your SDK will work."
