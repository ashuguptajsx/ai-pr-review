"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
// Load environment variables
dotenv_1.default.config({ path: '/home/ashu/projects/pr_review/backend/.env' });
const PORT = process.env.PORT || 3001;
app_1.default.listen(PORT, () => {
    console.log(`🚀 AI PR Reviewer Backend on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
