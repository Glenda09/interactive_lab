# 🧪 Interactive Lab

**Plataforma de Capacitación Virtual con Simulación 3D**

> Aprende haciendo. Practica procedimientos técnicos en entornos 3D interactivos directamente desde el navegador, con retroalimentación en tiempo real y seguimiento de desempeño.

![Stack](https://img.shields.io/badge/React-18-61dafb?logo=react)
![Stack](https://img.shields.io/badge/Babylon.js-6-bb464b?logo=javascript)
![Stack](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![Stack](https://img.shields.io/badge/MongoDB-7-47a248?logo=mongodb)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📋 Índice

- [Descripción](#-descripción)
- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura)
- [Funcionalidades principales](#-funcionalidades-principales)
- [Instalación](#-instalación)
- [Ejecución local](#-ejecución-local)
- [Variables de entorno](#-variables-de-entorno)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Scripts útiles](#-scripts-útiles)
- [Documentación adicional](#-documentación-adicional)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)

---

## 📖 Descripción

**Interactive Lab** es una plataforma web de capacitación técnica que permite a estudiantes y profesionales practicar procedimientos en **escenarios 3D interactivos renderizados en el navegador** usando WebGL + Babylon.js.

Los instructores pueden crear y publicar simulaciones configurables; los estudiantes las ejecutan paso a paso; el sistema registra resultados, calcula puntajes y los muestra en un dashboard personalizado. Los administradores gestionan usuarios y contenido desde un panel centralizado.

---

## 🛠 Tecnologías

| Capa            | Tecnología                        | Versión |
|-----------------|-----------------------------------|---------|
| Frontend        | React                             | 18      |
| Motor 3D        | Babylon.js                        | 6       |
| Estado global   | Redux Toolkit                     | 2       |
| Enrutamiento    | React Router DOM                  | 6       |
| HTTP client     | Axios                             | 1       |
| Backend         | Node.js + Express                 | 20 / 4  |
| Base de datos   | MongoDB + Mongoose                | 7 / 8   |
| Autenticación   | JSON Web Tokens (JWT) + bcryptjs  | —       |
| Contenedores    | Docker + Docker Compose           | 24+     |
| Orquestación    | Kubernetes                        | —       |
| Servidor web    | nginx                             | 1.25    |
| Logging         | Winston                           | 3       |

---

## 🏗 Arquitectura

```
┌──────────────────────────────────────────────────┐
│               Browser (React SPA)                │
│  React Router · Redux · Axios · Babylon.js       │
└────────────────────┬─────────────────────────────┘
                     │ REST API + JWT
     ┌───────────────▼────────────────┐
     │  Node.js + Express REST API    │
     │  Helmet · CORS · express-validator │
     └───────────────┬────────────────┘
                     │ Mongoose ODM
         ┌───────────▼───────────┐
         │       MongoDB         │
         │  users · simulations  │
         │       results         │
         └───────────────────────┘
```

Diagrama detallado y decisiones de arquitectura: [`docs/architecture/overview.md`](docs/architecture/overview.md)

---

## ✨ Funcionalidades principales

| # | Funcionalidad                         | Descripción |
|---|---------------------------------------|-------------|
| 1 | **Catálogo de simulaciones**          | Lista de escenarios técnicos publicados, filtrables por categoría y dificultad |
| 2 | **Visor 3D interactivo**              | Renderizado WebGL con Babylon.js; el usuario interactúa con objetos para completar pasos |
| 3 | **Seguimiento de progreso en tiempo real** | Barra de avance que refleja los pasos completados dentro de la sesión |
| 4 | **Evaluación automática**             | Al finalizar, el sistema calcula puntuación, tiempo y registro de pasos |
| 5 | **Dashboard del estudiante**          | Historial de resultados, promedio de puntuación y tasa de aprobación |
| 6 | **Autenticación con roles**           | Roles: `student`, `instructor`, `admin` con acceso diferenciado |
| 7 | **Panel de administración**           | Gestión de usuarios y visibilidad del estado de la plataforma |
| 8 | **API REST documentada**              | Endpoints versionados bajo `/api/v1` con validación de entrada |

---

## 🚀 Instalación

### Prerrequisitos

- [Node.js ≥ 18](https://nodejs.org/)
- [Docker ≥ 24](https://www.docker.com/) + Docker Compose ≥ 2.20
- Git

### Clonar el repositorio

```bash
git clone https://github.com/Glenda09/interactive_lab.git
cd interactive_lab
```

---

## ▶️ Ejecución local

### Opción A — Docker Compose (recomendado)

Levanta los tres servicios (frontend, backend, MongoDB) con un solo comando:

```bash
# Copia y edita las variables de entorno
cp backend/.env.example backend/.env
# Edita backend/.env y agrega un JWT_SECRET fuerte

docker compose up --build
```

| Servicio  | URL                         |
|-----------|-----------------------------|
| Frontend  | http://localhost:3000       |
| Backend   | http://localhost:5000       |
| MongoDB   | mongodb://localhost:27017   |

---

### Opción B — Desarrollo manual (hot reload)

**1. Backend**
```bash
cd backend
cp .env.example .env          # configura las variables
npm install
npm run dev                   # nodemon con hot reload
```

**2. Frontend** (nueva terminal)
```bash
cd frontend
cp .env.example .env          # configura REACT_APP_API_URL
npm install
npm start                     # CRA con hot reload
```

**3. MongoDB**
```bash
docker compose up mongo -d    # solo la DB en contenedor
```

---

## 🔐 Variables de entorno

### Backend — `backend/.env`

| Variable          | Requerida | Ejemplo                                   | Descripción |
|-------------------|-----------|-------------------------------------------|-------------|
| `PORT`            | No        | `5000`                                    | Puerto del servidor |
| `NODE_ENV`        | No        | `development`                             | Entorno de ejecución |
| `MONGODB_URI`     | **Sí**    | `mongodb://localhost:27017/interactive_lab` | URI de conexión a MongoDB |
| `JWT_SECRET`      | **Sí**    | `s3cr3t_muy_largo_y_aleatorio`            | Clave privada para firmar JWTs |
| `JWT_EXPIRES_IN`  | No        | `7d`                                      | Vigencia del token |
| `ALLOWED_ORIGINS` | No        | `http://localhost:3000`                   | Orígenes permitidos por CORS |

### Frontend — `frontend/.env`

| Variable              | Requerida | Ejemplo                              | Descripción |
|-----------------------|-----------|--------------------------------------|-------------|
| `REACT_APP_API_URL`   | **Sí**    | `http://localhost:5000/api/v1`       | URL base de la API |
| `REACT_APP_ENABLE_INSPECTOR` | No | `false`                             | Activa el inspector de Babylon.js |

---

## 📁 Estructura del proyecto

```
interactive_lab/
├── frontend/                   # React + Babylon.js SPA
│   ├── public/                 # HTML base y assets estáticos
│   └── src/
│       ├── components/
│       │   ├── common/         # BabylonCanvas (integración WebGL)
│       │   ├── layout/         # MainLayout (header, footer, nav)
│       │   └── ui/             # SimulationCard, ProgressBar
│       ├── scenes/             # Clases Babylon.js (BaseScene, SimulationScene)
│       ├── pages/              # Home, SimulationList, SimulationViewer,
│       │                       # Dashboard, Login, Register, Admin, NotFound
│       ├── services/           # api.js (Axios), authService, simulationService
│       ├── store/              # Redux store + slices (auth, simulations)
│       ├── hooks/              # useSimulations
│       └── utils/              # helpers.js
├── backend/                    # Node.js REST API
│   └── src/
│       ├── config/             # database.js (MongoDB connection)
│       ├── controllers/        # auth, user, simulation, result
│       ├── middleware/         # auth.js (JWT), validate.js
│       ├── models/             # User, Simulation, Result (Mongoose)
│       ├── routes/             # index.js + auth/user/simulation/result routes
│       └── utils/              # logger.js (Winston)
├── docs/
│   ├── api/README.md           # Referencia completa de endpoints
│   ├── architecture/overview.md # Diagramas y decisiones de diseño
│   └── deployment/guide.md    # Guías de despliegue (Docker / K8s / manual)
├── infra/
│   ├── docker/                 # Dockerfile.frontend, Dockerfile.backend, nginx.conf
│   └── k8s/                    # Manifests para frontend, backend y MongoDB
├── .gitignore
├── docker-compose.yml
├── CONTRIBUTING.md
├── ROADMAP.md
└── README.md
```

---

## 📜 Scripts útiles

### Backend

```bash
npm run dev      # Servidor con hot reload (nodemon)
npm start        # Servidor producción
npm test         # Tests con Jest
npm run lint     # ESLint
```

### Frontend

```bash
npm start        # Servidor de desarrollo (CRA)
npm run build    # Build de producción en frontend/build/
npm test         # Tests con React Testing Library
npm run lint     # ESLint
npm run format   # Prettier
```

---

## 📚 Documentación adicional

| Documento | Descripción |
|-----------|-------------|
| [`docs/api/README.md`](docs/api/README.md) | Referencia completa de la API REST |
| [`docs/architecture/overview.md`](docs/architecture/overview.md) | Diagrama de arquitectura y flujo de datos |
| [`docs/deployment/guide.md`](docs/deployment/guide.md) | Guías de despliegue (Docker, K8s, manual) |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Cómo contribuir al proyecto |
| [`ROADMAP.md`](ROADMAP.md) | Fases de desarrollo y próximas funcionalidades |

---

## 🗺 Roadmap

Ver [`ROADMAP.md`](ROADMAP.md) para el plan completo por fases.

**Próximas prioridades:**
- [ ] Editor visual de escenas 3D
- [ ] Notificaciones en tiempo real (Socket.io)
- [ ] Pipeline CI/CD con GitHub Actions
- [ ] Generación de certificados en PDF

---

## 🤝 Contribuir

Lee [`CONTRIBUTING.md`](CONTRIBUTING.md) para conocer las convenciones de código, branches y proceso de PR.

---

## 📄 Licencia

MIT © Glenda09
