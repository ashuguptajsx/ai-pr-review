"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalyzer = void 0;
class CodeAnalyzer {
    static detectSecurityIssues(files) {
        const issues = [];
        for (const file of files) {
            if (file.patch) {
                const patch = file.patch.toLowerCase();
                if (patch.includes('password') && patch.includes('console.log')) {
                    issues.push(`Password logging detected in ${file.filename}`);
                }
                if (patch.includes('eval(')) {
                    issues.push(`Dangerous eval() usage in ${file.filename}`);
                }
                if (patch.includes('innerhtml') && !patch.includes('sanitize')) {
                    issues.push(`Potential XSS in ${file.filename} (innerHTML without sanitization)`);
                }
            }
        }
        return issues;
    }
    static getMetrics(files) {
        return {
            totalFiles: files.length,
            totalAdditions: files.reduce((sum, f) => sum + f.additions, 0),
            totalDeletions: files.reduce((sum, f) => sum + f.deletions, 0),
            largeFiles: files.filter(f => f.changes > 300).map(f => f.filename)
        };
    }
}
exports.CodeAnalyzer = CodeAnalyzer;
exports.default = CodeAnalyzer;
