import { BusinessStatus, DocumentType, UserRole } from '@prisma/client';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockBusinessFindUnique = jest.fn();
const mockBusinessFindMany = jest.fn();
const mockBusinessCreate = jest.fn();
const mockBusinessUpdate = jest.fn();
const mockBusinessCount = jest.fn();
const mockStatusHistoryCreate = jest.fn();
const mockDocumentFindMany = jest.fn();

jest.mock('../src/config/database', () => ({
  __esModule: true,
  default: {
    business: {
      findUnique: (...args: unknown[]) => mockBusinessFindUnique(...args),
      findMany: (...args: unknown[]) => mockBusinessFindMany(...args),
      create: (...args: unknown[]) => mockBusinessCreate(...args),
      update: (...args: unknown[]) => mockBusinessUpdate(...args),
      count: (...args: unknown[]) => mockBusinessCount(...args),
    },
    statusHistory: {
      create: (...args: unknown[]) => mockStatusHistoryCreate(...args),
    },
    document: {
      findMany: (...args: unknown[]) => mockDocumentFindMany(...args),
    },
  },
}));

jest.mock('../src/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import * as businessService from '../src/services/business.service';

const USER_ID = 'user-uuid-1';

const BASE_BUSINESS = {
  id: 'biz-uuid-1',
  name: 'Test Business S.A.',
  taxId: '30-12345678-9',
  country: 'Argentina',
  industry: 'technology',
  status: BusinessStatus.PENDING,
  riskScore: 60,
  createdBy: USER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  documents: [],
  statusHistory: [],
  creator: { id: USER_ID, email: 'admin@complif.com', firstName: 'Admin', lastName: 'Complif' },
};

describe('businessService.createBusiness', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calcula el puntaje de riesgo al crear (sin documentos = 60)', async () => {
    // Sin duplicado
    mockBusinessFindUnique.mockResolvedValueOnce(null);
    // Crear
    mockBusinessCreate.mockResolvedValue(BASE_BUSINESS);
    // Actualizar con puntaje de riesgo
    mockBusinessUpdate.mockResolvedValue({ ...BASE_BUSINESS, riskScore: 60 });
    // Historial de estados
    mockStatusHistoryCreate.mockResolvedValue({});
    // findUnique final
    mockBusinessFindUnique.mockResolvedValue({ ...BASE_BUSINESS, riskScore: 60 });

    const result = await businessService.createBusiness(
      { name: 'Test Business S.A.', taxId: '30-12345678-9', country: 'Argentina', industry: 'technology' },
      USER_ID
    );

    // Debería haber llamado update con riskScore = 60 (3 docs faltantes × 20)
    const updateCall = mockBusinessUpdate.mock.calls[0][0];
    expect(updateCall.data.riskScore).toBe(60);
    expect(updateCall.data.status).toBe(BusinessStatus.PENDING);
  });

  it('establece estado IN_REVIEW automáticamente cuando riskScore > 70', async () => {
    // Sin duplicado
    mockBusinessFindUnique.mockResolvedValueOnce(null);
    // Rusia + casino + sin docs = 30 + 30 + 60 = 120, tope en 100
    const highRiskBiz = { ...BASE_BUSINESS, country: 'Russia', industry: 'casino', status: BusinessStatus.IN_REVIEW };
    mockBusinessCreate.mockResolvedValue(highRiskBiz);
    mockBusinessUpdate.mockResolvedValue({ ...highRiskBiz, riskScore: 100, status: BusinessStatus.IN_REVIEW });
    mockStatusHistoryCreate.mockResolvedValue({});
    mockBusinessFindUnique.mockResolvedValue({ ...highRiskBiz, riskScore: 100 });

    await businessService.createBusiness(
      { name: 'High Risk Corp', taxId: '30-99999999-9', country: 'Russia', industry: 'casino' },
      USER_ID
    );

    const updateCall = mockBusinessUpdate.mock.calls[0][0];
    expect(updateCall.data.riskScore).toBe(100);
    expect(updateCall.data.status).toBe(BusinessStatus.IN_REVIEW);
  });

  it('lanza 409 si el taxId ya existe', async () => {
    mockBusinessFindUnique.mockResolvedValue(BASE_BUSINESS); // duplicado encontrado

    await expect(
      businessService.createBusiness(
        { name: 'Duplicate', taxId: '30-12345678-9', country: 'Argentina', industry: 'tech' },
        USER_ID
      )
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(mockBusinessCreate).not.toHaveBeenCalled();
  });

  it('crea la entrada inicial en el historial de estados', async () => {
    mockBusinessFindUnique.mockResolvedValueOnce(null);
    mockBusinessCreate.mockResolvedValue(BASE_BUSINESS);
    mockBusinessUpdate.mockResolvedValue(BASE_BUSINESS);
    mockStatusHistoryCreate.mockResolvedValue({});
    mockBusinessFindUnique.mockResolvedValue(BASE_BUSINESS);

    await businessService.createBusiness(
      { name: 'New Biz', taxId: '30-11111111-1', country: 'Argentina', industry: 'tech' },
      USER_ID
    );

    expect(mockStatusHistoryCreate).toHaveBeenCalledTimes(1);
    const historyCall = mockStatusHistoryCreate.mock.calls[0][0];
    expect(historyCall.data.previousStatus).toBeNull();
    expect(historyCall.data.changedBy).toBe(USER_ID);
  });
});

describe('businessService.listBusinesses', () => {
  beforeEach(() => jest.clearAllMocks());

  const MOCK_BUSINESSES = [BASE_BUSINESS, { ...BASE_BUSINESS, id: 'biz-uuid-2', name: 'Another Corp' }];

  it('retorna lista paginada con valores por defecto', async () => {
    mockBusinessFindMany.mockResolvedValue(MOCK_BUSINESSES);
    mockBusinessCount.mockResolvedValue(2);

    const result = await businessService.listBusinesses({});

    expect(result.businesses).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('filtra por estado cuando se proporciona', async () => {
    mockBusinessFindMany.mockResolvedValue([BASE_BUSINESS]);
    mockBusinessCount.mockResolvedValue(1);

    await businessService.listBusinesses({ status: BusinessStatus.PENDING });

    const findManyCall = mockBusinessFindMany.mock.calls[0][0];
    expect(findManyCall.where.status).toBe(BusinessStatus.PENDING);
  });

  it('filtra por país cuando se proporciona', async () => {
    mockBusinessFindMany.mockResolvedValue([BASE_BUSINESS]);
    mockBusinessCount.mockResolvedValue(1);

    await businessService.listBusinesses({ country: 'Argentina' });

    const findManyCall = mockBusinessFindMany.mock.calls[0][0];
    expect(findManyCall.where.country).toMatchObject({ equals: 'Argentina', mode: 'insensitive' });
  });

  it('filtra por término de búsqueda (nombre LIKE)', async () => {
    mockBusinessFindMany.mockResolvedValue([BASE_BUSINESS]);
    mockBusinessCount.mockResolvedValue(1);

    await businessService.listBusinesses({ search: 'Test' });

    const findManyCall = mockBusinessFindMany.mock.calls[0][0];
    expect(findManyCall.where.name).toMatchObject({ contains: 'Test', mode: 'insensitive' });
  });

  it('caps limit at 100', async () => {
    mockBusinessFindMany.mockResolvedValue([]);
    mockBusinessCount.mockResolvedValue(0);

    await businessService.listBusinesses({ limit: 9999 });

    const findManyCall = mockBusinessFindMany.mock.calls[0][0];
    expect(findManyCall.take).toBe(100);
  });

  it('calculates correct pagination', async () => {
    mockBusinessFindMany.mockResolvedValue([BASE_BUSINESS]);
    mockBusinessCount.mockResolvedValue(25);

    const result = await businessService.listBusinesses({ page: 2, limit: 10 });

    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(3);

    const findManyCall = mockBusinessFindMany.mock.calls[0][0];
    expect(findManyCall.skip).toBe(10);
    expect(findManyCall.take).toBe(10);
  });
});

describe('businessService.updateBusinessStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a status history entry when status is updated', async () => {
    mockBusinessFindUnique.mockResolvedValue(BASE_BUSINESS);
    mockStatusHistoryCreate.mockResolvedValue({});
    mockBusinessUpdate.mockResolvedValue({ ...BASE_BUSINESS, status: BusinessStatus.APPROVED });

    await businessService.updateBusinessStatus(
      'biz-uuid-1',
      BusinessStatus.APPROVED,
      USER_ID,
      'Approved after review'
    );

    expect(mockStatusHistoryCreate).toHaveBeenCalledTimes(1);
    const historyCall = mockStatusHistoryCreate.mock.calls[0][0];
    expect(historyCall.data.previousStatus).toBe(BusinessStatus.PENDING);
    expect(historyCall.data.newStatus).toBe(BusinessStatus.APPROVED);
    expect(historyCall.data.changedBy).toBe(USER_ID);
    expect(historyCall.data.comment).toBe('Approved after review');
  });

  it('throws 404 if business does not exist', async () => {
    mockBusinessFindUnique.mockResolvedValue(null);

    await expect(
      businessService.updateBusinessStatus('nonexistent', BusinessStatus.APPROVED, USER_ID)
    ).rejects.toMatchObject({ statusCode: 404, message: 'Business not found' });

    expect(mockStatusHistoryCreate).not.toHaveBeenCalled();
    expect(mockBusinessUpdate).not.toHaveBeenCalled();
  });

  it('records null comment when none provided', async () => {
    mockBusinessFindUnique.mockResolvedValue(BASE_BUSINESS);
    mockStatusHistoryCreate.mockResolvedValue({});
    mockBusinessUpdate.mockResolvedValue({ ...BASE_BUSINESS, status: BusinessStatus.IN_REVIEW });

    await businessService.updateBusinessStatus('biz-uuid-1', BusinessStatus.IN_REVIEW, USER_ID);

    const historyCall = mockStatusHistoryCreate.mock.calls[0][0];
    expect(historyCall.data.comment).toBeNull();
  });

  it('updates business status in the database', async () => {
    mockBusinessFindUnique.mockResolvedValue(BASE_BUSINESS);
    mockStatusHistoryCreate.mockResolvedValue({});
    mockBusinessUpdate.mockResolvedValue({ ...BASE_BUSINESS, status: BusinessStatus.REJECTED });

    await businessService.updateBusinessStatus('biz-uuid-1', BusinessStatus.REJECTED, USER_ID, 'Rejected');

    const updateCall = mockBusinessUpdate.mock.calls[0][0];
    expect(updateCall.data.status).toBe(BusinessStatus.REJECTED);
  });
});

describe('businessService.getBusinessById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns business when found', async () => {
    mockBusinessFindUnique.mockResolvedValue(BASE_BUSINESS);

    const result = await businessService.getBusinessById('biz-uuid-1');

    expect(result.id).toBe('biz-uuid-1');
    expect(result.name).toBe('Test Business S.A.');
  });

  it('throws 404 when business not found', async () => {
    mockBusinessFindUnique.mockResolvedValue(null);

    await expect(businessService.getBusinessById('nonexistent')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Business not found',
    });
  });
});
