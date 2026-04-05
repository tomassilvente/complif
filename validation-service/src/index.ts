import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// ────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ────────────────────────────────────────────────────────────
// Validation logic
// ────────────────────────────────────────────────────────────

/**
 * CUIT (Argentina) validation.
 *
 * Format: XX-XXXXXXXX-X  or  XXXXXXXXXXX (11 digits)
 * Valid type prefixes: 20, 23, 24 (male person), 27 (female person),
 *                      30, 33, 34 (company)
 * Checksum: multiply each of the first 10 digits by [5,4,3,2,7,6,5,4,3,2],
 *           sum the products, mod 11:
 *             remainder == 0 → check digit is 0
 *             remainder == 1 → INVALID  (check digit would be 10)
 *             otherwise      → check digit is 11 - remainder
 */
function validateCUIT(raw: string): { valid: boolean; message: string } {
  // Remove dashes
  const digits = raw.replace(/-/g, '');

  if (!/^\d{11}$/.test(digits)) {
    return { valid: false, message: 'CUIT must contain exactly 11 digits (format: XX-XXXXXXXX-X)' };
  }

  const validTypes = ['20', '23', '24', '27', '30', '33', '34'];
  const typePrefix = digits.slice(0, 2);
  if (!validTypes.includes(typePrefix)) {
    return {
      valid: false,
      message: `Invalid CUIT type prefix "${typePrefix}". Valid prefixes: ${validTypes.join(', ')}`,
    };
  }

  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * multipliers[i];
  }

  const remainder = sum % 11;
  let expectedCheckDigit: number;

  if (remainder === 0) {
    expectedCheckDigit = 0;
  } else if (remainder === 1) {
    // Would produce 10 — structurally invalid CUIT
    return { valid: false, message: 'Invalid CUIT: checksum produces an invalid check digit (10)' };
  } else {
    expectedCheckDigit = 11 - remainder;
  }

  const actualCheckDigit = parseInt(digits[10], 10);
  if (actualCheckDigit !== expectedCheckDigit) {
    return {
      valid: false,
      message: `Invalid CUIT: check digit is ${actualCheckDigit}, expected ${expectedCheckDigit}`,
    };
  }

  return { valid: true, message: 'Valid CUIT' };
}

/**
 * RFC (Mexico) validation.
 *
 * Companies : 3 letters + 6 digits (YYMMDD) + 3 alphanumeric = 12 chars
 * Individuals: 4 letters + 6 digits + 3 alphanumeric = 13 chars
 * This service validates both but labels companies (12-char) specifically.
 */
function validateRFC(raw: string): { valid: boolean; message: string } {
  const rfc = raw.toUpperCase().trim();

  // Company RFC: 3 letters + 6 digits + 3 alphanumeric (12 chars total)
  const companyPattern = /^[A-Z]{3}[0-9]{6}[A-Z0-9]{3}$/;
  // Individual RFC: 4 letters + 6 digits + 3 alphanumeric (13 chars total)
  const personPattern = /^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$/;

  if (companyPattern.test(rfc)) {
    return { valid: true, message: 'Valid RFC (company, 12 characters)' };
  }

  if (personPattern.test(rfc)) {
    return { valid: true, message: 'Valid RFC (individual, 13 characters)' };
  }

  if (rfc.length === 12) {
    return {
      valid: false,
      message: 'Invalid RFC: company RFC must match pattern [A-Z]{3}[0-9]{6}[A-Z0-9]{3}',
    };
  }

  if (rfc.length === 13) {
    return {
      valid: false,
      message: 'Invalid RFC: individual RFC must match pattern [A-Z]{4}[0-9]{6}[A-Z0-9]{3}',
    };
  }

  return {
    valid: false,
    message: `Invalid RFC length: got ${rfc.length} characters, expected 12 (company) or 13 (individual)`,
  };
}

/**
 * Generic fallback validation for other countries.
 * Requires at least 5 alphanumeric characters.
 */
function validateGeneric(taxId: string): { valid: boolean; message: string } {
  const cleaned = taxId.trim();
  if (cleaned.length < 5) {
    return { valid: false, message: 'Tax ID must be at least 5 characters long' };
  }
  if (!/^[A-Z0-9\-\.\/]+$/i.test(cleaned)) {
    return { valid: false, message: 'Tax ID must contain only alphanumeric characters and dashes' };
  }
  return { valid: true, message: 'Tax ID format appears valid' };
}

// ────────────────────────────────────────────────────────────
// Helper: run validation and build response
// ────────────────────────────────────────────────────────────
interface ValidationResult {
  valid: boolean;
  taxId: string;
  country: string;
  format: string;
  message: string;
}

function runValidation(taxId: string, country: string): ValidationResult {
  const normalizedCountry = country.trim().toLowerCase();

  if (normalizedCountry === 'argentina') {
    const result = validateCUIT(taxId);
    return {
      valid: result.valid,
      taxId,
      country,
      format: 'CUIT (XX-XXXXXXXX-X)',
      message: result.message,
    };
  }

  if (normalizedCountry === 'mexico' || normalizedCountry === 'méxico') {
    const result = validateRFC(taxId);
    const isCompany = taxId.replace(/\s/g, '').length === 12;
    return {
      valid: result.valid,
      taxId,
      country,
      format: isCompany ? 'RFC (company, 12 chars)' : 'RFC (individual, 13 chars)',
      message: result.message,
    };
  }

  const result = validateGeneric(taxId);
  return {
    valid: result.valid,
    taxId,
    country,
    format: 'Generic tax ID (alphanumeric, 5+ chars)',
    message: result.message,
  };
}

// ────────────────────────────────────────────────────────────
// Request schema (Zod)
// ────────────────────────────────────────────────────────────
const validateSchema = z.object({
  taxId: z.string().min(1, 'taxId is required'),
  country: z.string().min(1, 'country is required'),
});

// ────────────────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────────────────

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'complif-validation-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// POST /validate
app.post('/validate', (req: Request, res: Response) => {
  const parsed = validateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid request body',
      details: parsed.error.errors,
    });
    return;
  }

  const { taxId, country } = parsed.data;
  const result = runValidation(taxId, country);
  res.json(result);
});

// GET /validate?taxId=...&country=...  (convenience endpoint)
app.get('/validate', (req: Request, res: Response) => {
  const { taxId, country } = req.query;

  if (typeof taxId !== 'string' || typeof country !== 'string') {
    res.status(400).json({
      error: 'Missing query parameters',
      details: 'Both taxId and country query parameters are required',
    });
    return;
  }

  const parsed = validateSchema.safeParse({ taxId, country });
  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid query parameters',
      details: parsed.error.errors,
    });
    return;
  }

  const result = runValidation(taxId, country);
  res.json(result);
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ────────────────────────────────────────────────────────────
// Start
// ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Complif Validation Service running on port ${PORT}`);
});

export default app;
