import { Request, Response } from 'express';
import { GitHubService } from '../services/githubService';
import { GeminiService } from '../services/geminiService';
import { CodeAnalyzer } from '../services/codeAnalyzer';

export class ReviewController {
  static async reviewPullRequest(req: Request, res: Response): Promise<void> {
    try {
      const { owner, repo, prNumber } = req.body;
      
      // Use tokens from request body or environment variables
      const githubToken = req.body.githubToken || process.env.GITHUB_TOKEN;
      const geminiApiKey = req.body.geminiApiKey || process.env.GEMINI_API_KEY;

      if (!owner || !repo || !prNumber) {
        res.status(400).json({ error: 'Missing required parameters: owner, repo, prNumber' });
        return;
      }

      if (!githubToken || !geminiApiKey) {
        res.status(400).json({ 
          error: 'Missing API keys. Provide githubToken and geminiApiKey in request body or set GITHUB_TOKEN and GEMINI_API_KEY environment variables' 
        });
        return;
      }

      const github = new GitHubService(githubToken);
      const gemini = new GeminiService(geminiApiKey);

      const [prData, files] = await Promise.all([
        github.getPullRequest(owner, repo, prNumber),
        github.getPullRequestFiles(owner, repo, prNumber)
      ]);

      const fileContents = new Map<string, string>();
      for (const file of files.slice(0, 5)) {
        if (file.status !== 'removed') {
          const content = await github.getFileContent(owner, repo, file.filename, prData.head.sha);
          fileContents.set(file.filename, content);
        }
      }

      const aiReview = await gemini.generateReview(prData, files, fileContents);
      const securityIssues = CodeAnalyzer.detectSecurityIssues(files);
      const metrics = CodeAnalyzer.getMetrics(files);

      aiReview.comments.push(
        ...securityIssues.map(issue => ({
          file: issue.split(' in ')[1],
          type: 'error' as const,
          message: issue,
          severity: 'high' as const,
        }))
      );

      res.json({
        pr: {
          number: prData.number,
          title: prData.title,
          author: prData.user.login,
          url: prData.html_url,
        },
        review: aiReview,
        metrics,
        security_issues_count: securityIssues.length,
      });

    } catch (error) {
      console.error('Review error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Review failed'
      });
    }
  }
}

export default ReviewController;