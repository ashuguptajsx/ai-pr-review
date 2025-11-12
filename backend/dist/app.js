"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const crypto_1 = __importDefault(require("crypto"));
const reviewController_1 = require("./controllers/reviewController");
const githubService_1 = require("./services/githubService");
const geminiService_1 = require("./services/geminiService");
const codeAnalyzer_1 = require("./services/codeAnalyzer");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Rate limiting for webhooks
const webhookLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many webhook requests from this IP, please try again later.'
});
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
// Apply JSON middleware to all routes except webhooks
app.use('/api', express_1.default.json({ limit: '10mb' }));
// Webhook signature verification
function verifyWebhookSignature(payload, signature, secret) {
    const hmac = crypto_1.default.createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const calculatedSignature = 'sha256=' + hmac.digest('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
}
// Webhook handler for raw body
app.post('/webhook/github', webhookLimiter, express_1.default.raw({ type: 'application/json', limit: '10mb' }), async (req, res) => {
    try {
        const event = req.headers['x-github-event'];
        const signature = req.headers['x-hub-signature-256'];
        const secret = process.env.WEBHOOK_SECRET;
        // Verify webhook signature if secret is provided
        if (secret && signature) {
            const isValid = verifyWebhookSignature(req.body.toString(), signature, secret);
            if (!isValid) {
                console.log('❌ Invalid webhook signature');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }
        // Parse JSON payload
        let payload;
        try {
            payload = JSON.parse(req.body.toString());
        }
        catch (error) {
            console.log('❌ Invalid JSON payload');
            return res.status(400).json({ error: 'Invalid JSON' });
        }
        console.log(`🪝 GitHub Webhook: ${event}`);
        // Handle different event types
        if (event === 'pull_request') {
            await handlePullRequestWebhook(payload);
        }
        else if (event === 'ping') {
            console.log('🔔 Webhook ping received - connection test successful');
        }
        res.status(200).json({ status: 'ok' });
    }
    catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Handle PR webhooks
async function handlePullRequestWebhook(payload) {
    const { action, pull_request, repository } = payload;
    // Only process relevant PR actions
    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
        console.log(`⏭️ Skipping PR action: ${action}`);
        return;
    }
    console.log(`🔄 Processing PR #${pull_request.number} - ${action} event`);
    try {
        // Perform AI review
        const reviewResult = await performAutomaticReview({
            owner: repository.owner.login,
            repo: repository.name,
            prNumber: pull_request.number,
            prTitle: pull_request.title,
            prAuthor: pull_request.user.login
        });
        // Post review comments to GitHub
        await postReviewToGitHub(reviewResult, repository.owner.login, repository.name, pull_request.number);
        console.log(`✅ Auto-review completed for PR #${pull_request.number}`);
    }
    catch (error) {
        console.error(`❌ Auto-review failed for PR #${pull_request.number}:`, error);
    }
}
// Perform automatic review using your existing logic
async function performAutomaticReview({ owner, repo, prNumber, prTitle, prAuthor }) {
    const githubToken = process.env.GITHUB_TOKEN;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!githubToken || !geminiApiKey) {
        throw new Error('Missing required environment variables: GITHUB_TOKEN or GEMINI_API_KEY');
    }
    const githubService = new githubService_1.GitHubService(githubToken);
    const geminiService = new geminiService_1.GeminiService(geminiApiKey);
    const codeAnalyzer = new codeAnalyzer_1.CodeAnalyzer();
    // Get PR data and files
    const [prData, files] = await Promise.all([
        githubService.getPullRequest(owner, repo, prNumber),
        githubService.getPullRequestFiles(owner, repo, prNumber)
    ]);
    // Get file contents for context (limit to avoid token limits)
    const fileContents = new Map();
    for (const file of files.slice(0, 5)) { // Limit to 5 files
        if (file.status !== 'removed') {
            try {
                const content = await githubService.getFileContent(owner, repo, file.filename, prData.head.sha);
                fileContents.set(file.filename, content);
            }
            catch (error) {
                console.log(`⚠️ Could not fetch content for ${file.filename}`);
            }
        }
    }
    // Generate AI review
    const aiReview = await geminiService.generateReview(prData, files, fileContents);
    // Add security analysis
    const securityIssues = codeAnalyzer_1.CodeAnalyzer.detectSecurityIssues(files);
    aiReview.comments.push(...securityIssues.map((issue) => ({
        file: issue.split(' in ')[1],
        type: 'error',
        message: issue,
        severity: 'high',
    })));
    return {
        pr: {
            number: prData.number,
            title: prData.title,
            author: prData.user.login,
            url: prData.html_url,
        },
        review: aiReview,
        metrics: codeAnalyzer_1.CodeAnalyzer.getMetrics(files),
        filesAnalyzed: files.length,
        securityIssuesFound: securityIssues.length,
    };
}
// Post review comments to GitHub
async function postReviewToGitHub(reviewResult, owner, repo, prNumber) {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
        throw new Error('GITHUB_TOKEN not configured');
    }
    const { Octokit } = await Promise.resolve().then(() => __importStar(require('@octokit/rest')));
    const octokit = new Octokit({ auth: githubToken });
    // Create a comprehensive review comment
    const reviewBody = `🤖 **AI Code Review - Score: ${reviewResult.review.overall_score}/10**

## 📋 **Summary**
${reviewResult.review.summary}

## 🔍 **Key Findings**
${reviewResult.review.comments.map((comment) => `- **${comment.type.toUpperCase()}** in \`${comment.file}\`: ${comment.message}${comment.suggestion ? `\n  💡 *Suggestion:* ${comment.suggestion}` : ''}`).join('\n')}

## 📊 **Analysis Metrics**
- Files analyzed: ${reviewResult.filesAnalyzed}
- Lines changed: ${reviewResult.review.metadata.total_lines_changed}
- Languages: ${reviewResult.review.metadata.languages.join(', ')}
- Security issues: ${reviewResult.securityIssuesFound}

---
*This review was automatically generated by AI when the PR was updated*`;
    try {
        await octokit.pulls.createReview({
            owner,
            repo,
            pull_number: prNumber,
            body: reviewBody,
            event: 'COMMENT'
        });
        console.log(`✅ Posted AI review to PR #${prNumber}`);
    }
    catch (error) {
        console.error('❌ Failed to post review to GitHub:', error);
        throw error;
    }
}
// Your existing routes
app.post('/api/review', reviewController_1.ReviewController.reviewPullRequest);
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));
// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
exports.default = app;
module.exports = app;
