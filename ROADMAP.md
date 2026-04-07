# Roadmap Técnico — Interactive Lab

## Fase 1 — Fundamentos (MVP) ✅
- [x] Estructura de carpetas profesional (frontend / backend / infra / docs)
- [x] Backend REST con Node.js, Express, MongoDB
- [x] Autenticación JWT con roles (student, instructor, admin)
- [x] Modelos de datos: User, Simulation, Result
- [x] Frontend React con React Router y Redux Toolkit
- [x] Babylon.js base: `BaseScene` y `SimulationScene` interactivos
- [x] Páginas: Home, Catálogo, Visor 3D, Dashboard, Login, Register, Admin
- [x] Dockerización completa (frontend + backend + mongo)
- [x] Manifests Kubernetes básicos
- [x] Documentación de API, arquitectura y despliegue

## Fase 2 — Contenido y experiencia de usuario
- [ ] Editor visual de escenas 3D (drag & drop de objetos)
- [ ] Sistema de notificaciones en tiempo real (Socket.io)
- [ ] Pantalla de finalización con puntuación detallada y retroalimentación
- [ ] Soporte para carga de modelos `.glb` / `.gltf` personalizados
- [ ] Filtros y búsqueda en el catálogo de simulaciones
- [ ] Modo oscuro / claro con persistencia en localStorage
- [ ] Internacionalización i18n (español / inglés)

## Fase 3 — Evaluación y analytics
- [ ] Motor de evaluación configurable por simulación (pesos por paso)
- [ ] Generación de certificados en PDF al aprobar
- [ ] Dashboard avanzado para instructores (comparativas, heat maps)
- [ ] Exportar resultados a CSV / Excel
- [ ] Integración con LMS (SCORM 2004 / xAPI / LTI)

## Fase 4 — Escalabilidad y DevOps
- [ ] Pipeline CI/CD con GitHub Actions (lint → test → build → deploy)
- [ ] Helm chart para despliegue en Kubernetes
- [ ] CDN para assets estáticos (CloudFront o similar)
- [ ] Monitoreo con Prometheus + Grafana
- [ ] Rate limiting y protección contra brute-force
- [ ] Tests E2E con Cypress
- [ ] Cobertura de tests unitarios ≥ 80%

## Fase 5 — Características avanzadas
- [ ] Multijugador / sesiones colaborativas en la misma escena
- [ ] Realidad aumentada (WebXR)
- [ ] IA para retroalimentación adaptativa según el desempeño
- [ ] Marketplace de simulaciones compartidas entre instituciones
