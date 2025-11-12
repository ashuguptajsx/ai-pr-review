import dotenv from 'dotenv';
import app from './app';

// Load environment variables
dotenv.config({ path: '/home/ashu/projects/pr_review/backend/.env' });

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 AI PR Reviewer Backend on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
