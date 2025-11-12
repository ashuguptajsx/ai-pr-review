"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const githubService_1 = require("../services/githubService");
const geminiService_1 = require("../services/geminiService");
const codeAnalyzer_1 = require("../services/codeAnalyzer");
class ReviewController {
    static async reviewPullRequest(req, res) {
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
            const github = new githubService_1.GitHubService(githubToken);
            const gemini = new geminiService_1.GeminiService(geminiApiKey);
            const [prData, files] = await Promise.all([
                github.getPullRequest(owner, repo, prNumber),
                github.getPullRequestFiles(owner, repo, prNumber)
            ]);
            const fileContents = new Map();
            for (const file of files.slice(0, 5)) {
                if (file.status !== 'removed') {
                    const content = await github.getFileContent(owner, repo, file.filename, prData.head.sha);
                    fileContents.set(file.filename, content);
                }
            }
            const aiReview = await gemini.generateReview(prData, files, fileContents);
            const securityIssues = codeAnalyzer_1.CodeAnalyzer.detectSecurityIssues(files);
            const metrics = codeAnalyzer_1.CodeAnalyzer.getMetrics(files);
            aiReview.comments.push(...securityIssues.map(issue => ({
                file: issue.split(' in ')[1],
                type: 'error',
                message: issue,
                severity: 'high',
            })));
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
        }
        catch (error) {
            console.error('Review error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Review failed'
            });
        }
    }
}
exports.ReviewController = ReviewController;
exports.default = ReviewController;
