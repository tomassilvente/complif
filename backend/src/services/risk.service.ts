import { Document, DocumentType } from '@prisma/client';

const HIGH_RISK_COUNTRIES = [
  'Iran',
  'North Korea',
  'Syria',
  'Cuba',
  'Sudan',
  'Myanmar',
  'Venezuela',
  'Russia',
  'Belarus',
  'Libya',
  'Somalia',
  'Yemen',
];

const HIGH_RISK_INDUSTRIES = [
  'construction',
  'security',
  'exchange',
  'casino',
  'casinos',
  'gambling',
  'casas de cambio',
  'construccion',
  'construcción',
  'seguridad',
];

export const REQUIRED_DOCUMENT_TYPES: DocumentType[] = [
  DocumentType.TAX_CERTIFICATE,
  DocumentType.REGISTRATION,
  DocumentType.INSURANCE_POLICY,
];

export function calculateRiskScore(
  business: { country: string; industry: string },
  documents: Pick<Document, 'documentType'>[]
): number {
  let score = 0;

  // Riesgo por país
  const isHighRiskCountry = HIGH_RISK_COUNTRIES.some(
    (c) => c.toLowerCase() === business.country.toLowerCase()
  );
  if (isHighRiskCountry) {
    score += 30;
  }

  // Riesgo por industria
  const isHighRiskIndustry = HIGH_RISK_INDUSTRIES.some(
    (i) => i.toLowerCase() === business.industry.toLowerCase()
  );
  if (isHighRiskIndustry) {
    score += 30;
  }

  // Riesgo por documentos faltantes
  const uploadedTypes = new Set(documents.map((d) => d.documentType));
  const missingDocs = REQUIRED_DOCUMENT_TYPES.filter((type) => !uploadedTypes.has(type));

  score += missingDocs.length * 20;

  return Math.min(score, 100);
}

export function getRiskBreakdown(
  business: { country: string; industry: string },
  documents: Pick<Document, 'documentType'>[]
) {
  const isHighRiskCountry = HIGH_RISK_COUNTRIES.some(
    (c) => c.toLowerCase() === business.country.toLowerCase()
  );
  const countryRisk = isHighRiskCountry ? 30 : 0;

  const isHighRiskIndustry = HIGH_RISK_INDUSTRIES.some(
    (i) => i.toLowerCase() === business.industry.toLowerCase()
  );
  const industryRisk = isHighRiskIndustry ? 30 : 0;

  const uploadedTypes = new Set(documents.map((d) => d.documentType));
  const missingDocs = REQUIRED_DOCUMENT_TYPES.filter((type) => !uploadedTypes.has(type));
  const missingDocsRisk = missingDocs.length * 20;

  return {
    countryRisk,
    industryRisk,
    missingDocsRisk,
    missingDocs,
  };
}
