import { Response, NextFunction } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { DocumentType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import * as documentService from '../services/document.service';
import * as notificationService from '../services/notification.service';
import { AppError } from '../middleware/errorHandler';
import { io } from '../index';

const uploadSchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
  documentType: z.nativeEnum(DocumentType, {
    errorMap: () => ({ message: 'Invalid document type' }),
  }),
});

const listSchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
});

const deleteSchema = z.object({
  businessId: z.string().uuid('Invalid business ID'),
});

export async function uploadDocument(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    const body = uploadSchema.parse(req.body);
    const document = await documentService.uploadDocument(
      body.businessId,
      body.documentType,
      req.file
    );

    // Emitir notificación en tiempo real
    notificationService.notifyDocumentUploaded(body.businessId, body.documentType, io);

    res.status(201).json({
      status: 'success',
      data: { document },
    });
  } catch (error) {
    next(error);
  }
}

export async function listDocuments(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = listSchema.parse(req.query);
    const documents = await documentService.listDocuments(query.businessId);

    res.json({
      status: 'success',
      data: { documents },
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadDocument(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const document = await documentService.getDocumentById(req.params.id);

    if (!fs.existsSync(document.filePath)) {
      throw new AppError(404, 'File not found on disk');
    }

    const filename = path.basename(document.filePath);
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName || filename}"`);
    fs.createReadStream(document.filePath).pipe(res);
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = deleteSchema.parse(req.query);
    const result = await documentService.deleteDocument(req.params.id, query.businessId);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
