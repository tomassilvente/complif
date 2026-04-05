import { SignatureRequestStatus } from '@prisma/client';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { RuleLogic, GroupRequirement } from '../types';

// ─── Accounts ────────────────────────────────────────────────────────────────

export async function createAccount(name: string) {
  return prisma.account.create({ data: { name } });
}

export async function getAccountById(id: string) {
  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      groups: {
        include: { signerGroups: { include: { signer: true } } },
      },
      rules: { include: { faculty: true } },
      signers: true,
    },
  });

  if (!account) throw new AppError(404, 'Account not found');

  return account;
}

// ─── Faculties ────────────────────────────────────────────────────────────────

export async function createFaculty(code: string, name: string, description?: string) {
  const existing = await prisma.faculty.findUnique({ where: { code } });
  if (existing) throw new AppError(409, `Faculty with code '${code}' already exists`);

  return prisma.faculty.create({ data: { code, name, description: description ?? null } });
}

export async function listFaculties() {
  return prisma.faculty.findMany({ orderBy: { createdAt: 'asc' } });
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export async function createGroup(accountId: string, name: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new AppError(404, 'Account not found');

  return prisma.group.create({ data: { accountId, name } });
}

export async function listGroups(accountId: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new AppError(404, 'Account not found');

  return prisma.group.findMany({
    where: { accountId },
    include: { signerGroups: { include: { signer: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

// ─── Signers ─────────────────────────────────────────────────────────────────

export async function createSigner(accountId: string, name: string, email: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new AppError(404, 'Account not found');

  const existing = await prisma.signer.findUnique({
    where: { accountId_email: { accountId, email } },
  });
  if (existing) throw new AppError(409, 'Signer with this email already exists in this account');

  return prisma.signer.create({ data: { accountId, name, email } });
}

export async function addSignerToGroup(signerId: string, groupId: string) {
  // Verify signer exists
  const signer = await prisma.signer.findUnique({ where: { id: signerId } });
  if (!signer) throw new AppError(404, 'Signer not found');

  // Verify group exists
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new AppError(404, 'Group not found');

  // Must be in same account
  if (signer.accountId !== group.accountId) {
    throw new AppError(400, 'Signer and group must belong to the same account');
  }

  return prisma.signerGroup.upsert({
    where: { signerId_groupId: { signerId, groupId } },
    create: { signerId, groupId },
    update: {},
  });
}

// ─── Rules ───────────────────────────────────────────────────────────────────

export async function upsertRule(accountId: string, facultyId: string, ruleLogic: RuleLogic) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new AppError(404, 'Account not found');

  const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
  if (!faculty) throw new AppError(404, 'Faculty not found');

  return prisma.rule.upsert({
    where: { accountId_facultyId: { accountId, facultyId } },
    create: {
      accountId,
      facultyId,
      ruleLogic: ruleLogic as object,
    },
    update: { ruleLogic: ruleLogic as object },
    include: { faculty: true },
  });
}

export async function listRules(accountId: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new AppError(404, 'Account not found');

  return prisma.rule.findMany({
    where: { accountId },
    include: { faculty: true },
    orderBy: { createdAt: 'asc' },
  });
}

// ─── Signature Requests ──────────────────────────────────────────────────────

export async function createSignatureRequest(
  accountId: string,
  facultyId: string,
  documentName: string
) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new AppError(404, 'Account not found');

  const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
  if (!faculty) throw new AppError(404, 'Faculty not found');

  // Find the rule for this account + faculty
  const rule = await prisma.rule.findUnique({
    where: { accountId_facultyId: { accountId, facultyId } },
  });

  if (!rule) {
    throw new AppError(
      404,
      `No rule found for account '${accountId}' and faculty '${facultyId}'`
    );
  }

  const ruleLogic = rule.ruleLogic as unknown as RuleLogic;

  // Create the signature request
  const request = await prisma.signatureRequest.create({
    data: { accountId, facultyId, documentName },
  });

  // Create Combination records from rule logic
  if (ruleLogic.combinations && ruleLogic.combinations.length > 0) {
    for (let i = 0; i < ruleLogic.combinations.length; i++) {
      const combination = ruleLogic.combinations[i];
      await prisma.combination.create({
        data: {
          signatureRequestId: request.id,
          combinationIndex: i,
          requiredSignatures: combination.groupRequirements as unknown as object,
        },
      });
    }
  }

  return prisma.signatureRequest.findUnique({
    where: { id: request.id },
    include: { combinations: true, faculty: true },
  });
}

export async function getSignatureRequest(id: string) {
  const request = await prisma.signatureRequest.findUnique({
    where: { id },
    include: {
      combinations: true,
      signatures: { include: { signer: true, group: true } },
      faculty: true,
    },
  });

  if (!request) throw new AppError(404, 'Signature request not found');

  return request;
}

export async function signRequest(requestId: string, signerId: string, groupId: string) {
  // Verify request exists and is signable
  const request = await prisma.signatureRequest.findUnique({
    where: { id: requestId },
    include: { combinations: true, signatures: true },
  });

  if (!request) throw new AppError(404, 'Signature request not found');

  if (request.status === SignatureRequestStatus.COMPLETED) {
    throw new AppError(400, 'Signature request is already completed');
  }

  if (request.status === SignatureRequestStatus.REJECTED) {
    throw new AppError(400, 'Signature request has been rejected');
  }

  // Verify signer belongs to the specified group
  const signerGroup = await prisma.signerGroup.findUnique({
    where: { signerId_groupId: { signerId, groupId } },
  });

  if (!signerGroup) {
    throw new AppError(403, 'Signer does not belong to the specified group');
  }

  // Prevent double signing
  const alreadySigned = await prisma.signature.findUnique({
    where: { signatureRequestId_signerId: { signatureRequestId: requestId, signerId } },
  });

  if (alreadySigned) {
    throw new AppError(409, 'Signer has already signed this request');
  }

  // Create signature
  await prisma.signature.create({
    data: { signatureRequestId: requestId, signerId, groupId },
  });

  // Mark request as IN_PROGRESS if it was PENDING
  if (request.status === SignatureRequestStatus.PENDING) {
    await prisma.signatureRequest.update({
      where: { id: requestId },
      data: { status: SignatureRequestStatus.IN_PROGRESS },
    });
  }

  // Check if any combination is now satisfied
  const allSignatures = await prisma.signature.findMany({
    where: { signatureRequestId: requestId },
  });

  let requestCompleted = false;

  for (const combination of request.combinations) {
    if (combination.isSatisfied) continue;

    const requirements = combination.requiredSignatures as unknown as GroupRequirement[];

    // For each group requirement, count how many unique signers signed from that group
    let combinationMet = true;

    for (const req of requirements) {
      const signaturesForGroup = allSignatures.filter((s) => s.groupId === req.groupId);
      if (signaturesForGroup.length < req.requiredCount) {
        combinationMet = false;
        break;
      }
    }

    if (combinationMet) {
      await prisma.combination.update({
        where: { id: combination.id },
        data: { isSatisfied: true },
      });

      // Mark request as COMPLETED
      await prisma.signatureRequest.update({
        where: { id: requestId },
        data: {
          status: SignatureRequestStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      requestCompleted = true;
      break;
    }
  }

  return prisma.signatureRequest.findUnique({
    where: { id: requestId },
    include: {
      combinations: true,
      signatures: { include: { signer: true, group: true } },
      faculty: true,
    },
  });
}
