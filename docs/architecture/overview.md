# Architecture Overview

## System Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                        │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React SPA (CRA)                                         │  │
│  │  ├── React Router (client-side routing)                  │  │
│  │  ├── Redux Toolkit (global state)                        │  │
│  │  ├── Axios (HTTP client)                                 │  │
│  │  └── Babylon.js (WebGL 3D engine)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │  REST API (JSON / JWT)              │
└───────────────────────────┼────────────────────────────────────┘
                            │
               ┌────────────▼───────────┐
               │   Node.js + Express    │
               │   REST API Server      │
               │   ├── Helmet (security)│
               │   ├── CORS             │
               │   ├── Winston (logs)   │
               │   └── JWT auth         │
               └────────────┬───────────┘
                            │ Mongoose ODM
               ┌────────────▼───────────┐
               │        MongoDB         │
               │   Collections:         │
               │   ├── users            │
               │   ├── simulations      │
               │   └── results          │
               └────────────────────────┘
```

## Folder structure

```
interactive_lab/
├── frontend/                  # React + Babylon.js SPA
│   └── src/
│       ├── components/        # Reusable UI components
│       │   ├── common/        # App-wide components (BabylonCanvas)
│       │   ├── layout/        # Page wrappers (MainLayout)
│       │   └── ui/            # Presentational components
│       ├── scenes/            # Babylon.js scene classes
│       ├── pages/             # Route-level page components
│       ├── services/          # Axios calls + Redux thunks
│       ├── store/             # Redux slices and store config
│       ├── hooks/             # Custom React hooks
│       └── utils/             # Pure helper functions
├── backend/                   # Node.js REST API
│   └── src/
│       ├── config/            # DB connection, env config
│       ├── controllers/       # Route handlers
│       ├── middleware/        # Auth, validation
│       ├── models/            # Mongoose schemas
│       ├── routes/            # Express routers
│       ├── services/          # Business logic (if needed)
│       └── utils/             # Logger, helpers
├── docs/
│   ├── api/                   # API reference (OpenAPI / Markdown)
│   ├── architecture/          # Diagrams and decisions
│   └── deployment/            # Deployment guides
├── infra/
│   ├── docker/                # Dockerfiles + nginx config
│   └── k8s/                   # Kubernetes manifests
├── docker-compose.yml         # Local full-stack environment
└── README.md
```

## Data flow

1. **User opens the app** → React SPA served from CDN / nginx.
2. **Login** → POST `/api/v1/auth/login` → JWT stored in `localStorage`.
3. **Browse simulations** → GET `/api/v1/simulations` → Redux state updated.
4. **Open a simulation** → GET `/api/v1/simulations/:id` → `SimulationScene` built.
5. **Interact with 3D scene** → steps tracked client-side in React state.
6. **Submit result** → POST `/api/v1/results` → stored in MongoDB.
7. **View dashboard** → GET `/api/v1/results/me` → personal stats rendered.

## Security

- **JWT** — short-lived tokens (default 7 days, configurable via `JWT_EXPIRES_IN`).
- **bcryptjs** — passwords hashed with salt rounds 12.
- **Helmet** — sets secure HTTP headers on every response.
- **CORS** — restricted to `ALLOWED_ORIGINS` env variable.
- **express-validator** — all input validated before reaching controllers.
