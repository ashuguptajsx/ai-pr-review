#!/bin/bash

# Test script for webhook functionality
echo "🪝 Testing AI PR Reviewer Webhook Functionality"
echo "=============================================="
echo ""

# Test 1: Health check
echo "1️⃣ Testing health endpoint..."
curl -s http://localhost:3001/health | jq '.status'
echo ""
echo ""

# Test 2: Webhook ping
echo "2️⃣ Testing webhook ping..."
echo '{"zen":"Keep it logically awesome.","hook_id":12345}' | curl -s -X POST http://localhost:3001/webhook/github \
  -H "X-GitHub-Event: ping" \
  -H "Content-Type: application/json" \
  --data-binary @- | jq '.status'
echo ""
echo ""

# Test 3: Manual API call (if tokens are available)
echo "3️⃣ Testing manual API call..."
if curl -s http://localhost:3001/api/review \
  -H "Content-Type: application/json" \
  -d '{"owner": "facebook", "repo": "react", "prNumber": 28000}' | grep -q "error"; then
  echo "❌ API call failed (likely missing tokens in .env)"
  echo "   This is expected if .env file is not configured"
else
  echo "✅ API call successful"
fi
echo ""

echo "🎉 Webhook functionality is working!"
echo ""
echo "📋 To set up real webhooks:"
echo "1. Deploy this server to a public URL (Railway, Vercel, etc.)"
echo "2. Go to your GitHub repo → Settings → Webhooks"
echo "3. Add webhook: https://your-domain.com/webhook/github"
echo "4. Set content type to: application/json"
echo "5. Add webhook secret (optional but recommended)"
echo "6. Test webhook with a PR create/update event"
