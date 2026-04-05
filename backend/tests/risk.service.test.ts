import { DocumentType } from '@prisma/client';
import { calculateRiskScore } from '../src/services/risk.service';

// Mock the Prisma client to avoid DB connections
jest.mock('../src/config/database', () => ({
  __esModule: true,
  default: {},
}));

// Mock logger
jest.mock('../src/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

describe('calculateRiskScore', () => {
  // ─── Country risk ──────────────────────────────────────────────────────────

  it('adds 30 points for a high-risk country', () => {
    const score = calculateRiskScore(
      { country: 'Russia', industry: 'technology' },
      [
        { documentType: DocumentType.TAX_CERTIFICATE },
        { documentType: DocumentType.REGISTRATION },
        { documentType: DocumentType.INSURANCE_POLICY },
      ]
    );
    expect(score).toBe(30);
  });

  it('adds 0 points for a low-risk country', () => {
    const score = calculateRiskScore(
      { country: 'Argentina', industry: 'technology' },
      [
        { documentType: DocumentType.TAX_CERTIFICATE },
        { documentType: DocumentType.REGISTRATION },
        { documentType: DocumentType.INSURANCE_POLICY },
      ]
    );
    expect(score).toBe(0);
  });

  it('is case-insensitive for country matching', () => {
    const upper = calculateRiskScore(
      { country: 'RUSSIA', industry: 'technology' },
      [
        { documentType: DocumentType.TAX_CERTIFICATE },
        { documentType: DocumentType.REGISTRATION },
        { documentType: DocumentType.INSURANCE_POLICY },
      ]
    );
    const lower = calculateRiskScore(
      { country: 'russia', industry: 'technology' },
      [
        { documentType: DocumentType.TAX_CERTIFICATE },
        { documentType: DocumentType.REGISTRATION },
        { documentType: DocumentType.INSURANCE_POLICY },
      ]
    );
    expect(upper).toBe(30);
    expect(lower).toBe(30);
  });

  // ─── Industry risk ─────────────────────────────────────────────────────────

  it('adds 30 points for a high-risk industry', () => {
    const score = calculateRiskScore(
      { country: 'Argentina', industry: 'casino' },
      [
        { documentType: DocumentType.TAX_CERTIFICATE },
        { documentType: DocumentType.REGISTRATION },
        { documentType: DocumentType.INSURANCE_POLICY },
      ]
    );
    expect(score).toBe(30);
  });

  it('adds 30 points for construccion (Spanish)', () => {
    const score = calculateRiskScore(
      { country: 'Argentina', industry: 'construccion' },
      [
        { documentType: DocumentType.TAX_CERTIFICATE },
        { documentType: DocumentType.REGISTRATION },
        { documentType: DocumentType.INSURANCE_POLICY },
      ]
    );
    expect(score).toBe(30);
  });

  it('adds 0 points for a low-risk industry', () => {
    const score = calculateRiskScore(
      { country: 'Argentina', industry: 'technology' },
      [
        { documentType: DocumentType.TAX_CERTIFICATE },
        { documentType: DocumentType.REGISTRATION },
        { documentType: DocumentType.INSURANCE_POLICY },
      ]
    );
    expect(score).toBe(0);
  });

  // ─── Missing documents risk ────────────────────────────────────────────────

  it('adds 20 points for each missing required document', () => {
    const score = calculateRiskScore(
      { country: 'Argentina', industry: 'technology' },
      [{ documentType: DocumentType.TAX_CERTIFICATE }]
    );
    // Missing REGISTRATION and INSURANCE_POLICY → +40
    expect(score).toBe(40);
  });

  it('adds 60 points when all required documents are missing', () => {
    const score = calculateRiskScore(
      { country: 'Argentina', industry: 'technology' },
      []
    );
    expect(score).toBe(60);
  });

  it('adds 20 points for one missing document', () => {
    const score = calculateRiskScore(
      { country: 'Argentina', industry: 'technology' },
      [
        { documentType: DocumentType.TAX_CERTIFICATE },
        { documentType: DocumentType.REGISTRATION },
      ]
    );
    // Missing INSURANCE_POLICY → +20
    expect(score).toBe(20);
  });

  it('adds 0 points when all required documents are present', () => {
    const score = calculateRiskScore(
      { country: 'Argentina', industry: 'technology' },
      [
        { documentType: DocumentType.TAX_CERTIFICATE },
        { documentType: DocumentType.REGISTRATION },
        { documentType: DocumentType.INSURANCE_POLICY },
      ]
    );
    expect(score).toBe(0);
  });

  // ─── Maximum score cap ────────────────────────────────────────────────────

  it('caps the score at 100', () => {
    // High-risk country (+30) + high-risk industry (+30) + 3 missing docs (+60) = 120 → capped at 100
    const score = calculateRiskScore(
      { country: 'Russia', industry: 'casino' },
      []
    );
    expect(score).toBe(100);
  });

  it('caps double-risk (country + industry) with missing docs at 100', () => {
    const score = calculateRiskScore(
      { country: 'North Korea', industry: 'gambling' },
      []
    );
    expect(score).toBe(100);
  });

  // ─── Combined scenarios ────────────────────────────────────────────────────

  it('returns 0 for complete docs with safe country and industry', () => {
    const score = calculateRiskScore(
      { country: 'Argentina', industry: 'agriculture' },
      [
        { documentType: DocumentType.TAX_CERTIFICATE },
        { documentType: DocumentType.REGISTRATION },
        { documentType: DocumentType.INSURANCE_POLICY },
      ]
    );
    expect(score).toBe(0);
  });

  it('ignores non-required document types for scoring (OTHER does not count as required)', () => {
    const score = calculateRiskScore(
      { country: 'Argentina', industry: 'technology' },
      [
        { documentType: DocumentType.TAX_CERTIFICATE },
        { documentType: DocumentType.REGISTRATION },
        { documentType: DocumentType.OTHER }, // Not a required type
      ]
    );
    // Still missing INSURANCE_POLICY → +20
    expect(score).toBe(20);
  });

  it('combines country + industry risk correctly', () => {
    const score = calculateRiskScore(
      { country: 'Cuba', industry: 'casino' },
      [
        { documentType: DocumentType.TAX_CERTIFICATE },
        { documentType: DocumentType.REGISTRATION },
        { documentType: DocumentType.INSURANCE_POLICY },
      ]
    );
    // country +30 + industry +30 = 60
    expect(score).toBe(60);
  });
});
