# Frontend AGENTS

## Scope

This area owns the user-facing React application, the Babylon.js integration layer, course experience, dashboards, forms, and API consumption for the training platform.

## Primary goals

- Keep the UI modular, predictable, and easy to evolve.
- Isolate the 3D runtime from business UI concerns.
- Preserve accessibility, performance, and clear user feedback.
- Avoid coupling components directly to raw backend payloads.

## Architecture guidance

- Prefer feature-oriented folders under `src/features` or `src/modules`.
- Keep the Babylon runtime inside `src/simulation` or an equivalent dedicated boundary.
- Use React components for composition, not for complex domain logic.
- Put API clients, serializers, and query hooks outside presentational components.
- Normalize server data at the edge before it reaches screens.

## State guidance

- Use TanStack Query for server state.
- Use Zustand only for local cross-screen state that is not naturally remote.
- Keep transient simulation session state scoped to the simulation module.
- Do not use global state for form state unless there is a real workflow need.

## Babylon.js guidance

- Load assets asynchronously and surface progress states to the user.
- Treat scenarios as versioned content; never hardcode mutable asset paths.
- Emit structured domain events from the simulation layer to the app shell.
- Keep rendering concerns separate from scoring or academic rules.
- Dispose scenes, textures, and engine resources carefully on teardown.

## UX and security rules

- Do not store secrets in the frontend.
- Do not trust hidden UI states as authorization; the backend is the source of truth.
- Protect against unsafe HTML rendering; sanitize rich text if it is ever supported.
- Design loading, empty, error, and retry states intentionally.
- Favor keyboard-friendly navigation for non-3D flows.

## Code quality

- Prefer TypeScript strict mode.
- Write reusable domain types close to their feature modules.
- Add unit tests for hooks, formatters, and non-trivial view logic.
- Add integration or e2e coverage for authentication, course flows, and simulation launch.
- Keep components small; split when responsibilities diverge.

## Delivery checklist

- Does the feature respect role-based visibility without assuming authorization?
- Are API errors mapped to clear user-facing messages?
- Are loading states and retries handled?
- Is simulation logic still isolated from admin or academic UI?
- Are analytics or audit-triggering actions identified where needed?
