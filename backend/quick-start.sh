#!/bin/bash

# Quick Start Script for AI PR Reviewer
# This script helps you get started quickly

echo "🚀 AI PR Reviewer - Quick Start Setup"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

# Check if .env exists
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# AI PR Reviewer Environment Variables
# Replace the placeholder values with your actual API keys

PORT=3001

# Get your GitHub token from: https://github.com/settings/tokens
GITHUB_TOKEN=your_github_token_here

# Get your Gemini API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
EOF
    echo "✅ .env file created! Please edit it with your real API keys."
fi

echo ""
echo "📋 Next Steps:"
echo "1. Edit the .env file with your real API keys"
echo "2. Run: npm start"
echo "3. Test: curl http://localhost:3001/health"
echo "4. Review a PR: ./test-api.sh"
echo ""

echo "🔗 Helpful Links:"
echo "   GitHub Token Setup: https://github.com/settings/tokens"
echo "   Gemini API Key:     https://makersuite.google.com/app/apikey"
echo "   Full Documentation: See README.md"
echo ""

echo "🎯 Ready to review some pull requests!"
