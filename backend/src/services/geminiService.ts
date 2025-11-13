import { GoogleGenerativeAI } from '@google/generative-ai';
import { FileChange, ReviewResult } from '../types';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateReview(
    prData: any,
    files: FileChange[],
    fileContents: Map<string, string>
  ): Promise<ReviewResult> {
    const codeContext = this.prepareCodeContext(files, fileContents);

    const prompt = `You are an expert code reviewer. Analyze this pull request and provide detailed, actionable feedback in JSON format.

PR Title: ${prData.title}
Description: ${prData.body || 'No description'}
Files changed: ${files.length}

Code changes:
${codeContext}

CRITICAL REQUIREMENTS:
1. Provide EXACT line numbers for ALL comments (never null/undefined)
2. For each suggestion, include the actual code that should replace the existing code
3. Focus on specific, actionable improvements rather than general advice
4. Separate critical issues (security, bugs, breaking changes) from minor improvements

Return JSON with this structure:
{
  "summary": "Brief overall assessment (2-3 sentences max)",
  "overall_score": 1-10,
  "comments": [
    {
      "file": "filename",
      "line": 42,
      "type": "error|warning|info|suggestion",
      "message": "Clear, specific feedback about the issue",
      "suggestion": "The exact code that should replace the problematic code at this line",
      "severity": "low|medium|high|critical"
    }
  ],
  "metadata": {
    "files_analyzed": ${files.length},
    "total_lines_changed": ${files.reduce((sum, f) => sum + f.changes, 0)},
    "languages": ${JSON.stringify(this.detectLanguages(files))}
  }
}

IMPORTANT:
- Line numbers must be accurate based on the file content provided
- Suggestions should be actual code snippets that can be directly applied
- For critical issues (security, bugs), use severity "high" or "critical"
- For style/best practices, use "low" or "medium"
- Each comment must have a specific line number where the change should be made`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json\n?|\n?```/g, '').trim();
    
    return JSON.parse(text) as ReviewResult;
  }

  private prepareCodeContext(files: FileChange[], fileContents: Map<string, string>): string {
    let context = '';

    for (const file of files.slice(0, 8)) {
      context += `=== ${file.filename} ===\n`;
      context += `Status: ${file.status} (+${file.additions} -${file.deletions})\n\n`;

      if (file.patch) {
        context += `Changes:\n${file.patch}\n\n`;
      }

      const content = fileContents.get(file.filename);
      if (content) {
        const lines = content.split('\n');
        context += `Full file content (with line numbers):\n`;
        lines.forEach((line, index) => {
          context += `${index + 1}: ${line}\n`;
        });
        context += `\n`;
      }
    }

    return context;
  }

  private detectLanguages(files: FileChange[]): string[] {
    const languages = new Set<string>();
    const exts = files.map(f => f.filename.split('.').pop()?.toLowerCase()).filter(Boolean);
    
    exts.forEach(ext => {
      const langMap: Record<string, string> = {
        'js': 'JavaScript', 'ts': 'TypeScript', 'py': 'Python',
        'java': 'Java', 'cpp': 'C++', 'c': 'C', 'go': 'Go',
        'rs': 'Rust', 'php': 'PHP', 'rb': 'Ruby'
      };
      if (langMap[ext!]) languages.add(langMap[ext!]);
    });
    
    return Array.from(languages);
  }
}

export default GeminiService;
