import { Server } from 'socket.io';
import { BusinessStatus, DocumentType } from '@prisma/client';
import { logger } from '../utils/logger';

export function notifyStatusChange(
  businessId: string,
  businessName: string,
  previousStatus: BusinessStatus | null,
  newStatus: BusinessStatus,
  io: Server
): void {
  const payload = {
    businessId,
    businessName,
    previousStatus,
    newStatus,
    timestamp: new Date().toISOString(),
  };

  logger.info('Business status changed', payload);

  io.emit('business:status_changed', payload);
}

export function notifyDocumentUploaded(
  businessId: string,
  documentType: DocumentType,
  io: Server
): void {
  const payload = {
    businessId,
    documentType,
    timestamp: new Date().toISOString(),
  };

  logger.info('Document uploaded', payload);

  io.emit('document:uploaded', payload);
}
