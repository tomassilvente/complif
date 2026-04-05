# AGENTS.md — Guía de Navegación del Código de Complif

Este archivo está destinado a agentes IA (y humanos) que navegan el código de Complif. Describe dónde vive cada cosa, cómo se conectan y cómo realizar cambios de forma segura.

---

## Descripción General de la Arquitectura

Complif es una aplicación multi-servicio compuesta por:

| Servicio             | Lenguaje / Framework     | Puerto | Rol                                          |
|----------------------|--------------------------|--------|----------------------------------------------|
| `backend`            | Node.js / Express + TS   | 3001   | API REST, WebSocket, lógica de negocio       |
| `frontend`           | Next.js 14 + TypeScript  | 3000   | Interfaz del dashboard                       |
| `validation-service` | Node.js / Express + TS   | 3002   | Microservicio de validación de CUIT          |
| `postgres`           | PostgreSQL 15            | 5432   | Base de datos relacional principal           |

Todos los servicios están definidos en `docker-compose.yml` en la raíz del proyecto y se comunican a través de la red Docker bridge `complif-network`.

---

## Archivos Clave y su Propósito

### Raíz del Proyecto

| Archivo / Dir                       | Propósito                                                  |
|-------------------------------------|------------------------------------------------------------|
| `docker-compose.yml`                | Definiciones de servicios, volúmenes, redes               |
| `README.md`                         | Descripción del proyecto y guía de inicio rápido          |
| `AGENTS.md`                         | Este archivo                                              |
| `QUESTIONS.md`                      | Decisiones de diseño y supuestos                          |
| `complif.postman_collection.json`   | Colección Postman para testing manual de la API           |

### Backend (`backend/`)

| Archivo / Dir                       | Propósito                                                         |
|-------------------------------------|-------------------------------------------------------------------|
| `src/index.ts`                      | Punto de entrada: app Express, middleware, montaje de rutas       |
| `src/routes/`                       | Definiciones de rutas — un archivo por recurso                    |
| `src/controllers/`                  | Manejadores HTTP — parsean el request, llaman al service, responden|
| `src/services/`                     | Lógica de negocio — llamadas a la BD, cálculos                   |
| `src/middleware/auth.ts`            | Verificación JWT (`authenticate`) + RBAC (`authorize`)            |
| `src/middleware/errorHandler.ts`    | Formateador centralizado de errores                               |
| `src/utils/logger.ts`               | Instancia del logger Winston                                      |
| `src/types/`                        | Interfaces y enums TypeScript compartidos                         |
| `src/modules/`                      | Módulos de funcionalidades autocontenidos (módulo de firma)       |
| `prisma/schema.prisma`              | Fuente única de verdad para el schema de la base de datos         |
| `prisma/seed.ts`                    | Seed de usuarios por defecto y datos de ejemplo                   |
| `prisma/migrations/`                | Historial de migraciones SQL autogeneradas                        |
| `.env.example`                      | Documenta todas las variables de entorno requeridas               |
| `tests/`                            | Tests de integración con Jest + Supertest                         |

### Servicio de Validación (`validation-service/`)

| Archivo               | Propósito                                                         |
|-----------------------|-------------------------------------------------------------------|
| `src/index.ts`        | App Express completa — validación de CUIT, RFC y genérica        |

### Frontend (`frontend/`)

| Dir / Archivo         | Propósito                                                         |
|-----------------------|-------------------------------------------------------------------|
| `src/app/`            | Páginas del App Router de Next.js (ruteo basado en archivos)      |
| `src/components/`     | Componentes React reutilizables                                   |
| `src/lib/`            | Cliente API (Axios), helpers de auth, funciones utilitarias       |
| `src/types/`          | Tipos TypeScript compartidos entre componentes                    |

---

## Dónde Encontrar la Lógica de Negocio

Toda la lógica de negocio vive en `backend/src/services/`. Los services:

- Son módulos TypeScript simples (sin dependencias de Express).
- Reciben datos simples, ejecutan lógica, llaman a Prisma y retornan resultados.
- Son llamados por los controllers — nunca directamente desde las rutas.

Archivos de service clave:

| Archivo                                | Responsabilidad                                            |
|----------------------------------------|------------------------------------------------------------|
| `services/auth.service.ts`             | Hash de contraseñas, generación y verificación de JWT      |
| `services/risk.service.ts`             | Cálculo del puntaje de riesgo y desglose                   |
| `services/notification.service.ts`     | Emisión de eventos Socket.IO                               |

Para agregar nueva lógica de negocio: crear o extender un archivo en `services/`, luego llamarlo desde el controller correspondiente.

---

## Dónde Encontrar las Definiciones de Rutas

Las rutas viven en `backend/src/routes/`, un archivo por recurso:

| Archivo                     | Montado en            |
|-----------------------------|-----------------------|
| `routes/auth.routes.ts`     | `/api/auth`           |
| `routes/business.routes.ts` | `/api/businesses`     |
| `routes/document.routes.ts` | `/api/documents`      |
| `routes/user.routes.ts`     | `/api/users`          |
| `routes/signature.routes.ts`| `/api/signature`      |

Todas las rutas se montan en `src/index.ts` mediante `app.use(...)`.

Los archivos de rutas aplican middleware (ej: `authenticate`, `authorize('ADMIN')`) antes de delegar a una función del controller.

---

## Schema de la Base de Datos

**Fuente única de verdad**: `backend/prisma/schema.prisma`

El schema define dos módulos lógicos:

1. **Módulo de firma**: `Account`, `SignatureSchema`, `Faculty`, `Group`, `Rule`, `SignatureRequest`, `Combination`, `Signer`, `SignerGroup`, `Signature`.
2. **Módulo de onboarding**: `User`, `Business`, `Document`, `StatusHistory`.

### Ejecutar Migraciones

```bash
# Aplicar todas las migraciones pendientes (crea las tablas)
docker compose exec backend npm run prisma:migrate

# Generar el cliente Prisma tras cambios en el schema
docker compose exec backend npm run prisma:generate

# Abrir el explorador visual de la base de datos
docker compose exec backend npm run prisma:studio

# Cargar datos por defecto
docker compose exec backend npm run prisma:seed
```

Después de modificar `schema.prisma`, siempre ejecutar `prisma:migrate` para crear el archivo de migración y `prisma:generate` para regenerar el cliente.

---

## Variables de Entorno

El entorno del backend se configura en `backend/.env` (copiar desde `backend/.env.example`).

Variables clave que un agente puede necesitar:

| Variable                 | Usada por                                             |
|--------------------------|-------------------------------------------------------|
| `DATABASE_URL`           | Prisma — string de conexión a PostgreSQL              |
| `JWT_SECRET`             | auth.service.ts — firmar/verificar JWTs               |
| `JWT_EXPIRATION`         | auth.service.ts — tiempo de vida del token de acceso  |
| `VALIDATION_SERVICE_URL` | controller de business — llamadas de validación externa|
| `UPLOAD_DIR`             | controller de document — dónde se almacenan los archivos|
| `CORS_ORIGIN`            | index.ts — origen del frontend permitido              |

En Docker Compose, estas se setean directamente en el bloque `environment:` del servicio `backend` y sobreescriben el archivo `.env`.

---

## Cómo Funciona la Autenticación

1. **Login**: `POST /api/auth/login` llama a `auth.service.ts` que verifica la contraseña con `bcrypt.compare`, luego firma un JWT con `jsonwebtoken`.
2. **Rutas protegidas**: El middleware `authenticate` en `middleware/auth.ts` extrae el header `Authorization: Bearer <token>`, verifica el JWT con `JWT_SECRET` y adjunta el usuario decodificado en `req.user`.
3. **Control de acceso por rol**: El middleware `authorize('ADMIN')` verifica `req.user.role`. Los Viewers pueden leer; solo los Admins pueden escribir.
4. **Almacenamiento del token**: El frontend guarda el JWT en `localStorage` (trade-off: implementación simple vs. riesgo XSS; ver QUESTIONS.md).
5. **Expiración**: Los tokens de acceso expiran en 15 minutos (`JWT_EXPIRATION`). La lógica de refresco usa `JWT_REFRESH_EXPIRATION` (7 días).

---

## Cómo se Calcula el Puntaje de Riesgo

Implementación: `backend/src/services/risk.service.ts`

```
score = 0

verificación de PAISES_ALTO_RIESGO   -> +30 si coincide
verificación de IND_ALTO_RIESGO      -> +30 si coincide
Documentos requeridos faltantes       -> +20 por doc faltante (máx 3 docs = +60)

tope en 100
```

Documentos requeridos: `TAX_CERTIFICATE`, `REGISTRATION`, `INSURANCE_POLICY`.

La función `calculateRiskScore(business, documents)` se llama:
- Al crear la empresa (sin documentos aún, arranca en 60 por docs faltantes).
- Después de cada subida de documento (se recalcula y persiste).

Si `riskScore > 70` al crear, el estado de la empresa se establece automáticamente en `IN_REVIEW`.

La función `getRiskBreakdown(business, documents)` retorna un objeto detallado usado por el endpoint `/risk-score`.

---

## Dónde Agregar Nuevas Funcionalidades

### Agregar un nuevo endpoint de API

1. Agregar el handler de ruta en `backend/src/routes/<recurso>.routes.ts`
2. Agregar la función del controller en `backend/src/controllers/<recurso>.controller.ts`
3. Agregar la lógica de negocio en `backend/src/services/<recurso>.service.ts`
4. Si se necesitan nuevas tablas en la BD, modificar `prisma/schema.prisma` y ejecutar `prisma:migrate`
5. Montar la ruta en `backend/src/index.ts` si es un nuevo recurso

### Agregar un nuevo tipo de documento

1. Agregar el nuevo valor al enum `DocumentType` en `prisma/schema.prisma`
2. Ejecutar `npm run prisma:migrate`
3. Si debe ser un documento "requerido" que afecte el puntaje de riesgo, agregarlo a `REQUIRED_DOCUMENT_TYPES` en `risk.service.ts`

### Agregar un nuevo país o industria a las listas de alto riesgo

Editar los arrays `HIGH_RISK_COUNTRIES` o `HIGH_RISK_INDUSTRIES` en `backend/src/services/risk.service.ts`.

### Agregar un nuevo formato de identificación fiscal

Agregar una nueva función de validación y una rama en `validation-service/src/index.ts` dentro de la función `runValidation`.

---

## Patrones Comunes

### Controller -> Service -> Prisma

El patrón estándar para todos los módulos de funcionalidades:

```
Ruta (routes/*.ts)
  -> Middleware (authenticate, authorize, multer)
  -> Controller (controllers/*.ts)     // parsea el req, llama al service, envía res
  -> Service (services/*.ts)           // lógica de negocio, llamadas a Prisma
  -> Cliente Prisma                    // base de datos
```

Los Controllers NO deben contener lógica de negocio. Los Services NO deben importar tipos de `express`.

### Manejo de errores

Lanzar errores con una propiedad de código de estado; `errorHandler.ts` los capturará:

```typescript
const error = new Error('No encontrado') as any;
error.statusCode = 404;
throw error;
```

### Validación con Zod

Usar schemas de `zod` para validar los bodies de los requests entrantes en los controllers:

```typescript
const schema = z.object({ name: z.string().min(1) });
const parsed = schema.safeParse(req.body);
if (!parsed.success) {
  res.status(400).json({ error: parsed.error.errors });
  return;
}
```

---

## Cómo Ejecutar el Proyecto

```bash
# Levantar todo
docker compose up -d

# Ejecutar migraciones de base de datos
docker compose exec backend npm run prisma:migrate

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f validation-service

# Reiniciar un servicio después de un cambio de código
docker compose restart backend

# Detener todo
docker compose down
```

El backend y el validation-service usan `tsx watch` en modo desarrollo — se recargan automáticamente al guardar archivos sin necesidad de reiniciar.

---

## Cómo Están Estructurados los Tests

Ubicación de los tests: `backend/tests/`

Framework: **Jest** + **Supertest** + **ts-jest**

Convención de nombres: `<funcionalidad>.test.ts`

Patrón:
```typescript
import request from 'supertest';
import app from '../src/index';   // importar la app Express

describe('POST /api/auth/login', () => {
  it('retorna 200 y un token para credenciales válidas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@complif.com', password: 'Admin123!' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });
});
```

Ejecutar tests:
```bash
docker compose exec backend npm test
docker compose exec backend npm run test:coverage
```
