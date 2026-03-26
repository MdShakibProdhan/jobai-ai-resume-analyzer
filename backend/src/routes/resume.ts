import { Router } from 'express';
import multer from 'multer';
import { uploadResume, getResumes, deleteResume } from '../controllers/resumeController';
import { authenticate } from '../middleware/authenticate';

export const resumeRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '10')) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

resumeRouter.use(authenticate);

resumeRouter.get('/', getResumes);
resumeRouter.post('/upload', upload.single('resume'), uploadResume);
resumeRouter.delete('/:id', deleteResume);
