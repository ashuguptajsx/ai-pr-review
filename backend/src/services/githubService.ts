import { Octokit } from '@octokit/rest';
import { PullRequest, FileChange } from '../types';

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async getPullRequest(owner: string, repo: string, prNumber: number): Promise<PullRequest> {
    const { data } = await this.octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });
    return data as PullRequest;
  }

  async getPullRequestFiles(owner: string, repo: string, prNumber: number): Promise<FileChange[]> {
    const { data } = await this.octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 50,
    });
    return data as FileChange[];
  }

  async getFileContent(owner: string, repo: string, path: string, ref: string): Promise<string> {
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
    } catch (error) {
      return '';
    }
  }
}

export default GitHubService;