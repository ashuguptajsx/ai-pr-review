import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { ReviewController } from './controllers/reviewController';
import { GitHubService } from './services/githubService';
import { GeminiService } from './services/geminiService';
import { CodeAnalyzer } from './services/codeAnalyzer';

dotenv.config();

const app = express();

// Rate limiting for webhooks
const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many webhook requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Apply JSON middleware to all routes except webhooks
app.use('/api', express.json({ limit: '10mb' }));

// Webhook signature verification
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const calculatedSignature = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature));
}

// Webhook handler for raw body
app.post('/webhook/github', webhookLimiter, express.raw({ type: 'application/json', limit: '10mb' }), async (req, res) => {
  try {
    const event = req.headers['x-github-event'] as string;
    const signature = req.headers['x-hub-signature-256'] as string;
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
    } catch (error) {
      console.log('❌ Invalid JSON payload');
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    console.log(`🪝 GitHub Webhook: ${event}`);

    // Handle different event types
    if (event === 'pull_request') {
      await handlePullRequestWebhook(payload);
    } else if (event === 'ping') {
      console.log('🔔 Webhook ping received - connection test successful');
    }

    res.status(200).json({ status: 'ok' });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle PR webhooks
async function handlePullRequestWebhook(payload: any) {
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

  } catch (error) {
    console.error(`❌ Auto-review failed for PR #${pull_request.number}:`, error);
  }
}

// Perform automatic review using your existing logic
async function performAutomaticReview({ owner, repo, prNumber, prTitle, prAuthor }: {
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  prAuthor: string;
}) {
  const githubToken = process.env.GITHUB_TOKEN;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!githubToken || !geminiApiKey) {
    throw new Error('Missing required environment variables: GITHUB_TOKEN or GEMINI_API_KEY');
  }

  const githubService = new GitHubService(githubToken);
  const geminiService = new GeminiService(geminiApiKey);
  const codeAnalyzer = new CodeAnalyzer();

  // Get PR data and files
  const [prData, files] = await Promise.all([
    githubService.getPullRequest(owner, repo, prNumber),
    githubService.getPullRequestFiles(owner, repo, prNumber)
  ]);

  // Get file contents for context (limit to avoid token limits)
  const fileContents = new Map<string, string>();
  for (const file of files.slice(0, 5)) { // Limit to 5 files
    if (file.status !== 'removed') {
      try {
        const content = await githubService.getFileContent(owner, repo, file.filename, prData.head.sha);
        fileContents.set(file.filename, content);
      } catch (error) {
        console.log(`⚠️ Could not fetch content for ${file.filename}`);
      }
    }
  }

  // Generate AI review
  const aiReview = await geminiService.generateReview(prData, files, fileContents);

  // Add security analysis
  const securityIssues = CodeAnalyzer.detectSecurityIssues(files);
  aiReview.comments.push(
    ...securityIssues.map((issue: string) => ({
      file: issue.split(' in ')[1],
      type: 'error' as const,
      message: issue,
      severity: 'high' as const,
    }))
  );

  return {
    pr: {
      number: prData.number,
      title: prData.title,
      author: prData.user.login,
      url: prData.html_url,
    },
    review: aiReview,
    metrics: CodeAnalyzer.getMetrics(files),
    filesAnalyzed: files.length,
    securityIssuesFound: securityIssues.length,
  };
}

// Post review comments to GitHub
async function postReviewToGitHub(reviewResult: any, owner: string, repo: string, prNumber: number) {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN not configured');
  }

  const { Octokit } = await import('@octokit/rest');
  const octokit = new Octokit({ auth: githubToken });

  // Create a comprehensive review comment
  const reviewBody = `🤖 **AI Code Review - Score: ${reviewResult.review.overall_score}/10**

## 📋 **Summary**
${reviewResult.review.summary}

## 🔍 **Key Findings**
${reviewResult.review.comments.map((comment: any) =>
  `- **${comment.type.toUpperCase()}** in \`${comment.file}\`: ${comment.message}${comment.suggestion ? `\n  💡 *Suggestion:* ${comment.suggestion}` : ''}`
).join('\n')}

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
  } catch (error) {
    console.error('❌ Failed to post review to GitHub:', error);
    throw error;
  }
}

// Your existing routes
app.post('/api/review', ReviewController.reviewPullRequest);
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;
module.exports = app;