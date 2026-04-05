export type UserRole = 'ADMIN' | 'VIEWER'
export type BusinessStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'
export type DocumentType =
  | 'TAX_CERTIFICATE'
  | 'REGISTRATION'
  | 'INSURANCE_POLICY'
  | 'INCORPORATION_DEED'
  | 'POWER_OF_ATTORNEY'
  | 'OTHER'

export interface User {
  id: string
  email: string
  role: UserRole
  firstName?: string
  lastName?: string
}

export interface Business {
  id: string
  name: string
  taxId: string
  country: string
  industry: string
  status: BusinessStatus
  riskScore: number
  createdAt: string
  updatedAt: string
  creator?: User
  documents?: Document[]
  statusHistory?: StatusHistory[]
  _count?: { documents: number }
}

export interface Document {
  id: string
  businessId: string
  documentType: DocumentType
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedAt: string
}

export interface StatusHistory {
  id: string
  businessId: string
  previousStatus?: BusinessStatus
  newStatus: BusinessStatus
  changedBy: string
  comment?: string
  changedAt: string
  user?: User
}

export interface PaginatedResponse<T> {
  businesses: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
