import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as signatureController from '../controllers/signature.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── Accounts ────────────────────────────────────────────────────────────────
// POST /api/signature/accounts
router.post('/accounts', signatureController.createAccount);

// GET /api/signature/accounts/:id
router.get('/accounts/:id', signatureController.getAccount);

// ─── Faculties ────────────────────────────────────────────────────────────────
// POST /api/signature/faculties  (ADMIN only)
router.post('/faculties', authorize('ADMIN'), signatureController.createFaculty);

// GET /api/signature/faculties
router.get('/faculties', signatureController.listFaculties);

// ─── Signers ─────────────────────────────────────────────────────────────────
// POST /api/signature/accounts/:accountId/signers
router.post('/accounts/:accountId/signers', signatureController.createSigner);

// POST /api/signature/accounts/:accountId/signers/groups  (add signer to group)
router.post('/accounts/:accountId/signers/groups', signatureController.addSignerToGroup);

// ─── Groups ──────────────────────────────────────────────────────────────────
// POST /api/signature/accounts/:accountId/groups
router.post('/accounts/:accountId/groups', signatureController.createGroup);

// GET /api/signature/accounts/:accountId/groups
router.get('/accounts/:accountId/groups', signatureController.listGroups);

// ─── Rules ───────────────────────────────────────────────────────────────────
// POST /api/signature/accounts/:accountId/rules  (create or update rule)
router.post('/accounts/:accountId/rules', signatureController.upsertRule);

// GET /api/signature/accounts/:accountId/rules
router.get('/accounts/:accountId/rules', signatureController.listRules);

// ─── Signature Requests ──────────────────────────────────────────────────────
// POST /api/signature/requests
router.post('/requests', signatureController.createSignatureRequest);

// GET /api/signature/requests/:id
router.get('/requests/:id', signatureController.getSignatureRequest);

// POST /api/signature/requests/:id/sign
router.post('/requests/:id/sign', signatureController.signRequest);

export default router;
