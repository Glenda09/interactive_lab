# Security RBAC Hardening

## Use this skill when

- implementing authentication or session flows,
- adding or changing protected endpoints,
- modifying role or permission behavior,
- reviewing data exposure, audit, or abuse protection.

## Outcome

Deliver a backend change that strengthens authentication, authorization, auditability, and abuse resistance.

## Workflow

1. Identify the protected resource and action.
2. Define which roles, permissions, and ownership rules apply.
3. Validate the request surface:
   - headers
   - params
   - query
   - body
4. Define rate limits and misuse cases.
5. Add or update audit events and secure error handling.

## Rules

- Never trust role hints from the frontend without backend verification.
- Use least privilege defaults.
- Do not expose whether a protected resource exists when the caller lacks access, unless the product explicitly needs that distinction.
- Avoid returning sensitive operational metadata in error responses.
- Rotate refresh tokens and revoke on logout or password change.

## Review checklist

- What stops a lower-privilege user from calling this path?
- What prevents brute force or spam on this endpoint?
- What audit trail is generated?
- What secrets or tokens could leak here?
- What data should be redacted from logs and responses?
