export interface PullRequest {
    number: number;
    title: string;
    body: string;
    user: {
      login: string;
      avatar_url: string;
    };
    head: {
      ref: string;
      sha: string;
    };
    base: {
      ref: string;
    };
    html_url: string;
  }
  
  export interface FileChange {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
    blob_url: string;
    raw_url: string;
  }
  
  export interface ReviewComment {
    file: string;
    line?: number;
    type: 'error' | 'warning' | 'info' | 'suggestion';
    message: string;
    suggestion?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }
  
  export interface ReviewResult {
    summary: string;
    overall_score: number;
    comments: ReviewComment[];
  metadata: {
    files_analyzed: number;
    total_lines_changed: number;
    languages: string[];
  };
}

export {};