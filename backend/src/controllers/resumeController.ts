import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { resumeStore, analysisStore, saveData } from '../store';

export const uploadResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { originalname, mimetype, buffer } = req.file;
    const userId = (req as any).user?.id || 'anonymous';

    let extractedText = '';

    try {
      if (mimetype === 'application/pdf') {
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text;
      } else if (mimetype.includes('wordprocessingml')) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      }
    } catch (parseErr) {
      console.warn('File parse error:', parseErr);
      extractedText = 'Could not extract text from file.';
    }

    const resume = {
      id: crypto.randomUUID(),
      userId,
      filename: originalname,
      mimetype,
      text: extractedText,
      wordCount: extractedText.split(/\s+/).filter(Boolean).length,
      uploadedAt: new Date().toISOString(),
    };

    resumeStore[resume.id] = resume;
saveData();

    const { text, ...summary } = resume;
    res.status(201).json({ ...summary, previewText: text.slice(0, 500) });
  } catch (err: any) {
    console.error('uploadResume error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

export const getResumes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const resumes = Object.values(resumeStore)
      .filter((r: any) => r.userId === userId)
      .map(({ text, ...r }: any) => r);
    res.json(resumes);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to get resumes', error: err.message });
  }
};

export const deleteResume = async (req: Request, res: Response) => {
  if (!resumeStore[req.params.id]) {
    return res.status(404).json({ message: 'Resume not found' });
  }
  // Clean up analyses linked to this resume
  for (const [id, a] of Object.entries(analysisStore)) {
    if ((a as any).resumeId === req.params.id) delete analysisStore[id];
  }
  delete resumeStore[req.params.id];
  saveData();
  res.json({ message: 'Deleted' });
};

// Extract raw text from an uploaded CV file
export const parseCV = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const { mimetype, buffer } = req.file;
    let text = '';

    if (mimetype === 'application/pdf') {
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (mimetype.includes('wordprocessingml')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    if (!text || text.length < 10) {
      return res.status(400).json({ message: 'Could not extract text from file' });
    }

    res.json({ text });
  } catch (err: any) {
    console.error('parseCV error:', err);
    res.status(500).json({ message: 'Failed to parse CV' });
  }
};