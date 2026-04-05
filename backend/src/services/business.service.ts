import { BusinessStatus, Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { calculateRiskScore, getRiskBreakdown } from './risk.service';
import { CreateBusinessInput, ListBusinessesFilters, RiskScoreResult } from '../types';

export async function createBusiness(data: CreateBusinessInput, userId: string) {
  // Verificar CUIT duplicado
  const existing = await prisma.business.findUnique({ where: { taxId: data.taxId } });
  if (existing) {
    throw new AppError(409, `A business with taxId '${data.taxId}' already exists`);
  }

  // Crear empresa con estado PENDING
  const business = await prisma.business.create({
    data: {
      name: data.name,
      taxId: data.taxId,
      country: data.country,
      industry: data.industry,
      status: BusinessStatus.PENDING,
      createdBy: userId,
    },
  });

  // Calcular puntaje de riesgo (sin documentos aún → +60 por 3 docs faltantes)
  const riskScore = calculateRiskScore(
    { country: data.country, industry: data.industry },
    []
  );

  // Determinar estado final
  const finalStatus = riskScore > 70 ? BusinessStatus.IN_REVIEW : BusinessStatus.PENDING;

  // Actualizar puntaje de riesgo (y estado si se marcó automáticamente)
  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      riskScore,
      status: finalStatus,
    },
  });

  // Crear entrada inicial en el historial de estados
  await prisma.statusHistory.create({
    data: {
      businessId: business.id,
      previousStatus: null,
      newStatus: finalStatus,
      changedBy: userId,
      comment:
        finalStatus === BusinessStatus.IN_REVIEW
          ? `Marcada automáticamente para revisión. Puntaje de riesgo: ${riskScore}`
          : 'Empresa creada',
    },
  });

  return prisma.business.findUnique({
    where: { id: updated.id },
    include: {
      documents: true,
      statusHistory: { orderBy: { changedAt: 'desc' } },
      creator: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    },
  });
}

export async function listBusinesses(filters: ListBusinessesFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit
    ? Math.min(Math.max(filters.limit, 1), 100)
    : 10;
  const skip = (page - 1) * limit;

  const where: Prisma.BusinessWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.country) {
    where.country = { equals: filters.country, mode: 'insensitive' };
  }

  if (filters.search) {
    where.name = { contains: filters.search, mode: 'insensitive' };
  }

  const [businesses, total] = await Promise.all([
    prisma.business.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { documents: true } },
      },
    }),
    prisma.business.count({ where }),
  ]);

  return {
    businesses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getBusinessById(id: string) {
  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      documents: true,
      statusHistory: { orderBy: { changedAt: 'desc' } },
      creator: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    },
  });

  if (!business) {
    throw new AppError(404, 'Business not found');
  }

  return business;
}

export async function updateBusinessStatus(
  id: string,
  newStatus: BusinessStatus,
  userId: string,
  comment?: string
) {
  const business = await prisma.business.findUnique({ where: { id } });

  if (!business) {
    throw new AppError(404, 'Business not found');
  }

  const previousStatus = business.status;

  await prisma.statusHistory.create({
    data: {
      businessId: id,
      previousStatus,
      newStatus,
      changedBy: userId,
      comment: comment ?? null,
    },
  });

  return prisma.business.update({
    where: { id },
    data: { status: newStatus },
    include: {
      documents: true,
      statusHistory: { orderBy: { changedAt: 'desc' } },
      creator: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    },
  });
}

export async function getBusinessRiskScore(id: string): Promise<RiskScoreResult> {
  const business = await prisma.business.findUnique({
    where: { id },
    include: { documents: true },
  });

  if (!business) {
    throw new AppError(404, 'Business not found');
  }

  const riskScore = calculateRiskScore(
    { country: business.country, industry: business.industry },
    business.documents
  );

  const breakdown = getRiskBreakdown(
    { country: business.country, industry: business.industry },
    business.documents
  );

  await prisma.business.update({
    where: { id },
    data: { riskScore },
  });

  return { businessId: id, riskScore, breakdown };
}
