#!/bin/bash

# Setup script for AI PR Reviewer environment variables
# Run this script to create your .env file

echo "🚀 Setting up AI PR Reviewer Environment"
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

echo "📝 Creating .env file..."
cat > .env << 'EOF'
# AI PR Reviewer Environment Variables
# Created by setup-env.sh

# Server Configuration
PORT=3001

# GitHub API Configuration
# Get your token from: https://github.com/settings/tokens
# Required scopes: repo (Full control of private repositories)
GITHUB_TOKEN=your_github_token_here

# Google Gemini AI Configuration
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Note: Replace the placeholder values above with your actual API keys
# This file should NEVER be committed to version control
EOF

echo "✅ .env file created!"
echo ""
echo "📋 Next steps:"
echo "1. Get your GitHub Personal Access Token:"
echo "   - Go to: https://github.com/settings/tokens"
echo "   - Generate new token (classic)"
echo "   - Select 'repo' scope"
echo "   - Copy the token"
echo ""
echo "2. Get your Google Gemini API Key:"
echo "   - Go to: https://makersuite.google.com/app/apikey"
echo "   - Create a new API key"
echo "   - Copy the key"
echo ""
echo "3. Edit the .env file and replace the placeholder values:"
echo "   nano .env  # or your preferred editor"
echo ""
echo "4. Test the setup:"
echo "   npm run build && npm start"
echo ""
echo "5. Test the API:"
echo "   curl http://localhost:3001/health"
echo ""
echo "⚠️  IMPORTANT: Never commit your .env file to version control!"
