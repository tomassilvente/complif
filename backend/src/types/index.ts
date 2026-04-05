import { BusinessStatus, DocumentType, UserRole } from '@prisma/client';

// ─── Autenticación ───────────────────────────────────────────────────────────

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  user: SafeUser;
  accessToken: string;
}

export interface SafeUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Empresa ─────────────────────────────────────────────────────────────────

export interface CreateBusinessInput {
  name: string;
  taxId: string;
  country: string;
  industry: string;
}

export interface ListBusinessesFilters {
  status?: BusinessStatus;
  country?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Riesgo ──────────────────────────────────────────────────────────────────

export interface RiskBreakdown {
  countryRisk: number;
  industryRisk: number;
  missingDocsRisk: number;
  missingDocs: DocumentType[];
}

export interface RiskScoreResult {
  businessId: string;
  riskScore: number;
  breakdown: RiskBreakdown;
}

// ─── Documento ───────────────────────────────────────────────────────────────

export interface UploadDocumentInput {
  businessId: string;
  documentType: DocumentType;
}

// ─── Firma ───────────────────────────────────────────────────────────────────

export interface GroupRequirement {
  groupId: string;
  requiredCount: number;
}

export interface CombinationRule {
  groupRequirements: GroupRequirement[];
}

export interface RuleLogic {
  combinations: CombinationRule[];
}
