import { Request, Response } from 'express';
import axios from 'axios';
import { jobStore, analysisStore, saveData } from '../store';

export const createJob = async (req: Request, res: Response) => {
  try {
    const { title, company, description, location, url } = req.body;
    const userId = (req as any).user?.id || 'anonymous';

    let skills: string[] = [];
    let requirements: string[] = [];

    try {
      const { extractJobDataFromText } = await import('../services/aiService');
      const extracted = await extractJobDataFromText(description);
      skills = extracted.skills || [];
      requirements = extracted.requirements || [];
    } catch (aiErr) {
      console.warn('AI extraction skipped, using keyword fallback');
      const commonSkills = [
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
        'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'AWS', 'Git', 'CSS',
        'HTML', 'REST', 'API', 'Figma', 'Excel', 'Communication',
        'Leadership', 'Teamwork', 'English',
      ];
      skills = commonSkills.filter(s =>
        description.toLowerCase().includes(s.toLowerCase())
      );
    }

    const job = {
      id: crypto.randomUUID(),
      userId,
      title,
      company,
      description,
      location: location || '',
      url: url || '',
      skills,
      requirements,
      createdAt: new Date().toISOString(),
    };

    jobStore[job.id] = job;
saveData();
    res.status(201).json(job);
  } catch (err: any) {
    console.error('createJob error:', err);
    res.status(500).json({ message: 'Failed to create job', error: err.message });
  }
};

export const scrapeJobUrl = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    let rawText = '';

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      rawText = response.data
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 5000);

    } catch (fetchErr: any) {
      return res.status(400).json({
        message: `Could not fetch that URL: ${fetchErr.message}. Please copy and paste the job description manually instead.`,
      });
    }

    if (!rawText || rawText.length < 100) {
      return res.status(400).json({
        message: 'Could not extract text from that URL. Sites like LinkedIn and Indeed block scrapers. Please copy and paste the job description manually.',
      });
    }

    let skills: string[] = [];
    let requirements: string[] = [];

    try {
      const { extractJobDataFromText } = await import('../services/aiService');
      const extracted = await extractJobDataFromText(rawText);
      skills = extracted.skills || [];
      requirements = extracted.requirements || [];
    } catch {
      const commonSkills = [
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
        'Java', 'SQL', 'MongoDB', 'Docker', 'AWS', 'Git',
      ];
      skills = commonSkills.filter(s =>
        rawText.toLowerCase().includes(s.toLowerCase())
      );
    }

    res.json({
      raw: rawText.slice(0, 2000),
      skills,
      requirements,
      sourceUrl: url,
    });
  } catch (err: any) {
    console.error('scrapeJobUrl error:', err);
    res.status(500).json({ message: 'Scraping failed', error: err.message });
  }
};

export const getJobs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const jobs = Object.values(jobStore).filter((j: any) => j.userId === userId);
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to get jobs', error: err.message });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  const job = jobStore[req.params.id];
  if (!job) return res.status(404).json({ message: 'Job not found' });
  res.json(job);
};

export const deleteJob = async (req: Request, res: Response) => {
  if (!jobStore[req.params.id]) return res.status(404).json({ message: 'Job not found' });
  // Clean up analyses linked to this job
  for (const [id, a] of Object.entries(analysisStore)) {
    if ((a as any).jobId === req.params.id) delete analysisStore[id];
  }
  delete jobStore[req.params.id];
  saveData();
  res.json({ message: 'Deleted' });
};