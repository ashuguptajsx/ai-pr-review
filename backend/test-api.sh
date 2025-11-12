#!/bin/bash

# Test script for AI PR Reviewer API
# Usage: ./test-api.sh

echo "🧪 Testing AI PR Reviewer API..."
echo ""

# Test health endpoint
echo "1️⃣ Testing health endpoint..."
curl -s http://localhost:3001/health | jq '.'
echo ""
echo ""

# Test review endpoint (you need to replace the tokens)
echo "2️⃣ Testing review endpoint..."
echo "⚠️  You need to add your API keys first!"
echo ""
echo "📋 To get your tokens:"
echo "   GitHub Token:  https://github.com/settings/tokens"
echo "   Gemini API:    https://makersuite.google.com/app/apikey"
echo ""
echo "💡 Then edit this script and uncomment the curl command below"
echo ""

# Uncomment and fill in your details to test the review endpoint:
# curl -X POST http://localhost:3001/api/review \
#   -H "Content-Type: application/json" \
#   -d '{
#     "owner": "facebook",
#     "repo": "react",
#     "prNumber": 28000,
#     "githubToken": "ghp_your_github_token_here",
#     "geminiApiKey": "your_gemini_api_key_here"
#   }' | jq '.'

echo "✅ Health check completed!"
echo "💡 To test the review endpoint, uncomment and configure the curl command in this script"

