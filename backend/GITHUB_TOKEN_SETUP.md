# GitHub Personal Access Token Setup Guide

## Quick Setup (3 minutes)

### Step 1: Go to GitHub Settings
🔗 **Direct link:** https://github.com/settings/tokens

Or navigate manually:
1. Click your profile picture (top right corner of GitHub)
2. Click **Settings**
3. Scroll down and click **Developer settings** (bottom of left sidebar)
4. Click **Personal access tokens** → **Tokens (classic)**

### Step 2: Generate New Token
1. Click the green **"Generate new token"** button
2. Select **"Generate new token (classic)"**

### Step 3: Configure Token
Fill out the form:
- **Token name:** `AI PR Reviewer`
- **Expiration:** Select your preference (7 days, 30 days, or no expiration)
- **Scopes:** Check these boxes:
  - ☑️ **repo** - Full control of private repositories
  - ☑️ **public_repo** - Access public repositories

### Step 4: Create Token
1. Click **"Generate token"** at the bottom
2. **⚠️ IMPORTANT:** Copy the token immediately!
   - It will look like: `ghp_xxxxxxxxxxxxxxxxxxxx`
   - You cannot see this token again after leaving the page!

### Step 5: Use the Token
Add the token to your `.env` file in the backend directory:

```bash
# Create .env file in backend/ directory
PORT=3001
GITHUB_TOKEN=ghp_your_token_here
GEMINI_API_KEY=your_gemini_key_here
```

## Security Best Practices

✅ **Do:**
- Use descriptive token names
- Set reasonable expiration dates
- Use environment variables for tokens
- Regenerate tokens periodically

❌ **Don't:**
- Commit tokens to version control
- Share tokens with others
- Use tokens with excessive permissions
- Leave tokens with "no expiration"

## Troubleshooting

### "Bad credentials" error
- Check that your token starts with `ghp_`
- Verify the token hasn't expired
- Regenerate if needed

### "Insufficient permissions" error
- Ensure the `repo` scope is selected
- For private repositories, you need repository access

### Token not working
- Try regenerating the token
- Double-check you've copied the entire token
- Ensure no extra spaces or characters

## Need Help?
If you encounter issues:
1. Check the [GitHub Token Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
2. Verify your account has the necessary permissions
3. Try with a public repository first to test

---

**🎉 Once you have your token, your AI PR Reviewer is ready to go!**
