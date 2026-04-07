# Backend AGENTS

## Scope

This area owns identity, authorization, catalog management, simulation sessions, evaluations, progress tracking, notifications, audit, and API contracts for the platform.

## Primary goals

- Build a modular backend that can start as a monolith and evolve safely.
- Keep business rules explicit and close to the domain modules that own them.
- Enforce security and auditability as first-class concerns.
- Preserve clean contracts between HTTP, application services, and persistence.

## Architecture guidance

- Prefer a modular monolith with strong internal boundaries.
- Organize code by domain module, not by technical layer across the whole app.
- Keep controllers thin and delegate to application services.
- Use repositories or data access adapters to isolate persistence details.
- Put shared cross-cutting concerns in a limited `shared` or `infra` area.

## Domain rules

- Progress must be computed on the server, never trusted from the client.
- Scenario versions are immutable once published.
- Manual overrides of grades, approvals, or role assignments must be audited.
- Administrative and learner flows should not share identical authorization paths.

## Security rules

- Hash passwords with Argon2id.
- Use short-lived access tokens and rotated refresh tokens.
- Validate every payload and query parameter.
- Apply permission checks in the backend for every protected action.
- Never log secrets, raw tokens, or sensitive personal data unnecessarily.

## Persistence guidance

- Treat the transactional domain as the system of record.
- Avoid storing large binary payloads in the database.
- Model audit separately from operational logs.
- Design indexes around login, assignments, progress lookups, reporting, and audit queries.

## API guidance

- Version endpoints from the start under `/api/v1`.
- Return consistent error envelopes.
- Paginate list endpoints and cap maximum page size.
- Expose only the fields required by the consumer.
- Use idempotency where retries could create duplicates.

## Testing and quality

- Add unit tests for domain services and policy checks.
- Add integration tests for auth, permissions, enrollments, and results.
- Add contract tests for critical endpoints used by the frontend simulation shell.
- Keep migration and schema changes reviewed carefully.

## Delivery checklist

- Which module owns this business rule?
- Which roles and permissions can execute it?
- What audit event should this action generate?
- What validation and rate limits apply?
- What indexes or query patterns will this introduce?
