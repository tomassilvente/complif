import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/auth';
import * as documentController from '../controllers/document.controller';

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPEG, and PNG files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/documents
router.post('/', upload.single('file'), documentController.uploadDocument);

// GET /api/documents?businessId=...
router.get('/', documentController.listDocuments);

// GET /api/documents/:id/download
router.get('/:id/download', documentController.downloadDocument);

// DELETE /api/documents/:id?businessId=...
router.delete('/:id', documentController.deleteDocument);

export default router;
