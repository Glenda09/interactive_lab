# Deployment Guide

## Option 1 — Docker Compose (recommended for local / staging)

### Prerequisites
- Docker ≥ 24
- Docker Compose ≥ 2.20

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/Glenda09/interactive_lab.git
cd interactive_lab

# 2. Set secrets
echo "JWT_SECRET=your_super_secret_here" > .env

# 3. Start all services
docker compose up --build -d

# 4. Open the app
open http://localhost:3000
```

Services started:
| Service  | Port  |
|----------|-------|
| frontend | 3000  |
| backend  | 5000  |
| mongo    | 27017 |

---

## Option 2 — Kubernetes (production)

### Prerequisites
- `kubectl` configured against your cluster
- Container images pushed to a registry (e.g. Docker Hub / GCR)

```bash
# 1. Create namespace
kubectl create namespace interactive-lab

# 2. Create secrets
kubectl create secret generic backend-secrets \
  --from-literal=mongodb-uri="mongodb+srv://..." \
  --from-literal=jwt-secret="your_super_secret" \
  -n interactive-lab

# 3. Apply manifests
kubectl apply -f infra/k8s/ -n interactive-lab

# 4. Check status
kubectl get pods -n interactive-lab
```

### Ingress (example with nginx-ingress)
Add an Ingress resource to expose `frontend-service` on port 80/443
and route `/api` traffic to `backend-service:5000`.

---

## Option 3 — Manual (Node.js + static hosting)

### Backend
```bash
cd backend
cp .env.example .env   # fill in your values
npm install --omit=dev
npm start
```

### Frontend
```bash
cd frontend
cp .env.example .env   # set REACT_APP_API_URL
npm install
npm run build          # outputs to frontend/build/
# Serve build/ folder with any static host (nginx, Vercel, Netlify, S3+CloudFront)
```
