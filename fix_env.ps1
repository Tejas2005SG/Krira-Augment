# Fix Python backend .env file
$envFile = "c:\Users\Tejas\Desktop\kriraai\python-backend\.env"

# Read the file
$content = Get-Content $envFile

# Replace the wrong URL with the correct one
$newContent = $content -replace 'API_VERIFICATION_URL=https://localhost:5000/api/keys/verify', 'API_VERIFICATION_URL=https://rag-backend-k46a.onrender.com/api/keys/verify'

# Write it back
$newContent | Set-Content $envFile

Write-Host "Fixed API_VERIFICATION_URL in python-backend/.env"
Write-Host ""
Write-Host "Changed from: API_VERIFICATION_URL=https://localhost:5000/api/keys/verify"
Write-Host "Changed to:   API_VERIFICATION_URL=https://rag-backend-k46a.onrender.com/api/keys/verify"
Write-Host ""
Write-Host "Now restart the Python backend"
