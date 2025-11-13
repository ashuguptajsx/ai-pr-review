# AI PR Reviewer Backend

AI-powered Pull Request reviewer using Node.js, TypeScript, and Google Gemini AI.

## Features

- 🤖 AI-powered code review using Google Gemini
- 🔍 Security vulnerability detection
- 📊 Code quality metrics
- 🔗 GitHub API integration
- 🚀 TypeScript support
- ⚡ Fast and efficient

## Prerequisites

- Node.js 18+ 
- npm or yarn
- GitHub Personal Access Token
- Google Gemini API Key

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the backend directory (optional):

```bash
PORT=3001
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": 1234567890
}
```

### Review Pull Request
```bash
POST /api/review
```

Request Body:
```json
{
  "owner": "username",
  "repo": "repository-name",
  "prNumber": 123,
  "githubToken": "your_github_personal_access_token",
  "geminiApiKey": "your_gemini_api_key"
}
```

**Note:** You can also set `GITHUB_TOKEN` and `GEMINI_API_KEY` as environment variables instead of passing them in the request body.

Response:
```json
{
  "pr": {
    "number": 123,
    "title": "Add new feature",
    "author": "username",
    "url": "https://github.com/owner/repo/pull/123"
  },
  "review": {
    "summary": "Overall assessment of the changes",
    "overall_score": 8,
    "comments": [
      {
        "file": "src/index.ts",
        "line": null,
        "type": "suggestion",
        "message": "Consider adding error handling",
        "suggestion": "Add try-catch block",
        "severity": "medium"
      }
    ],
    "metadata": {
      "files_analyzed": 5,
      "total_lines_changed": 150,
      "languages": ["TypeScript", "JavaScript"]
    }
  },
  "metrics": {
    "totalFiles": 5,
    "totalAdditions": 120,
    "totalDeletions": 30,
    "largeFiles": []
  },
  "security_issues_count": 0
}
```

## 🚀 **Webhook Integration (NEW!)**

Your AI PR reviewer now supports **automatic webhook integration**! GitHub can automatically send review requests when PRs are created or updated.

### **Features:**
- ✅ **Automatic PR reviews** when PRs are opened/updated
- ✅ **Secure webhook verification** with signature validation
- ✅ **Rate limiting** to prevent abuse
- ✅ **GitHub comment posting** with formatted AI reviews
- ✅ **Real-time feedback** for developers

### **Webhook Endpoint:**
```
POST /webhook/github
```

### **Supported Events:**
- `pull_request` (opened, synchronize, reopened)
- `ping` (webhook verification)

## Getting API Keys

### GitHub Personal Access Token (Step-by-Step)

1. **Go to GitHub Settings:**
   - Click your profile picture (top right) → Settings
   - Or go directly to: https://github.com/settings/profile

2. **Navigate to Developer Settings:**
   - Scroll down and click "Developer settings" (bottom left menu)
   - Or go directly to: https://github.com/settings/tokens

3. **Generate New Token:**
   - Click "Personal access tokens" → "Tokens (classic)"
   - Click "Generate new token" → "Generate new token (classic)"

4. **Configure the Token:**
   - **Token name:** `AI PR Reviewer` (or any descriptive name)
   - **Expiration:** Choose when you want it to expire (or "No expiration")
   - **Scopes:** Check the following:
     - ✅ `repo` - Full control of private repositories
     - ✅ `public_repo` - Access public repositories (if needed)
   - **Important:** Only select the minimum permissions needed!

5. **Create and Copy:**
   - Click "Generate token"
   - **⚠️ COPY THE TOKEN IMMEDIATELY** - You won't see it again!
   - The token will start with `ghp_` (GitHub Personal Access Token)

6. **Security Notes:**
   - Never commit this token to version control
   - Use environment variables or secure storage
   - Regenerate if compromised

### Google Gemini API Key

1. **Go to Google AI Studio:**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key:**
   - Click "Create API key"
   - Choose a name like "AI PR Reviewer"

3. **Copy and Secure:**
   - Copy the generated API key
   - Store it securely (environment variables recommended)
   - Never commit to version control

### Webhook Secret (Optional but Recommended)

Generate a random webhook secret for security:
```bash
# Linux/Mac
openssl rand -hex 32

# Or use any random string generator
# This secret is used to verify webhook signatures from GitHub
```

## Example Usage

### Using cURL
```bash
curl -X POST http://localhost:3001/api/review \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "facebook",
    "repo": "react",
    "prNumber": 12345,
    "githubToken": "ghp_your_token_here",
    "geminiApiKey": "your_gemini_key_here"
  }'
```

### Using JavaScript/Fetch
```javascript
const response = await fetch('http://localhost:3001/api/review', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    owner: 'facebook',
    repo: 'react',
    prNumber: 28000,
    githubToken: 'ghp_your_github_token_here',
    geminiApiKey: 'your_gemini_api_key_here',
  }),
});

const result = await response.json();
console.log(result);
```

### Using Python
```python
import requests

response = requests.post('http://localhost:3001/api/review', json={
    'owner': 'facebook',
    'repo': 'react',
    'prNumber': 28000,
    'githubToken': 'ghp_your_github_token_here',
    'geminiApiKey': 'your_gemini_api_key_here'
})

print(response.json())
```

## 🪝 **Setting Up GitHub Webhooks**

### **Step 1: Deploy Your Backend**

First, deploy your backend to a publicly accessible URL:

**Recommended Platforms:**
- **Railway** (connects directly to GitHub repos)
- **Vercel** with serverless functions
- **Render** or **Heroku**
- **AWS Lambda** with API Gateway

### **Step 2: Configure GitHub Webhook**

1. **Go to your GitHub repository**
2. **Click "Settings" tab**
3. **Click "Webhooks" in the left sidebar**
4. **Click "Add webhook"**

#### **Webhook Configuration:**
```
Payload URL: https://your-deployed-domain.com/webhook/github
Content type: application/json
Secret: your_webhook_secret_here (from WEBHOOK_SECRET env var)
```

#### **Events to trigger:**
- ✅ **Pull requests** (check this box)
- ✅ **Pull request review comments** (optional)

### **Step 3: Test Your Webhook**

1. **Go to webhook settings in GitHub**
2. **Click "Recent Deliveries"**
3. **Click on a delivery to see payload and response**

### **Step 4: Environment Variables**

Make sure your deployed environment has these variables:

```bash
PORT=3001
GITHUB_TOKEN=ghp_your_token_here
GEMINI_API_KEY=your_gemini_key_here
WEBHOOK_SECRET=your_webhook_secret_here
```

## 🔧 **How Webhooks Work:**

1. **Developer creates/updates PR** → GitHub sends webhook
2. **Your server receives webhook** → Validates signature
3. **AI analyzes the PR code** → Reviews for quality & security
4. **Posts review as comment** → Automatic feedback appears

## 🛡️ **Security Features:**

- ✅ **Webhook signature verification** (prevents spoofing)
- ✅ **Rate limiting** (100 requests per 15 minutes per IP)
- ✅ **Input validation** (proper JSON parsing)
- ✅ **Error handling** (logs failures, continues processing)

## 🧪 **Testing Webhooks Locally:**

For local development, use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Start your server
npm start

# Expose local port
ngrok http 3001

# Use ngrok URL as webhook payload URL
# Example: https://abc123.ngrok.io/webhook/github
```

## Project Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── reviewController.ts    # API request handlers
│   ├── services/
│   │   ├── githubService.ts       # GitHub API integration
│   │   ├── geminiService.ts       # Gemini AI integration
│   │   └── codeAnalyzer.ts        # Static code analysis
│   ├── types.ts                   # TypeScript type definitions
│   ├── app.ts                     # Express app configuration
│   └── server.ts                  # Server entry point
├── dist/                          # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive data in production
3. **Implement rate limiting** for production deployments
4. **Add authentication** before deploying publicly
5. **Validate and sanitize** all user inputs
6. **Use HTTPS** in production

## Troubleshooting

### Server won't start
- Check if port 3001 is already in use
- Ensure all dependencies are installed: `npm install`
- Check for TypeScript compilation errors: `npm run build`

### API returns errors
- Verify your GitHub token has the correct permissions
- Ensure your Gemini API key is valid
- Check that the repository and PR number exist

### Build fails
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Ensure you have TypeScript installed: `npm install -D typescript`

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.

