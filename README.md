# interactive_lab

Plataforma web de capacitacion virtual con simulacion 3D, desarrollada con React, Babylon.js y Node.js, orientada a la formacion tecnica mediante escenarios interactivos y evaluacion de desempeno.

## Estado actual

El repositorio ya incluye:

- base documental de arquitectura, seguridad y roadmap,
- scaffold real de `frontend` con React + Vite + Babylon.js,
- scaffold real de `backend` con NestJS modular y JWT,
- ERD conceptual y contrato OpenAPI inicial.

## Estructura principal

```text
docs/
frontend/
backend/
infra/
scripts/
```

## Comandos

Instalar dependencias:

```bash
npm install
```

Levantar frontend:

```bash
npm run dev:frontend
```

Levantar backend:

```bash
npm run dev:backend
```

Compilar ambos paquetes:

```bash
npm run build
```

## Credenciales demo del backend

- `admin@interactive-lab.local` / `ChangeMe123!`
- `student@interactive-lab.local` / `ChangeMe123!`

Definibles en [backend/.env.example](C:/Users/Usuario/Desktop/interactive_lab/backend/.env.example).

## Documentacion clave

- [Base arquitectonica](C:/Users/Usuario/Desktop/interactive_lab/docs/architecture/project-foundation.md)
- [ERD conceptual](C:/Users/Usuario/Desktop/interactive_lab/docs/architecture/domain-erd.md)
- [OpenAPI inicial](C:/Users/Usuario/Desktop/interactive_lab/docs/api/openapi-initial.yaml)
