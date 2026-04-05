import { PrismaClient, BusinessStatus, DocumentType, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('Iniciando seed...');

  // ─── Limpiar datos existentes ────────────────────────────────────────────
  await prisma.signature.deleteMany();
  await prisma.signerGroup.deleteMany();
  await prisma.signer.deleteMany();
  await prisma.combination.deleteMany();
  await prisma.signatureRequest.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.group.deleteMany();
  await prisma.signatureSchema.deleteMany();
  await prisma.account.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.document.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  // ─── Usuarios ────────────────────────────────────────────────────────────
  console.log('Creando usuarios...');

  const adminHash = await bcrypt.hash('Admin123!', SALT_ROUNDS);
  const viewerHash = await bcrypt.hash('Viewer123!', SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@complif.com',
      passwordHash: adminHash,
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'Complif',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@complif.com',
      passwordHash: viewerHash,
      role: UserRole.VIEWER,
      firstName: 'Viewer',
      lastName: 'Complif',
    },
  });

  console.log(`Usuarios creados: ${admin.email}, ${viewer.email}`);

  // ─── Empresas ──────────────────────────────────────────────────────────────
  console.log('Creando empresas...');

  const businessesData = [
    // Empresas APROBADAS
    {
      name: 'Techno Solutions S.A.',
      taxId: '30-71234567-8',
      country: 'Argentina',
      industry: 'technology',
      status: BusinessStatus.APPROVED,
      riskScore: 0,
    },
    {
      name: 'Alimentos del Sur S.R.L.',
      taxId: '30-65432198-7',
      country: 'Argentina',
      industry: 'food',
      status: BusinessStatus.APPROVED,
      riskScore: 0,
    },
    {
      name: 'Consultora Mendoza & Asociados',
      taxId: '30-78901234-5',
      country: 'Argentina',
      industry: 'consulting',
      status: BusinessStatus.APPROVED,
      riskScore: 20,
    },
    {
      name: 'Farmacéutica del Litoral S.A.',
      taxId: '30-45678901-2',
      country: 'Argentina',
      industry: 'pharmaceutical',
      status: BusinessStatus.APPROVED,
      riskScore: 20,
    },

    // Empresas PENDIENTES
    {
      name: 'Logística Pampeana S.A.',
      taxId: '30-23456789-1',
      country: 'Argentina',
      industry: 'logistics',
      status: BusinessStatus.PENDING,
      riskScore: 60,
    },
    {
      name: 'Textil Norteña S.R.L.',
      taxId: '30-34567890-3',
      country: 'Argentina',
      industry: 'textile',
      status: BusinessStatus.PENDING,
      riskScore: 60,
    },
    {
      name: 'Constructora Patagónica S.A.',
      taxId: '30-56789012-4',
      country: 'Argentina',
      industry: 'construccion',
      status: BusinessStatus.PENDING,
      riskScore: 90,
    },

    // Empresas EN REVISIÓN (alto riesgo)
    {
      name: 'Seguridad Privada del Norte',
      taxId: '30-67890123-6',
      country: 'Venezuela',
      industry: 'security',
      status: BusinessStatus.IN_REVIEW,
      riskScore: 90,
    },
    {
      name: 'Casa de Cambios Rápido S.A.',
      taxId: '30-89012345-9',
      country: 'Argentina',
      industry: 'casas de cambio',
      status: BusinessStatus.IN_REVIEW,
      riskScore: 90,
    },
    {
      name: 'Inversiones Moscú LLC',
      taxId: '30-90123456-0',
      country: 'Russia',
      industry: 'finance',
      status: BusinessStatus.IN_REVIEW,
      riskScore: 90,
    },
    {
      name: 'Casino El Dorado S.A.',
      taxId: '30-12345670-1',
      country: 'Argentina',
      industry: 'casino',
      status: BusinessStatus.IN_REVIEW,
      riskScore: 90,
    },
    {
      name: 'Constructora Habana',
      taxId: '30-22345671-2',
      country: 'Cuba',
      industry: 'construction',
      status: BusinessStatus.IN_REVIEW,
      riskScore: 100,
    },

    // Empresas RECHAZADAS
    {
      name: 'Operaciones Siria S.R.L.',
      taxId: '30-33456782-3',
      country: 'Syria',
      industry: 'import/export',
      status: BusinessStatus.REJECTED,
      riskScore: 100,
    },
    {
      name: 'Myanmar Trading Co.',
      taxId: '30-44567893-4',
      country: 'Myanmar',
      industry: 'gambling',
      status: BusinessStatus.REJECTED,
      riskScore: 100,
    },

    // Combinación de PENDING con documentos (menor riesgo)
    {
      name: 'Agropecuaria Los Alamos',
      taxId: '30-55678904-5',
      country: 'Argentina',
      industry: 'agriculture',
      status: BusinessStatus.PENDING,
      riskScore: 40,
    },
    {
      name: 'Editorial Rioplatense S.A.',
      taxId: '30-66789015-6',
      country: 'Argentina',
      industry: 'publishing',
      status: BusinessStatus.APPROVED,
      riskScore: 0,
    },
    {
      name: 'Servicios Financieros del Centro',
      taxId: '30-77890126-7',
      country: 'Argentina',
      industry: 'finance',
      status: BusinessStatus.IN_REVIEW,
      riskScore: 60,
    },
    {
      name: 'Importadora Chile Norte S.A.',
      taxId: '30-88901237-8',
      country: 'Chile',
      industry: 'import/export',
      status: BusinessStatus.APPROVED,
      riskScore: 20,
    },
    {
      name: 'Minera Andina Ltda.',
      taxId: '30-99012348-9',
      country: 'Chile',
      industry: 'mining',
      status: BusinessStatus.PENDING,
      riskScore: 40,
    },
    {
      name: 'Tech Startup Córdoba S.A.S.',
      taxId: '30-10112359-0',
      country: 'Argentina',
      industry: 'technology',
      status: BusinessStatus.APPROVED,
      riskScore: 0,
    },
  ];

  const businesses: Awaited<ReturnType<typeof prisma.business.create>>[] = [];

  for (const biz of businessesData) {
    const b = await prisma.business.create({
      data: {
        name: biz.name,
        taxId: biz.taxId,
        country: biz.country,
        industry: biz.industry,
        status: biz.status,
        riskScore: biz.riskScore,
        createdBy: admin.id,
      },
    });
    businesses.push(b);
  }

  console.log(`${businesses.length} empresas creadas`);

  // ─── Documentos ────────────────────────────────────────────────────────────
  console.log('Creando documentos...');

  // Las empresas APROBADAS reciben todos los documentos requeridos
  const approvedBusinesses = businesses.filter((b) => b.status === BusinessStatus.APPROVED);

  for (const biz of approvedBusinesses) {
    await prisma.document.createMany({
      data: [
        {
          businessId: biz.id,
          documentType: DocumentType.TAX_CERTIFICATE,
          fileName: 'tax_certificate.pdf',
          filePath: `uploads/${biz.id}_tax_certificate.pdf`,
          fileSize: 102400,
          mimeType: 'application/pdf',
        },
        {
          businessId: biz.id,
          documentType: DocumentType.REGISTRATION,
          fileName: 'registration.pdf',
          filePath: `uploads/${biz.id}_registration.pdf`,
          fileSize: 204800,
          mimeType: 'application/pdf',
        },
        {
          businessId: biz.id,
          documentType: DocumentType.INSURANCE_POLICY,
          fileName: 'insurance_policy.pdf',
          filePath: `uploads/${biz.id}_insurance.pdf`,
          fileSize: 153600,
          mimeType: 'application/pdf',
        },
      ],
    });
  }

  // Las empresas EN REVISIÓN reciben documentos parciales
  const inReviewBusinesses = businesses.filter((b) => b.status === BusinessStatus.IN_REVIEW);

  for (const biz of inReviewBusinesses.slice(0, 3)) {
    await prisma.document.createMany({
      data: [
        {
          businessId: biz.id,
          documentType: DocumentType.TAX_CERTIFICATE,
          fileName: 'tax_certificate.pdf',
          filePath: `uploads/${biz.id}_tax_certificate.pdf`,
          fileSize: 102400,
          mimeType: 'application/pdf',
        },
      ],
    });
  }

  // Algunas empresas PENDIENTES reciben documentos parciales
  const pendingBusinesses = businesses.filter((b) => b.status === BusinessStatus.PENDING);

  for (const biz of pendingBusinesses.slice(0, 2)) {
    await prisma.document.createMany({
      data: [
        {
          businessId: biz.id,
          documentType: DocumentType.TAX_CERTIFICATE,
          fileName: 'tax_certificate.pdf',
          filePath: `uploads/${biz.id}_tax_certificate.pdf`,
          fileSize: 102400,
          mimeType: 'application/pdf',
        },
        {
          businessId: biz.id,
          documentType: DocumentType.REGISTRATION,
          fileName: 'registration.pdf',
          filePath: `uploads/${biz.id}_registration.pdf`,
          fileSize: 204800,
          mimeType: 'application/pdf',
        },
      ],
    });
  }

  console.log('Documentos creados');

  // ─── Historial de estados ─────────────────────────────────────────────────
  console.log('Creando historial de estados...');

  for (const biz of businesses) {
    // Initial entry
    await prisma.statusHistory.create({
      data: {
        businessId: biz.id,
        previousStatus: null,
        newStatus: BusinessStatus.PENDING,
        changedBy: admin.id,
        comment: 'Empresa creada',
      },
    });

    // Agregar historial para empresas que no están en PENDING
    if (biz.status === BusinessStatus.IN_REVIEW) {
      await prisma.statusHistory.create({
        data: {
          businessId: biz.id,
          previousStatus: BusinessStatus.PENDING,
          newStatus: BusinessStatus.IN_REVIEW,
          changedBy: admin.id,
          comment: `Marcada automáticamente para revisión manual. Puntaje de riesgo: ${biz.riskScore}`,
        },
      });
    }

    if (biz.status === BusinessStatus.APPROVED) {
      await prisma.statusHistory.create({
        data: {
          businessId: biz.id,
          previousStatus: BusinessStatus.PENDING,
          newStatus: BusinessStatus.IN_REVIEW,
          changedBy: admin.id,
          comment: 'En revisión',
        },
      });
      await prisma.statusHistory.create({
        data: {
          businessId: biz.id,
          previousStatus: BusinessStatus.IN_REVIEW,
          newStatus: BusinessStatus.APPROVED,
          changedBy: admin.id,
          comment: 'Todos los documentos verificados. Empresa aprobada.',
        },
      });
    }

    if (biz.status === BusinessStatus.REJECTED) {
      await prisma.statusHistory.create({
        data: {
          businessId: biz.id,
          previousStatus: BusinessStatus.PENDING,
          newStatus: BusinessStatus.IN_REVIEW,
          changedBy: admin.id,
          comment: 'En revisión - alto riesgo detectado',
        },
      });
      await prisma.statusHistory.create({
        data: {
          businessId: biz.id,
          previousStatus: BusinessStatus.IN_REVIEW,
          newStatus: BusinessStatus.REJECTED,
          changedBy: admin.id,
          comment: 'Empresa rechazada por incumplimiento de sanciones internacionales.',
        },
      });
    }
  }

  console.log('Historial de estados creado');

  // ─── Facultades ────────────────────────────────────────────────────────────
  console.log('Creando facultades...');

  const facultiesData = [
    {
      code: 'CREATE_WIRE',
      name: 'Crear Transferencia Bancaria',
      description: 'Permiso para iniciar transferencias bancarias',
    },
    {
      code: 'APPROVE_WIRE',
      name: 'Aprobar Transferencia Bancaria',
      description: 'Permiso para aprobar transferencias bancarias',
    },
    {
      code: 'REQUEST_LOAN',
      name: 'Solicitar Préstamo',
      description: 'Permiso para solicitar préstamos',
    },
    {
      code: 'MODIFY_CONTACT_INFO',
      name: 'Modificar Información de Contacto',
      description: 'Permiso para actualizar los datos de contacto de la empresa',
    },
  ];

  const faculties: Awaited<ReturnType<typeof prisma.faculty.create>>[] = [];

  for (const f of facultiesData) {
    const faculty = await prisma.faculty.create({ data: f });
    faculties.push(faculty);
  }

  console.log(`${faculties.length} facultades creadas`);

  // ─── Cuentas, Grupos, Firmantes y Reglas ──────────────────────────────────
  console.log('Creando cuentas con grupos, firmantes y reglas...');

  // Cuenta 1: Techno Solutions
  const account1 = await prisma.account.create({ data: { name: 'Cuenta Principal Techno Solutions' } });

  const groupA = await prisma.group.create({ data: { accountId: account1.id, name: 'Directores' } });
  const groupB = await prisma.group.create({ data: { accountId: account1.id, name: 'Equipo de Finanzas' } });

  const signer1 = await prisma.signer.create({
    data: { accountId: account1.id, name: 'Carlos Rodríguez', email: 'carlos@techno.com' },
  });
  const signer2 = await prisma.signer.create({
    data: { accountId: account1.id, name: 'María González', email: 'maria@techno.com' },
  });
  const signer3 = await prisma.signer.create({
    data: { accountId: account1.id, name: 'Juan Pérez', email: 'juan@techno.com' },
  });

  // Asignar firmantes a grupos
  await prisma.signerGroup.createMany({
    data: [
      { signerId: signer1.id, groupId: groupA.id },
      { signerId: signer2.id, groupId: groupA.id },
      { signerId: signer3.id, groupId: groupB.id },
    ],
  });

  // Regla: CREATE_WIRE requiere 1 director Y 1 miembro de finanzas
  const createWireFaculty = faculties.find((f) => f.code === 'CREATE_WIRE')!;
  await prisma.rule.create({
    data: {
      accountId: account1.id,
      facultyId: createWireFaculty.id,
      ruleLogic: {
        combinations: [
          {
            groupRequirements: [
              { groupId: groupA.id, requiredCount: 1 },
              { groupId: groupB.id, requiredCount: 1 },
            ],
          },
        ],
      },
    },
  });

  // Regla: APPROVE_WIRE requiere 2 directores
  const approveWireFaculty = faculties.find((f) => f.code === 'APPROVE_WIRE')!;
  await prisma.rule.create({
    data: {
      accountId: account1.id,
      facultyId: approveWireFaculty.id,
      ruleLogic: {
        combinations: [
          {
            groupRequirements: [{ groupId: groupA.id, requiredCount: 2 }],
          },
        ],
      },
    },
  });

  // Cuenta 2: Alimentos del Sur
  const account2 = await prisma.account.create({ data: { name: 'Cuenta Alimentos del Sur' } });

  const groupC = await prisma.group.create({ data: { accountId: account2.id, name: 'Gerencia' } });
  const groupD = await prisma.group.create({ data: { accountId: account2.id, name: 'Operaciones' } });

  const signer4 = await prisma.signer.create({
    data: { accountId: account2.id, name: 'Ana López', email: 'ana@alimentos.com' },
  });
  const signer5 = await prisma.signer.create({
    data: { accountId: account2.id, name: 'Roberto Martínez', email: 'roberto@alimentos.com' },
  });

  await prisma.signerGroup.createMany({
    data: [
      { signerId: signer4.id, groupId: groupC.id },
      { signerId: signer5.id, groupId: groupD.id },
    ],
  });

  // Regla: REQUEST_LOAN requiere 1 miembro de gerencia
  const requestLoanFaculty = faculties.find((f) => f.code === 'REQUEST_LOAN')!;
  await prisma.rule.create({
    data: {
      accountId: account2.id,
      facultyId: requestLoanFaculty.id,
      ruleLogic: {
        combinations: [
          {
            groupRequirements: [{ groupId: groupC.id, requiredCount: 1 }],
          },
        ],
      },
    },
  });

  console.log('Cuentas, grupos, firmantes y reglas creados');
  console.log('¡Seed completado exitosamente!');
  console.log('\nCredenciales:');
  console.log('  ADMIN  - admin@complif.com / Admin123!');
  console.log('  VIEWER - viewer@complif.com / Viewer123!');
}

main()
  .catch((e) => {
    console.error('Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
