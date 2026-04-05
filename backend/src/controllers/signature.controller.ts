import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import * as signatureService from '../services/signature.service';

// ─── Schemas de Validación ───────────────────────────────────────────────────

const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

const createFacultySchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

const createSignerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

const addSignerToGroupSchema = z.object({
  signerId: z.string().uuid(),
  groupId: z.string().uuid(),
});

const groupRequirementSchema = z.object({
  groupId: z.string().uuid(),
  requiredCount: z.number().int().min(1),
});

const ruleLogicSchema = z.object({
  combinations: z.array(
    z.object({
      groupRequirements: z.array(groupRequirementSchema),
    })
  ),
});

const upsertRuleSchema = z.object({
  facultyId: z.string().uuid(),
  ruleLogic: ruleLogicSchema,
});

const createSignatureRequestSchema = z.object({
  accountId: z.string().uuid(),
  facultyId: z.string().uuid(),
  documentName: z.string().min(1, 'Document name is required'),
});

const signRequestSchema = z.object({
  signerId: z.string().uuid(),
  groupId: z.string().uuid(),
});

// ─── Controllers ─────────────────────────────────────────────────────────────

export async function createAccount(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = createAccountSchema.parse(req.body);
    const account = await signatureService.createAccount(body.name);

    res.status(201).json({ status: 'success', data: { account } });
  } catch (error) {
    next(error);
  }
}

export async function getAccount(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const account = await signatureService.getAccountById(req.params.id);

    res.json({ status: 'success', data: { account } });
  } catch (error) {
    next(error);
  }
}

export async function createFaculty(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = createFacultySchema.parse(req.body);
    const faculty = await signatureService.createFaculty(
      body.code,
      body.name,
      body.description
    );

    res.status(201).json({ status: 'success', data: { faculty } });
  } catch (error) {
    next(error);
  }
}

export async function listFaculties(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const faculties = await signatureService.listFaculties();

    res.json({ status: 'success', data: { faculties } });
  } catch (error) {
    next(error);
  }
}

export async function createGroup(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = createGroupSchema.parse(req.body);
    const group = await signatureService.createGroup(req.params.accountId, body.name);

    res.status(201).json({ status: 'success', data: { group } });
  } catch (error) {
    next(error);
  }
}

export async function listGroups(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const groups = await signatureService.listGroups(req.params.accountId);

    res.json({ status: 'success', data: { groups } });
  } catch (error) {
    next(error);
  }
}

export async function createSigner(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = createSignerSchema.parse(req.body);
    const signer = await signatureService.createSigner(
      req.params.accountId,
      body.name,
      body.email
    );

    res.status(201).json({ status: 'success', data: { signer } });
  } catch (error) {
    next(error);
  }
}

export async function addSignerToGroup(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = addSignerToGroupSchema.parse(req.body);
    const signerGroup = await signatureService.addSignerToGroup(body.signerId, body.groupId);

    res.status(201).json({ status: 'success', data: { signerGroup } });
  } catch (error) {
    next(error);
  }
}

export async function upsertRule(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = upsertRuleSchema.parse(req.body);
    const rule = await signatureService.upsertRule(
      req.params.accountId,
      body.facultyId,
      body.ruleLogic
    );

    res.status(201).json({ status: 'success', data: { rule } });
  } catch (error) {
    next(error);
  }
}

export async function listRules(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rules = await signatureService.listRules(req.params.accountId);

    res.json({ status: 'success', data: { rules } });
  } catch (error) {
    next(error);
  }
}

export async function createSignatureRequest(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = createSignatureRequestSchema.parse(req.body);
    const request = await signatureService.createSignatureRequest(
      body.accountId,
      body.facultyId,
      body.documentName
    );

    res.status(201).json({ status: 'success', data: { request } });
  } catch (error) {
    next(error);
  }
}

export async function getSignatureRequest(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const request = await signatureService.getSignatureRequest(req.params.id);

    res.json({ status: 'success', data: { request } });
  } catch (error) {
    next(error);
  }
}

export async function signRequest(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = signRequestSchema.parse(req.body);
    const request = await signatureService.signRequest(
      req.params.id,
      body.signerId,
      body.groupId
    );

    res.json({ status: 'success', data: { request } });
  } catch (error) {
    next(error);
  }
}
