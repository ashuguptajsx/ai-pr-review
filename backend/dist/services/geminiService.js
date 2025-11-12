"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
class GeminiService {
    constructor(apiKey) {
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }
    async generateReview(prData, files, fileContents) {
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
        return JSON.parse(text);
    }
    prepareCodeContext(files, fileContents) {
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
    detectLanguages(files) {
        const languages = new Set();
        const exts = files.map(f => f.filename.split('.').pop()?.toLowerCase()).filter(Boolean);
        exts.forEach(ext => {
            const langMap = {
                'js': 'JavaScript', 'ts': 'TypeScript', 'py': 'Python',
                'java': 'Java', 'cpp': 'C++', 'c': 'C', 'go': 'Go',
                'rs': 'Rust', 'php': 'PHP', 'rb': 'Ruby'
            };
            if (langMap[ext])
                languages.add(langMap[ext]);
        });
        return Array.from(languages);
    }
}
exports.GeminiService = GeminiService;
exports.default = GeminiService;
