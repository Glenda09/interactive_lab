# Plataforma de Capacitacion Virtual con Simulacion 3D

## 1. Resumen ejecutivo

El producto busca formar tecnicos mediante experiencias inmersivas en navegador, combinando contenido academico, escenarios 3D interactivos, evaluacion objetiva del desempeno y administracion centralizada. No es solo un LMS con contenido multimedia; es una plataforma de entrenamiento operativo con trazabilidad, medicion y capacidad de escalar a multiples programas de formacion.

Recomendacion principal:

- Construir la primera version como monolito modular bien estructurado, no como microservicios.
- Separar claramente el frontend React, el runtime 3D con Babylon.js, la API backend y la capa de almacenamiento de archivos.
- Disenar desde el inicio un dominio transaccional fuerte para usuarios, cursos, inscripciones, progreso, evaluaciones y auditoria.
- Tratar los assets 3D, multimedia y resultados pesados como recursos externos a la base de datos, servidos por almacenamiento de objetos + CDN.
- Planear Kubernetes como destino, pero no sobredisenar la primera version para una complejidad operacional innecesaria.

Decisiones recomendadas para la base:

- Arquitectura de aplicacion: monolito modular con modulos de dominio y fronteras internas claras.
- Base de datos: enfoque hibrido recomendado; si se exige una sola tecnologia para v1, conviene mas una relacional como sistema de registro que MongoDB como unico store.
- Autenticacion: access token de corta vida + refresh token rotado + RBAC + permisos finos.
- Observabilidad: logs estructurados, auditoria funcional separada, metricas y trazas desde el inicio.

## 2. Analisis del enfoque del proyecto

### Proposito real del producto

El proposito real es reducir la brecha entre teoria y practica tecnica, permitiendo entrenar tareas operativas sin depender siempre de laboratorio fisico, equipamiento costoso o riesgos reales. El sistema debe servir tanto para aprendizaje como para certificacion interna, seguimiento de desempeno y evidencia de cumplimiento.

### Dominio del problema

El dominio combina cuatro areas:

- Formacion: cursos, modulos, rutas de aprendizaje, contenidos, criterios de aprobacion.
- Simulacion: escenarios 3D, interacciones, eventos, estados de sesion, validacion de tareas.
- Evaluacion: intentos, rubricas, scoring, evidencia, aprobacion, retroalimentacion.
- Administracion: usuarios, roles, permisos, auditoria, reportes y operacion institucional.

### Necesidades del negocio que el sistema resuelve

- Entrenar personal tecnico sin depender totalmente de instalaciones fisicas.
- Estandarizar la evaluacion del desempeno operativo.
- Medir avance individual y grupal.
- Centralizar usuarios, asignaciones, historial y evidencia.
- Escalar contenidos y escenarios a diferentes cohortes, sedes o clientes.

### Ambiguedades y vacios detectados

Aspectos no definidos y que deben aclararse antes de la implementacion fina:

- Si la plataforma es B2B interna, multiempresa o multiinstitucion.
- Si existira modalidad multi-tenant real.
- Si los cursos tienen prerequisitos, caducidad o recertificacion.
- Si el scoring de simulacion sera deterministicamente configurado o si habra evaluacion manual complementaria.
- Si las simulaciones se ejecutan completamente client-side o requieren validacion de estados en servidor.
- Si habra trabajo offline o conectividad intermitente.
- Si ciertos escenarios o resultados son sensibles y requieren control de acceso reforzado.
- Si existiran integraciones con LMS externos, SSO corporativo o ERPs.

### Supuestos razonables para una primera arquitectura

- La primera version sera single-tenant logico, preparada para evolucionar a multi-tenant.
- El motor 3D se ejecutara en el navegador y reportara eventos clave al backend.
- Los escenarios 3D y multimedia se almacenaran fuera de la base de datos.
- El sistema requerira auditoria formal de acciones administrativas y evaluativas.
- El producto necesitara reportes operativos y academicos, por lo que la trazabilidad y consistencia son criticas.

## 3. Necesidades funcionales

- Registro, inicio de sesion, recuperacion de acceso y gestion de perfil.
- Gestion de usuarios, roles, permisos y estados de cuenta.
- Catalogo de cursos, modulos, lecciones, recursos y versiones de contenido.
- Gestion de escenarios 3D, configuraciones, assets, parametros y publicaciones.
- Ejecucion de simulaciones en navegador con captura de eventos relevantes.
- Inscripcion y asignacion de usuarios a cursos o rutas.
- Seguimiento de progreso por curso, modulo, escenario y evaluacion.
- Evaluaciones teoricas, practicas o mixtas.
- Registro de intentos, puntajes, tiempos, errores y evidencias.
- Paneles operativos para instructores, supervisores y administradores.
- Reportes exportables de avance, aprobacion, uso y desempeno.
- Notificaciones de asignaciones, vencimientos, aprobaciones o incidentes.
- Auditoria de acciones criticas del negocio y de seguridad.

## 4. Necesidades no funcionales

- Escalabilidad horizontal para frontend, API y distribucion de assets.
- Buen tiempo de carga de escenarios y contenido.
- Seguridad fuerte en autenticacion, autorizacion, secretos y proteccion de API.
- Alta mantenibilidad mediante arquitectura modular, contratos claros y convenciones.
- Disponibilidad razonable y despliegues repetibles.
- Trazabilidad completa de acciones relevantes.
- Compatibilidad con navegadores modernos y estaciones con capacidades graficas medias.
- Observabilidad: logs, metricas, trazas, alertas.
- Integridad de datos para progreso, evaluaciones y auditoria.
- Soporte para versionado de contenido y escenarios.
- Buenas practicas de accesibilidad en la capa web, incluso si la simulacion 3D tiene limites naturales.

## 5. Tipos de usuarios

### Roles operativos y academicos

- Estudiante/Tecnico: consume cursos, ejecuta simulaciones, realiza evaluaciones, revisa progreso e historial.
- Instructor/Evaluador: asigna contenido, revisa progreso, analiza intentos, agrega retroalimentacion y valida evaluaciones manuales si aplica.
- Supervisor/Jefe de area: consulta avance y desempeno de equipos, cumplimiento y vencimientos.

### Roles administrativos

- Administrador academico: gestiona catalogo de cursos, modulos, criterios de aprobacion y asignaciones.
- Administrador de plataforma: gestiona usuarios, roles, parametros globales, notificaciones y configuraciones.

### Roles tecnicos

- Gestor de contenido 3D: publica escenarios, versiones, assets, metadatos y reglas de simulacion.
- Soporte/Auditor: revisa incidentes, bitacoras y eventos criticos sin necesariamente administrar contenido.

### Modelo inicial de roles y permisos

Modelo recomendado: RBAC con posibilidad de permisos granulares.

Roles base:

- `student`
- `instructor`
- `supervisor`
- `academic_admin`
- `platform_admin`
- `content_manager`
- `auditor`

Permisos agrupados por dominio:

- Usuarios: `users.read`, `users.create`, `users.update`, `users.disable`
- Roles y acceso: `roles.read`, `roles.assign`, `permissions.manage`
- Cursos: `courses.read`, `courses.create`, `courses.update`, `courses.publish`
- Modulos y contenido: `modules.manage`, `resources.manage`
- Escenarios: `scenarios.create`, `scenarios.publish`, `scenarios.version`
- Simulaciones: `simulations.launch`, `simulations.review`
- Evaluaciones: `assessments.create`, `assessments.grade`, `results.override`
- Progreso: `progress.read.self`, `progress.read.team`, `progress.read.all`
- Auditoria: `audit.read`, `audit.export`
- Notificaciones: `notifications.send`, `notifications.manage`
- Administracion: `settings.manage`

## 6. Modulos principales del sistema

- Autenticacion y acceso: login, logout, refresh, recuperacion, MFA futuro, bloqueo y politicas de sesion.
- Administracion de usuarios: altas, bajas logicas, perfil, estados, asignaciones y roles.
- Catalogo academico: cursos, modulos, lecciones, prerequisitos, publicaciones y versionado.
- Gestion de escenarios 3D: metadatos, paquetes de assets, versiones, validaciones, estado de publicacion.
- Runtime de simulacion: carga del escenario, sesion de simulacion, captura de eventos, checkpoints y cierre.
- Evaluaciones: bancos de criterios, instrumentos, intentos, scoring y aprobacion.
- Seguimiento de progreso: consolidacion de avance, estados de completitud, tiempos e hitos.
- Reportes y analitica: desempeno individual, grupal, academico y operativo.
- Notificaciones: eventos de negocio, recordatorios, vencimientos y mensajes de sistema.
- Auditoria y trazabilidad: eventos administrativos, academicos y de seguridad.
- Administracion general: parametros globales, catalogos y configuraciones.

## 7. Arquitectura propuesta

### Recomendacion de arquitectura

Para una primera version seria, conviene un monolito modular. Motivos:

- El dominio aun esta en descubrimiento.
- Habra cambios frecuentes en reglas de negocio.
- Se requiere velocidad para construir modulos transaccionales y de simulacion sin sobrecarga distribuida.
- Facilita consistencia de datos, despliegue y debugging.

Microservicios solo se justifican despues de validar:

- equipos de desarrollo separados,
- cargas muy distintas por dominio,
- necesidad real de despliegue independiente,
- o limites claros del monolito.

### Separacion de capas

#### Frontend React

- Portal web administrativo y academico.
- Shell de aplicacion, navegacion, dashboards, formularios, reportes.
- Orquesta el runtime 3D y el consumo de API.

#### Modulo 3D Babylon.js

- Submodulo especializado dentro del frontend.
- Encapsula escena, carga de assets, interacciones, reglas de simulacion cliente y emision de eventos.
- No debe contener logica academica ni permisos; solo logica de simulacion e instrumentacion.

#### Backend Node.js

Responsable de:

- identidad y acceso,
- catalogo academico,
- escenarios y publicaciones,
- sesiones e intentos de simulacion,
- evaluaciones,
- progreso,
- notificaciones,
- auditoria,
- reportes.

#### Infraestructura

- CDN para assets estaticos y paquetes 3D.
- API desplegada en contenedores sobre Kubernetes.
- Base de datos gestionada.
- Almacenamiento de objetos para multimedia y assets.
- Cola o broker opcional para tareas asincronas.

### Comunicacion entre capas

- Frontend <-> API: REST JSON para operacion general.
- Frontend 3D -> API: endpoints para iniciar sesion de simulacion, emitir checkpoints, finalizar intento y consultar definiciones publicadas.
- API -> almacenamiento de objetos: referencias y URLs firmadas para assets privados.
- API -> cola/worker: notificaciones, procesamiento de reportes, tareas pesadas.

### Arquitectura logica del backend

Modulos internos sugeridos:

- `iam`
- `users`
- `courses`
- `modules`
- `scenarios`
- `simulation-sessions`
- `assessments`
- `progress`
- `notifications`
- `audit`
- `reports`
- `files`
- `shared`

Cada modulo debe tener:

- controlador o adaptador HTTP
- servicios de aplicacion
- modelos de dominio/DTOs
- repositorios
- politicas de acceso
- pruebas

### Ventajas y desventajas

Monolito modular:

- Ventajas: menor complejidad operativa, consistencia, menor costo, mas velocidad al inicio, trazabilidad mas simple.
- Desventajas: requiere disciplina fuerte de modulos; si se diseña mal se degrada en monolito acoplado.

Microservicios:

- Ventajas: despliegue independiente, escalado por dominio, limites mas explicitos.
- Desventajas: alto costo operacional, complejidad de consistencia, trazabilidad distribuida, seguridad y testing mas complejos.

## 8. Propuesta de modelo de datos a nivel conceptual

### Recomendacion de base de datos

MongoDB como unico almacenamiento no es la mejor opcion para este dominio si la plataforma tendra:

- RBAC riguroso,
- inscripciones y relaciones fuertes,
- progreso consolidado,
- auditoria formal,
- reportes y filtros complejos,
- reglas de aprobacion y trazabilidad.

Recomendacion tecnica:

- Sistema de registro principal: PostgreSQL.
- Datos flexibles o de alta variabilidad: MongoDB opcional para telemetria o definiciones complejas de eventos.
- Assets y archivos: almacenamiento de objetos.

Si se insiste en MongoDB para v1:

- usar colecciones bien normalizadas por referencia,
- evitar documentos gigantes con progreso embebido ilimitado,
- modelar auditoria y resultados con indices pensados desde el inicio,
- aceptar que el reporting complejo y la integridad relacional seran mas costosos.

### Entidades conceptuales principales

#### Usuario

- `id`
- `externalRef` opcional
- `firstName`
- `lastName`
- `email`
- `passwordHash`
- `status` activo, bloqueado, suspendido, pendiente
- `lastLoginAt`
- `profileData`
- `createdAt`, `updatedAt`

Relaciones:

- pertenece a uno o varios roles
- puede tener inscripciones
- genera intentos, resultados, auditoria y notificaciones

#### Rol

- `id`
- `code`
- `name`
- `description`
- `isSystem`

#### Permiso

- `id`
- `code`
- `name`
- `description`
- `resource`
- `action`

#### UsuarioRol

- `userId`
- `roleId`
- `scope` opcional
- `assignedBy`
- `assignedAt`

#### RolPermiso

- `roleId`
- `permissionId`

#### Curso

- `id`
- `code`
- `title`
- `description`
- `status` borrador, publicado, archivado
- `difficulty`
- `estimatedDuration`
- `version`
- `isCertification`
- `createdBy`

Relaciones:

- tiene muchos modulos
- recibe inscripciones

#### Modulo

- `id`
- `courseId`
- `title`
- `description`
- `order`
- `type` teoria, practica, mixto
- `estimatedDuration`
- `isMandatory`
- `prerequisiteRule`

#### Recurso/Leccion

- `id`
- `moduleId`
- `type` video, pdf, html, enlace, paquete 3d
- `title`
- `storageRef`
- `visibility`
- `version`

#### Escenario3D

- `id`
- `code`
- `title`
- `description`
- `status`
- `version`
- `engineVersion`
- `entryAssetRef`
- `configSchema`
- `runtimeRules`
- `createdBy`
- `publishedAt`

#### EscenarioModulo

- `moduleId`
- `scenarioId`
- `weight`
- `required`

#### Inscripcion

- `id`
- `userId`
- `courseId`
- `assignedBy`
- `enrollmentType` manual, masiva, auto
- `status` activa, completada, cancelada, vencida
- `startAt`
- `dueAt`
- `completedAt`

#### ProgresoUsuarioCurso

- `id`
- `userId`
- `courseId`
- `progressPercent`
- `status` no iniciado, en progreso, aprobado, reprobado, vencido
- `completedModules`
- `passedAssessments`
- `lastActivityAt`

#### ProgresoUsuarioModulo

- `id`
- `userId`
- `moduleId`
- `progressPercent`
- `status`
- `timeSpent`
- `lastCheckpoint`

#### SesionSimulacion

- `id`
- `userId`
- `scenarioId`
- `courseId` opcional
- `moduleId` opcional
- `startedAt`
- `endedAt`
- `status` iniciada, completada, abortada, expirada
- `clientVersion`
- `deviceInfo`

#### IntentoSimulacion

- `id`
- `simulationSessionId`
- `attemptNumber`
- `startedAt`
- `endedAt`
- `score`
- `status`
- `resultSummary`
- `evidenceRef`

#### EventoSimulacion

- `id`
- `simulationSessionId`
- `attemptId`
- `eventType`
- `eventTime`
- `payload`
- `severity`

#### Evaluacion

- `id`
- `courseId` o `moduleId`
- `type` teorica, practica, mixta
- `title`
- `description`
- `maxScore`
- `passScore`
- `attemptLimit`
- `gradingMode` automatica, manual, mixta
- `status`

#### ResultadoEvaluacion

- `id`
- `assessmentId`
- `userId`
- `attemptId` opcional
- `score`
- `passed`
- `gradedBy` opcional
- `gradedAt`
- `feedback`

#### Auditoria

- `id`
- `actorUserId`
- `action`
- `resourceType`
- `resourceId`
- `beforeSnapshot` opcional
- `afterSnapshot` opcional
- `ip`
- `userAgent`
- `occurredAt`
- `correlationId`

#### Notificacion

- `id`
- `userId`
- `type`
- `title`
- `message`
- `channel` in-app, email, push futuro
- `status`
- `readAt`
- `createdAt`

#### ArchivoRecurso

- `id`
- `ownerType`
- `ownerId`
- `storageProvider`
- `bucket`
- `path`
- `mimeType`
- `size`
- `checksum`
- `visibility`
- `uploadedBy`
- `createdAt`

## 9. Reglas de negocio

- Un usuario no puede iniciar un modulo o evaluacion protegida si no esta inscrito o asignado.
- Un curso no debe considerarse aprobado solo por consumir contenido; debe cumplir criterios de aprobacion configurados.
- Los modulos obligatorios deben completarse antes de marcar el curso como aprobado, salvo excepciones configuradas.
- Un escenario publicado no debe modificarse en caliente; cualquier cambio relevante debe generar una nueva version.
- Una evaluacion puede depender de uno o varios modulos completados.
- Un intento de simulacion debe quedar cerrado con estado final; no debe haber intentos infinitamente abiertos.
- Las anulaciones o sobreescrituras manuales de resultados deben quedar auditadas y con motivo.
- La eliminacion fisica de resultados, auditorias o intentos no es recomendable; usar borrado logico donde aplique.

### Calculo de progreso

Regla inicial recomendada:

- progreso de modulo = suma ponderada de sus actividades completadas / suma total de ponderaciones
- progreso de curso = suma ponderada de modulos completados y evaluaciones requeridas
- una simulacion requerida puede ponderar como actividad del modulo
- el estado aprobado no depende solo del porcentaje; tambien depende de nota minima y actividades obligatorias

Ejemplo conceptual:

- 40 por ciento contenido obligatorio consumido
- 30 por ciento simulacion obligatoria aprobada
- 30 por ciento evaluacion final aprobada

El curso puede estar en 90 por ciento, pero no aprobado si la evaluacion final no alcanza `passScore`.

### Relacion entre curso, modulo, escenario, evaluacion e intentos

- Un curso contiene modulos.
- Un modulo puede tener contenido, uno o varios escenarios y una o varias evaluaciones.
- Un escenario genera sesiones e intentos de simulacion.
- Una evaluacion puede usar como evidencia un intento de simulacion.
- El progreso consolidado se alimenta de actividades, escenarios y resultados.

### Criterios basicos de aprobacion y trazabilidad

- `approved` si cumple actividades obligatorias + `passScore` + reglas de negocio.
- `failed` si agota intentos o finaliza debajo del umbral.
- `expired` si la fecha limite vence sin cierre satisfactorio.
- Toda intervencion manual sobre estados o puntajes debe quedar trazada.

## 10. Seguridad recomendada

- Hash de contrasenas con Argon2id.
- Refresh tokens rotados y almacenados de forma segura.
- Bloqueo temporal por intentos fallidos excesivos.
- Politica de contrasenas y opcion futura de MFA.
- RBAC con permisos finos y chequeo en backend, no solo en frontend.
- Validacion estricta de payloads de entrada.
- Sanitizacion de contenido rich text y campos mostrables.
- Rate limiting por IP, por usuario y por endpoint sensible.
- Helmet o equivalente para headers de seguridad.
- CORS con allowlist estricta por ambiente.
- Secretos fuera del repositorio; usar variables de entorno y secret manager.
- Auditoria de login, cambios de permisos, publicaciones, resultados y descargas sensibles.
- URL firmadas y expirables para acceso a recursos privados.
- Principio de minimo privilegio para servicios, pods y cuentas tecnicas.

## 11. Autenticacion y autorizacion

### Estrategia recomendada

- Access token JWT de corta vida, por ejemplo 10 a 15 minutos.
- Refresh token opaco o JWT rotado, persistido con identificador, huella y expiracion.
- Revocacion de refresh tokens por logout, cambio de contrasena o sospecha de compromiso.

### Flujo de login

1. Usuario envia credenciales.
2. Backend valida usuario, estado de cuenta y hash.
3. Si es valido, emite access token y refresh token.
4. Registra evento de seguridad y metadatos del dispositivo.

### Flujo de renovacion

1. Cliente envia refresh token.
2. Backend valida existencia, integridad, expiracion y no revocacion.
3. Rota refresh token.
4. Emite nuevo access token y nuevo refresh token.

### Logout

- Invalidar refresh token actual.
- Opcionalmente invalidar todas las sesiones activas del usuario.

### Recuperacion de acceso

- Token unico de corta vida.
- Enlace one-time use.
- No revelar si el email existe.
- Invalidar tokens previos al generar uno nuevo.
- Auditar solicitud y restablecimiento.

### Manejo de roles y permisos

- El token puede incluir `sub`, `roles`, `tenant` futuro y permisos derivados resumidos.
- La autorizacion final debe verificarse contra politicas del backend para evitar confiar ciegamente en claims del cliente.
- Para acciones criticas, combinar rol + permiso + ownership + estado del recurso.

## 12. Proteccion de API

- Versionar desde el inicio: `/api/v1/...`
- TLS obligatorio en todos los ambientes reales.
- CORS restringido por dominio y metodo.
- Rate limiting:
  - global por IP,
  - reforzado en login, password reset y endpoints de exportacion,
  - cuotas por usuario para endpoints pesados.
- Validacion de payloads con esquemas tipados.
- Respuestas de error sin filtrar stack traces ni detalles internos.
- Idempotency key para operaciones sensibles que puedan duplicarse.
- Paginacion, filtros y limites maximos para listar datos.
- Seleccion explicita de campos en respuestas para no sobreexponer informacion.
- Sanitizacion de query params y proteccion ante NoSQL/SQL injection segun motor elegido.
- Proteccion contra abuso en endpoints de simulacion para evitar flood de eventos.

## 13. Auditoria y monitoreo

### Eventos que deben auditarse

- login exitoso y fallido
- logout y revocacion de sesiones
- cambios de contrasena y recuperacion de acceso
- alta, baja logica o bloqueo de usuarios
- asignacion o cambio de roles y permisos
- creacion, publicacion y versionado de cursos, modulos y escenarios
- inscripciones y desinscripciones
- inicio y cierre de sesiones de simulacion
- cambios manuales de puntajes, aprobaciones o anulaciones
- exportaciones de reportes sensibles

### Logs tecnicos

Campos sugeridos:

- `timestamp`
- `level`
- `service`
- `env`
- `traceId`
- `correlationId`
- `userId` opcional
- `message`
- `metadata`

### Logs funcionales

Campos sugeridos:

- `eventType`
- `actorId`
- `resourceType`
- `resourceId`
- `result`
- `context`
- `occurredAt`

### Monitoreo recomendado

- Errores de frontend con Sentry.
- Errores de backend con Sentry o equivalente.
- Metricas con Prometheus + Grafana.
- Trazas distribuidas con OpenTelemetry.
- Alertas por latencia, error rate, consumo de recursos, fallos de login anormales y caidas de integraciones.

## 14. Librerias y herramientas recomendadas

### Backend Node.js

- Framework: NestJS con adaptador Fastify.
  - Justificacion: modularidad, DI, validacion, estructura mantenible y buena compatibilidad enterprise.
- ORM: Prisma si se usa PostgreSQL.
  - Justificacion: tipado fuerte, migraciones claras y buen DX.
- ODM: Mongoose solo si Mongo queda para subdominios documentales.
- Validacion: Zod o `class-validator` segun el estilo del backend.
- Auth: `@nestjs/jwt`, `argon2`, `passport` si se requiere estrategia formal.
- Seguridad HTTP: `helmet`, `@fastify/rate-limit`, `cors`.
- Logs: `pino`, `nestjs-pino`.
- Colas: BullMQ con Redis para procesos asincronos.
- Archivos: SDK de S3 compatible o MinIO client.
- Documentacion API: Swagger/OpenAPI.
- Testing: Vitest o Jest + Supertest.

### Frontend React

- Build: Vite.
- Routing: React Router.
- Estado servidor: TanStack Query.
- Estado cliente: Zustand.
- Formularios: React Hook Form + Zod.
- HTTP: Axios o `fetch` encapsulado; preferible un cliente tipado propio.
- UI: Mantine, MUI o shadcn/ui segun la linea visual deseada; evitar mezclar multiples sistemas.
- Babylon.js: `@babylonjs/core`, `@babylonjs/loaders`, `@babylonjs/gui`.
- Error tracking: Sentry.
- Testing: Vitest + React Testing Library + Playwright para e2e.

### Calidad de codigo

- ESLint
- Prettier
- Husky
- lint-staged
- Commitlint opcional
- SonarQube o CodeQL en madurez posterior

### Despliegue e infraestructura

- Contenedores Docker.
- Kubernetes para ambientes estables y escalado.
- Ingress controller.
- CDN para frontend y assets.
- Almacenamiento de objetos S3 compatible.
- GitHub Actions o GitLab CI para CI/CD.
- Helm para despliegue.

## 15. Estructura de carpetas sugerida

```text
interactive_lab/
  docs/
    architecture/
      project-foundation.md
    adr/
  frontend/
    AGENTS.md
    skills/
      react-babylon-feature/
        SKILL.md
      learning-ui-delivery/
        SKILL.md
    src/
      app/
      modules/
      features/
      simulation/
      shared/
      assets/
      tests/
  backend/
    AGENTS.md
    skills/
      modular-api-feature/
        SKILL.md
      security-rbac-hardening/
        SKILL.md
    src/
      modules/
      shared/
      infra/
      config/
      tests/
  infra/
    docker/
    k8s/
    helm/
  scripts/
```

Convenciones recomendadas:

- Carpetas por dominio o feature, no por tipo tecnico puro en toda la app.
- DTOs, servicios y repositorios cerca del modulo al que pertenecen.
- Los componentes 3D aislados del resto del UI.
- Nombres consistentes en ingles tecnico para codigo y dominio en lenguaje ubicuo definido por el equipo.

## 16. Endpoints iniciales sugeridos

### Publicos

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/public/courses`
- `GET /api/v1/public/courses/:id`

### Protegidos base

#### Usuarios y acceso

- `GET /api/v1/me`
- `PATCH /api/v1/me/profile`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:id`
- `PATCH /api/v1/users/:id/status`
- `POST /api/v1/users/:id/roles`

#### Cursos y modulos

- `GET /api/v1/courses`
- `POST /api/v1/courses`
- `GET /api/v1/courses/:id`
- `PATCH /api/v1/courses/:id`
- `POST /api/v1/courses/:id/publish`
- `GET /api/v1/courses/:id/modules`
- `POST /api/v1/courses/:id/modules`

#### Escenarios 3D

- `GET /api/v1/scenarios`
- `POST /api/v1/scenarios`
- `GET /api/v1/scenarios/:id`
- `PATCH /api/v1/scenarios/:id`
- `POST /api/v1/scenarios/:id/publish`
- `POST /api/v1/scenarios/:id/assets/upload-url`

#### Inscripciones y progreso

- `POST /api/v1/enrollments`
- `GET /api/v1/enrollments`
- `GET /api/v1/progress/me/courses`
- `GET /api/v1/progress/users/:userId/courses/:courseId`

#### Simulaciones

- `POST /api/v1/simulation-sessions`
- `POST /api/v1/simulation-sessions/:id/checkpoints`
- `POST /api/v1/simulation-sessions/:id/events/bulk`
- `POST /api/v1/simulation-sessions/:id/complete`
- `GET /api/v1/simulation-sessions/:id/results`

#### Evaluaciones

- `GET /api/v1/assessments`
- `POST /api/v1/assessments`
- `POST /api/v1/assessments/:id/attempts`
- `POST /api/v1/assessments/:id/submit`
- `GET /api/v1/results/me`
- `GET /api/v1/results/users/:userId`

#### Auditoria y notificaciones

- `GET /api/v1/audit`
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`

### Recursos prioritarios para una primera version funcional

- autenticacion
- usuarios y roles
- cursos y modulos
- escenarios publicados
- inscripciones
- sesiones de simulacion
- resultados y progreso

## 17. Riesgos tecnicos y recomendaciones

### Riesgos

- Elegir MongoDB como unico store puede degradar integridad y reporting.
- Mezclar logica de simulacion con logica academica en frontend vuelve inmanejable el codigo.
- Publicar assets 3D sin versionado ni control de cache puede romper sesiones activas.
- Capturar demasiados eventos de simulacion sin estrategia de agregacion puede disparar costos y latencia.
- Intentar microservicios demasiado temprano puede frenar al equipo.
- No separar auditoria funcional de logs tecnicos puede dejar huecos de cumplimiento.
- No definir criterios de aprobacion desde el inicio rompe progreso y reportes.

### Errores de diseno a evitar

- Acoplar permisos solo a roles sin capa de politicas.
- Calcular progreso solo en frontend.
- Guardar archivos binarios en base de datos.
- Exponer endpoints administrativos y academicos con las mismas reglas.
- Omitir versionado de API y de escenarios.
- Diseñar la simulacion como caja negra sin trazabilidad de eventos relevantes.

### Prioridades tecnicas

- Definir dominio, estados y reglas de aprobacion.
- Cerrar la estrategia de almacenamiento.
- Establecer RBAC y auditoria desde el inicio.
- Separar runtime 3D de la aplicacion de negocio.
- Crear contratos de API estables antes de multiplicar pantallas y escenarios.

## 18. Roadmap tecnico por fases

### Fase 0. Analisis y definiciones

Entregables:

- glosario de dominio
- mapa de actores
- reglas de negocio base
- criterios de aprobacion
- ADR de base de datos y arquitectura

### Fase 1. Base arquitectonica

Entregables:

- repositorio estructurado
- pipelines CI basicos
- entornos locales
- modulo de configuracion
- logging, manejo de errores, documentacion OpenAPI

### Fase 2. Identidad y acceso

Entregables:

- login, refresh, logout, reset password
- modelo de usuarios, roles y permisos
- guards/policies
- auditoria de seguridad

### Fase 3. Catalogo academico

Entregables:

- cursos, modulos, recursos
- publicaciones y versionado
- inscripciones
- vistas basicas administrativas

### Fase 4. Simulacion 3D

Entregables:

- shell React + Babylon
- carga de escenarios publicados
- inicio/cierre de sesiones
- captura de checkpoints y eventos base

### Fase 5. Evaluaciones y progreso

Entregables:

- evaluaciones teoricas y practicas
- scoring
- resultados
- progreso consolidado por curso y modulo

### Fase 6. Reportes, auditoria y notificaciones

Entregables:

- paneles operativos
- auditoria funcional consultable
- notificaciones in-app y email
- exportaciones controladas

### Fase 7. Endurecimiento y despliegue

Entregables:

- hardening de seguridad
- pruebas de carga
- dashboards de observabilidad
- contenedores
- despliegue en Kubernetes
- CDN y estrategia de cache para assets

### Fase 8. Evolucion

Entregables potenciales:

- multi-tenant
- SSO empresarial
- recertificaciones
- analitica avanzada
- recomendaciones adaptativas
- desacople a servicios si la carga real lo exige
