# Complif — Plataforma KYB de Onboarding

## 1. Descripción del Proyecto

Complif es una plataforma de cumplimiento **B2B2B Know Your Business (KYB)**. Permite a las empresas (clientes) incorporar a sus propios socios comerciales y proveedores a través de un flujo de trabajo de cumplimiento estructurado.

La plataforma ofrece:
- **Onboarding de empresas**: Recolección y almacenamiento de información sobre terceros (CUIT, país, industria).
- **Gestión de documentos**: Solicitud y almacenamiento de documentos de cumplimiento (certificados fiscales, actas, pólizas, etc.).
- **Puntaje de riesgo**: Cálculo automático de un score en base a país, industria y completitud documental.
- **Flujo de estados**: Seguimiento del progreso a través de los estados PENDING -> IN_REVIEW -> APPROVED / REJECTED.
- **Firma electrónica**: Gestión de reglas de firma, grupos y solicitudes de firma para aprobación formal de documentos.
- **Notificaciones en tiempo real**: Actualizaciones vía WebSocket enviadas a los clientes conectados.

---

## 2. Diagrama de Arquitectura

```
+------------------------------------------------------------------+
|                         Red Docker                               |
|                                                                  |
|  +--------------+   REST/HTTP    +--------------------------+    |
|  |              | ------------> |                          |    |
|  |   Frontend   |               |        Backend           |    |
|  |  (Next.js)   | <-- WebSocket |   (Express + Socket.IO)  |    |
|  |  :3000       |               |         :3001            |    |
|  +--------------+               +-------------+------------+    |
|                                               |                  |
|                               +---------------+---------------+  |
|                               |               |               |  |
|                   +-----------v------+  +------v-----------+  |  |
|                   |                  |  |                   |  |  |
|                   |  PostgreSQL 15   |  | Servicio Valid.   |  |  |
|                   |     :5432        |  | (Express) :3002   |  |  |
|                   +------------------+  +-------------------+  |  |
+------------------------------------------------------------------+
```

**Flujos de datos:**
- Frontend <-> Backend: Llamadas REST API autenticadas con tokens JWT Bearer.
- Frontend <-> Backend: WebSocket (Socket.IO) para actualizaciones de estado y notificaciones en tiempo real.
- Backend <-> PostgreSQL: Prisma ORM para toda la persistencia de datos.
- Backend <-> Servicio de Validación: Llamadas HTTP internas para validar CUITs antes de guardar una empresa.

---

## 3. Stack Tecnológico

| Capa                    | Tecnología                                       |
|-------------------------|--------------------------------------------------|
| Frontend                | Next.js 14, React 18, TypeScript, Tailwind CSS   |
| Backend                 | Node.js 20, Express 4, TypeScript                |
| ORM                     | Prisma 5                                         |
| Base de datos           | PostgreSQL 15                                    |
| Tiempo real             | Socket.IO 4                                      |
| Autenticación           | JWT (jsonwebtoken), bcryptjs                     |
| Validación              | Zod                                              |
| Servicio de validación  | Express, TypeScript (microservicio independiente)|
| Subida de archivos      | Multer (almacenamiento local en disco)           |
| Contenedores            | Docker, Docker Compose                           |
| Infraestructura         | Terraform (AWS ECS Fargate, RDS, S3)             |
| Logging                 | Winston                                          |

---

## 4. Inicio Rápido

### Requisitos previos

- [Docker](https://www.docker.com/) y Docker Compose v2
- [Node.js 20+](https://nodejs.org/) (solo necesario si se ejecuta fuera de Docker)
- Git

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/your-org/complif.git
cd complif

# 2. Copiar y configurar el archivo de variables de entorno del backend
cp backend/.env.example backend/.env

# Editar backend/.env si es necesario (los valores por defecto funcionan con Docker Compose)

# 3. Levantar todos los servicios
docker compose up -d

# 4. Ejecutar migraciones de base de datos (esperar ~10 segundos a que postgres esté listo)
docker compose exec backend npm run prisma:migrate

# 5. (Opcional) Cargar usuarios por defecto y datos de ejemplo
docker compose exec backend npm run prisma:seed
```

Esperar a que pasen los health checks (monitorear con `docker compose ps`), luego acceder a:

| Servicio                | URL                          |
|-------------------------|------------------------------|
| Frontend                | http://localhost:3000        |
| Backend API             | http://localhost:3001        |
| Servicio de validación  | http://localhost:3002        |
| Health del backend      | http://localhost:3001/health |
| Health de validación    | http://localhost:3002/health |

---

## 5. Credenciales por Defecto

| Rol      | Email                  | Contraseña  |
|----------|------------------------|-------------|
| Admin    | admin@complif.com      | Admin123!   |
| Viewer   | viewer@complif.com     | Viewer123!  |

**Admin** puede crear empresas, subir documentos, cambiar estados y gestionar usuarios.
**Viewer** tiene acceso de solo lectura a empresas y documentos.

---

## 6. Documentación de la API

Todos los endpoints tienen el prefijo `http://localhost:3001`.

### Autenticación

| Método | Ruta                  | Auth      | Descripción                                        |
|--------|-----------------------|-----------|----------------------------------------------------|
| POST   | /api/auth/login       | Ninguna   | Login con email + contraseña; retorna JWT          |
| POST   | /api/auth/register    | ADMIN     | Crear un nuevo usuario (solo admin)                |
| GET    | /api/auth/me          | Bearer    | Obtener el usuario autenticado actual              |
| POST   | /api/auth/logout      | Bearer    | Invalidar la sesión actual                         |

### Empresas

| Método | Ruta                           | Auth   | Descripción                                            |
|--------|--------------------------------|--------|--------------------------------------------------------|
| POST   | /api/businesses                | Bearer | Crear una empresa (valida CUIT primero)                |
| GET    | /api/businesses                | Bearer | Listar empresas (filtrar por estado, país)             |
| GET    | /api/businesses/:id            | Bearer | Obtener una empresa con sus documentos                 |
| PATCH  | /api/businesses/:id/status     | ADMIN  | Actualizar estado de empresa (con comentario opcional) |
| GET    | /api/businesses/:id/risk-score | Bearer | Obtener el desglose detallado del puntaje de riesgo    |

### Documentos

| Método | Ruta                              | Auth   | Descripción                                      |
|--------|-----------------------------------|--------|--------------------------------------------------|
| POST   | /api/documents/upload/:businessId | ADMIN  | Subir un documento (multipart/form-data)         |
| GET    | /api/documents/:businessId        | Bearer | Listar todos los documentos de una empresa       |

### Usuarios

| Método | Ruta           | Auth  | Descripción            |
|--------|----------------|-------|------------------------|
| GET    | /api/users     | ADMIN | Listar todos los usuarios |
| GET    | /api/users/:id | ADMIN | Obtener usuario por ID |

### Firma Electrónica

| Método | Ruta                              | Auth   | Descripción                          |
|--------|-----------------------------------|--------|--------------------------------------|
| POST   | /api/signature/accounts           | Bearer | Crear una cuenta de firma            |
| POST   | /api/signature/faculties          | Bearer | Crear una facultad (permiso)         |
| POST   | /api/signature/groups             | Bearer | Crear un grupo de firmantes          |
| POST   | /api/signature/rules              | Bearer | Definir una regla de firma           |
| POST   | /api/signature/requests           | Bearer | Crear una solicitud de firma         |
| POST   | /api/signature/requests/:id/sign  | Bearer | Firmar una solicitud pendiente       |

### Servicio de Validación (puerto 3002)

| Método | Ruta      | Auth    | Descripción                                            |
|--------|-----------|---------|--------------------------------------------------------|
| GET    | /health   | Ninguna | Health check                                           |
| POST   | /validate | Ninguna | Validar CUIT body: `{ taxId, country }`               |
| GET    | /validate | Ninguna | Validar via query params `?taxId=...&country=...`      |

---

## 7. Variables de Entorno

Todas las variables se encuentran en `backend/.env` (copiar desde `backend/.env.example`).

| Variable                 | Por defecto                                               | Descripción                                              |
|--------------------------|-----------------------------------------------------------|----------------------------------------------------------|
| `DATABASE_URL`           | postgresql://complif:complif123@localhost:5432/complif_db | String de conexión a PostgreSQL                          |
| `JWT_SECRET`             | your-super-secret-jwt-key-change-in-production            | Secreto para firmar los tokens JWT                       |
| `JWT_EXPIRATION`         | 15m                                                       | Tiempo de vida del token de acceso                       |
| `JWT_REFRESH_EXPIRATION` | 7d                                                        | Tiempo de vida del token de refresco                     |
| `PORT`                   | 3001                                                      | Puerto del servidor backend                              |
| `NODE_ENV`               | development                                               | Entorno de Node                                          |
| `UPLOAD_DIR`             | ./uploads                                                 | Directorio donde se almacenan los archivos subidos       |
| `MAX_FILE_SIZE`          | 10485760                                                  | Tamaño máximo de subida en bytes (10 MB)                 |
| `VALIDATION_SERVICE_URL` | http://localhost:3002                                     | URL interna del microservicio de validación de CUIT      |
| `CORS_ORIGIN`            | http://localhost:3000                                     | Origen CORS permitido para el frontend                   |

Variables de entorno del frontend:

| Variable              | Por defecto           | Descripción                        |
|-----------------------|-----------------------|------------------------------------|
| `NEXT_PUBLIC_API_URL` | http://localhost:3001 | URL base de la API del backend     |
| `NEXT_PUBLIC_WS_URL`  | http://localhost:3001 | URL de WebSocket para Socket.IO    |

---

## 8. Diagrama del Modelo de Datos

```
+-------------------+       +------------------------+
|      Usuario      |       |        Empresa         |
|-------------------|       |------------------------|
| id (PK, uuid)     | 1   * | id (PK, uuid)          |
| email (único)     +-------+ nombre                 |
| passwordHash      |       | taxId (único)          |
| rol (ADMIN|VIEW)  |       | país                   |
| nombre            |       | industria              |
| apellido          |       | estado (enum)          |
| creadoEn          |       | puntajeRiesgo (int)    |
| actualizadoEn     |       | creadoPor (FK -> User) |
+-------------------+       | creadoEn               |
                            | actualizadoEn          |
                            +-----------+------------+
                                        | 1
                        +---------------+---------------+
                        |               |               |
                        | *             | *             |
             +----------v----+  +-------v--------------+
             |   Documento   |  |  HistorialEstados    |
             |---------------|  |----------------------|
             | id (PK)       |  | id (PK)              |
             | empresaId(FK) |  | empresaId (FK)       |
             | tipoDoc       |  | estadoAnterior       |
             | nombreArchivo |  | nuevoEstado          |
             | rutaArchivo   |  | cambiadoPor (FK)     |
             | tamañoArchivo |  | comentario           |
             | mimeType      |  | cambiadoEn           |
             | subidoEn      |  +----------------------+
             +---------------+

TipoDocumento: TAX_CERTIFICATE | REGISTRATION | INSURANCE_POLICY |
               INCORPORATION_DEED | POWER_OF_ATTORNEY | OTHER

EstadoEmpresa: PENDING | IN_REVIEW | APPROVED | REJECTED
```

Tablas del módulo de firma: `accounts`, `faculties`, `groups`, `rules`,
`signature_requests`, `combinations`, `signers`, `signer_groups`, `signatures`.

---

## 9. Algoritmo de Puntaje de Riesgo

El puntaje de riesgo es un entero de **0 a 100** y se calcula al crear la empresa y se recalcula al subir documentos.

```
score = 0

si empresa.país está en PAISES_ALTO_RIESGO:    score += 30
si empresa.industria está en IND_ALTO_RIESGO:  score += 30

docs_requeridos_faltantes = docs_requeridos no subidos aún
score += docs_requeridos_faltantes.length x 20

score_final = min(score, 100)
```

**Documentos requeridos** (cada uno faltante suma 20 puntos):
1. `TAX_CERTIFICATE`
2. `REGISTRATION`
3. `INSURANCE_POLICY`

**Trigger**: Si el puntaje calculado supera **70**, el estado de la empresa se establece automáticamente en `IN_REVIEW` al crearla.

**Países de alto riesgo**: Irán, Corea del Norte, Siria, Cuba, Sudán, Myanmar, Venezuela, Rusia, Bielorrusia, Libia, Somalia, Yemen.

**Industrias de alto riesgo** (sin distinción de mayúsculas): construction, security, exchange, casino, gambling, casas de cambio, construccion, seguridad.

---

## 10. Ejecutar Tests

```bash
# Ejecutar todos los tests del backend
docker compose exec backend npm test

# Ejecutar con reporte de cobertura
docker compose exec backend npm run test:coverage

# Ejecutar en modo watch (desarrollo)
docker compose exec backend npm run test:watch
```

Los tests se encuentran en `backend/tests/` y usan Jest + Supertest para testing de integración HTTP.

---

## 11. Estructura del Proyecto

```
complif/
+-- docker-compose.yml               # Orquesta todos los servicios
+-- README.md                        # Este archivo
+-- AGENTS.md                        # Guía de navegación del código para agentes IA
+-- QUESTIONS.md                     # Decisiones de diseño y supuestos
+-- complif.postman_collection.json  # Colección Postman para testing manual de la API
|
+-- backend/                         # Servidor API Express.js
|   +-- Dockerfile
|   +-- package.json
|   +-- tsconfig.json
|   +-- .env.example
|   +-- prisma/
|   |   +-- schema.prisma            # Schema de la base de datos y modelos
|   |   +-- migrations/              # Historial de migraciones de Prisma
|   |   +-- seed.ts                  # Script de seed (usuarios por defecto, datos de ejemplo)
|   +-- src/
|   |   +-- index.ts                 # Punto de entrada, configuración de middleware
|   |   +-- routes/                  # Definiciones de rutas
|   |   +-- controllers/             # Manejadores de requests/responses
|   |   +-- services/                # Lógica de negocio
|   |   |   +-- auth.service.ts
|   |   |   +-- risk.service.ts
|   |   |   +-- notification.service.ts
|   |   +-- middleware/
|   |   |   +-- auth.ts              # Autenticación JWT + autorización por rol
|   |   |   +-- errorHandler.ts
|   |   |   +-- notFound.ts
|   |   +-- config/                  # Helpers de configuración
|   |   +-- types/                   # Definiciones de tipos TypeScript
|   |   +-- utils/
|   |   |   +-- logger.ts            # Logger Winston
|   |   +-- modules/                 # Módulos de funcionalidades (módulo de firma)
|   +-- tests/                       # Archivos de tests Jest
|
+-- frontend/                        # Aplicación Next.js 14
|   +-- Dockerfile
|   +-- package.json
|   +-- tailwind.config.ts
|   +-- src/
|       +-- app/                     # Páginas del App Router de Next.js
|       +-- components/              # Componentes React reutilizables
|       +-- lib/                     # Cliente API, utilidades
|       +-- types/                   # Tipos TypeScript compartidos
|
+-- validation-service/              # Microservicio de validación de CUIT
|   +-- Dockerfile
|   +-- package.json
|   +-- tsconfig.json
|   +-- src/
|       +-- index.ts                 # App Express con validación CUIT/RFC/genérica
|
+-- infrastructure/                  # Terraform para despliegue en AWS
    +-- main.tf                      # Configuración del provider y backend
    +-- variables.tf                 # Definición de variables de entrada
    +-- vpc.tf                       # VPC, subnets, IGW, NAT
    +-- security_groups.tf           # SGs para ALB, backend, RDS, validación
    +-- rds.tf                       # Instancia RDS PostgreSQL
    +-- s3.tf                        # Bucket de almacenamiento de documentos
    +-- ecs.tf                       # Cluster ECS + definiciones de tareas Fargate
    +-- outputs.tf                   # Valores de salida
    +-- terraform.tfvars.example
```
