import { DocumentType } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { calculateRiskScore } from './risk.service';

export async function uploadDocument(
  businessId: string,
  documentType: DocumentType,
  file: Express.Multer.File
) {
  // Verificar que la empresa existe
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { documents: true },
  });

  if (!business) {
    throw new AppError(404, 'Business not found');
  }

  // Verificar si ya existe un documento de este tipo → reemplazar/actualizar
  const existingDoc = business.documents.find((d) => d.documentType === documentType);

  let document;

  if (existingDoc) {
    document = await prisma.document.update({
      where: { id: existingDoc.id },
      data: {
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
      },
    });
  } else {
    document = await prisma.document.create({
      data: {
        businessId,
        documentType,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });
  }

  // Recalcular puntaje de riesgo tras la subida
  const allDocs = await prisma.document.findMany({ where: { businessId } });
  const riskScore = calculateRiskScore(
    { country: business.country, industry: business.industry },
    allDocs
  );

  await prisma.business.update({
    where: { id: businessId },
    data: { riskScore },
  });

  return document;
}

export async function listDocuments(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });

  if (!business) {
    throw new AppError(404, 'Business not found');
  }

  return prisma.document.findMany({
    where: { businessId },
    orderBy: { uploadedAt: 'desc' },
  });
}

export async function getDocumentById(id: string) {
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    throw new AppError(404, 'Document not found');
  }
  return document;
}

export async function deleteDocument(id: string, businessId: string) {
  const document = await prisma.document.findFirst({
    where: { id, businessId },
  });

  if (!document) {
    throw new AppError(404, 'Document not found');
  }

  await prisma.document.delete({ where: { id } });

  // Recalcular puntaje de riesgo tras la eliminación
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { documents: true },
  });

  if (business) {
    const riskScore = calculateRiskScore(
      { country: business.country, industry: business.industry },
      business.documents
    );

    await prisma.business.update({
      where: { id: businessId },
      data: { riskScore },
    });
  }

  return { deleted: true };
}
