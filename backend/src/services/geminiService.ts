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
    
    const prompt = `You are an expert code reviewer. Analyze this pull request and provide feedback in JSON format.

PR Title: ${prData.title}
Description: ${prData.body || 'No description'}
Files changed: ${files.length}

Code changes:
${codeContext}

Return JSON with this structure:
{
  "summary": "Brief overall assessment",
  "overall_score": 1-10,
  "comments": [
    {
      "file": "filename",
      "line": null,
      "type": "error|warning|info|suggestion",
      "message": "Feedback message",
      "suggestion": "Optional improvement suggestion",
      "severity": "low|medium|high|critical"
    }
  ],
  "metadata": {
    "files_analyzed": ${files.length},
    "total_lines_changed": ${files.reduce((sum, f) => sum + f.changes, 0)},
    "languages": ${JSON.stringify(this.detectLanguages(files))}
  }
}

Focus on code quality, security, performance, and best practices.`;

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
        const preview = content.split('\n').slice(0, 30).join('\n');
        context += `File preview:\n${preview}\n\n`;
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
