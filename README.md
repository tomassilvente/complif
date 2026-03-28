# Complif - Portal de Onboarding de Empresas

## 📋 Descripción

Portal de onboarding digital para empresas (KYB - Know Your Business) que automatiza la validación de documentación legal/fiscal y cálculo de riesgo.

## 🏗️ Arquitectura

```
complif/
├── backend/              # API REST en Express + TypeScript
├── frontend/             # Dashboard en Next.js
├── validation-service/   # Microservicio de validación CUIT/RFC
├── infrastructure/       # Terraform files (AWS)
└── docs/                # Documentación adicional
```

## 🚀 Stack Tecnológico

### Backend (Express)
- **Framework**: Express.js + TypeScript
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Autenticación**: JWT (jsonwebtoken)
- **Validación**: Zod
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **State Management**: Context API + React Query
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios

### DevOps
- **Containerización**: Docker + Docker Compose
- **IaC**: Terraform (AWS)
- **CI/CD**: GitHub Actions

## 📦 Requisitos Previos

- Node.js 18+
- Docker y Docker Compose
- Git

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tomassilvente/complif.git
cd complif
```

### 2. Configurar variables de entorno

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. Instalar Docker y Docker Compose

**Ubuntu/Debian:**
```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo apt install docker-compose-plugin

# Verificar
docker --version
docker compose version
```

### 4. Levantar el proyecto

```bash
# Desde la raíz del proyecto
docker compose up -d

# Ver logs
docker compose logs -f

# Detener
docker compose down
```

## 🌐 Acceso a las aplicaciones

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Validation Service**: http://localhost:3002
- **PostgreSQL**: localhost:5432

## 🗄️ Base de Datos

### Migraciones

```bash
cd backend
npm run prisma:migrate
```

### Seed (datos de ejemplo)

```bash
npm run prisma:seed
```

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📚 Documentación

- [QUESTIONS.md](./QUESTIONS.md) - Decisiones de arquitectura
- [AGENTS.md](./AGENTS.md) - Guía para AI agents
- Postman Collection: `docs/postman_collection.json`

## 🔐 Usuarios de prueba

```
Admin:
  email: admin@complif.com
  password: Admin123!

Viewer:
  email: viewer@complif.com
  password: Viewer123!
```

## 🎯 Funcionalidades

### Parte 1: Módulo de Firma Electrónica
- ✅ Esquemas de firmantes
- ✅ Facultades estandarizadas
- ✅ Grupos de firmantes
- ✅ Reglas de firma
- ✅ Solicitudes con trazabilidad

### Parte 2: Portal de Onboarding
- ✅ Dashboard con filtros
- ✅ Registro de empresas
- ✅ Upload de documentos
- ✅ Cálculo de risk score
- ✅ Timeline de estados
- ✅ Notificaciones en tiempo real

## 📝 Licencia

MIT

---

**Challenge Técnico - Complif**
