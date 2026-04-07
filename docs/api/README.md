# API Reference — Interactive Lab Backend

Base URL: `http://localhost:5000/api/v1`

All authenticated endpoints require the header:
```
Authorization: Bearer <token>
```

---

## Auth

### POST `/auth/register`
Register a new user.

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "securePass123"
}
```
**Response `201`:**
```json
{ "token": "...", "user": { "_id": "...", "name": "Juan Pérez", "email": "...", "role": "student" } }
```

---

### POST `/auth/login`
Authenticate and obtain a JWT token.

**Body:**
```json
{ "email": "juan@example.com", "password": "securePass123" }
```
**Response `200`:**
```json
{ "token": "...", "user": { ... } }
```

---

## Users *(Authenticated)*

| Method | Endpoint       | Description              |
|--------|----------------|--------------------------|
| GET    | `/users`       | List all users           |
| GET    | `/users/:id`   | Get a user by ID         |
| PUT    | `/users/:id`   | Update user (name/role)  |
| DELETE | `/users/:id`   | Delete user              |

---

## Simulations

| Method | Endpoint              | Auth required | Description                    |
|--------|-----------------------|---------------|--------------------------------|
| GET    | `/simulations`        | No            | List published simulations     |
| GET    | `/simulations/:id`    | No            | Get simulation by ID           |
| POST   | `/simulations`        | Yes           | Create a new simulation        |
| PUT    | `/simulations/:id`    | Yes           | Update simulation              |
| DELETE | `/simulations/:id`    | Yes           | Delete simulation              |

**Query params for GET `/simulations`:**
- `category` — filter by category string
- `difficulty` — `beginner` | `intermediate` | `advanced`

**Simulation body example:**
```json
{
  "title": "Instalación de red LAN",
  "description": "Practica el tendido y conexión de una red LAN empresarial.",
  "scenePath": "scenes/lan-installation.json",
  "difficulty": "intermediate",
  "category": "Redes",
  "objectives": ["Conectar switch", "Configurar router"],
  "estimatedMinutes": 45,
  "isPublished": true
}
```

---

## Results *(Authenticated)*

| Method | Endpoint                              | Description                         |
|--------|---------------------------------------|-------------------------------------|
| POST   | `/results`                            | Submit a simulation result          |
| GET    | `/results/me`                         | Get authenticated user's results    |
| GET    | `/results/simulation/:simulationId`   | Get all results for a simulation    |

**Result body example:**
```json
{
  "simulation": "<simulation_id>",
  "score": 87,
  "durationSeconds": 1240,
  "passed": true,
  "steps": [
    { "stepId": "step_0", "success": true, "timeTakenSeconds": 45 },
    { "stepId": "step_1", "success": true, "timeTakenSeconds": 60 }
  ]
}
```

---

## Health check

### GET `/health`
Returns `{ "status": "ok" }` — no auth required.

---

## Error responses

All errors follow this shape:
```json
{ "message": "Human-readable error description" }
```

| Status | Meaning                  |
|--------|--------------------------|
| 400    | Bad request              |
| 401    | Unauthorized / no token  |
| 404    | Resource not found       |
| 409    | Conflict (e.g. duplicate email) |
| 422    | Validation error         |
| 500    | Internal server error    |
