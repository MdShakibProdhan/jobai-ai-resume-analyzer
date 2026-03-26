import fs from 'fs';
import path from 'path';

// In serverless (Netlify Functions), use /tmp for writable storage
const isServerless = !!process.env.NETLIFY || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const dataDir = isServerless
  ? '/tmp/jobai-data'
  : path.join(__dirname, '../data');

const DB_FILE = path.join(dataDir, 'db.json');

// Make sure data folder exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load existing data from file or start fresh
const loadData = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {
    console.warn('Could not load db.json, starting fresh');
  }
  return { jobStore: {}, resumeStore: {}, analysisStore: {}, sessionStore: {}, userStore: {} };
};

const data = loadData();

export const jobStore: Record<string, any> = data.jobStore || {};
export const resumeStore: Record<string, any> = data.resumeStore || {};
export const analysisStore: Record<string, any> = data.analysisStore || {};
export const sessionStore: Record<string, any> = data.sessionStore || {};
export const userStore: Record<string, any> = data.userStore || {};

// Save to file whenever data changes
export const saveData = () => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify({
      jobStore,
      resumeStore,
      analysisStore,
      sessionStore,
      userStore,
    }, null, 2));
  } catch (err) {
    console.error('Failed to save data:', err);
  }
};
