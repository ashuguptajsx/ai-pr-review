"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubService = void 0;
const rest_1 = require("@octokit/rest");
class GitHubService {
    constructor(token) {
        this.octokit = new rest_1.Octokit({ auth: token });
    }
    async getPullRequest(owner, repo, prNumber) {
        const { data } = await this.octokit.pulls.get({
            owner,
            repo,
            pull_number: prNumber,
        });
        return data;
    }
    async getPullRequestFiles(owner, repo, prNumber) {
        const { data } = await this.octokit.pulls.listFiles({
            owner,
            repo,
            pull_number: prNumber,
            per_page: 50,
        });
        return data;
    }
    async getFileContent(owner, repo, path, ref) {
        try {
            const { data } = await this.octokit.repos.getContent({
                owner,
                repo,
                path,
                ref,
            });
            if ('content' in data) {
                return Buffer.from(data.content, 'base64').toString('utf-8');
            }
            return '';
        }
        catch (error) {
            return '';
        }
    }
}
exports.GitHubService = GitHubService;
exports.default = GitHubService;
