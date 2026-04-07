# React Babylon Feature

## Use this skill when

- implementing or refactoring simulation-facing frontend features,
- integrating Babylon.js scenes with React flows,
- wiring simulation events to backend APIs,
- optimizing scene lifecycle or asset loading behavior.

## Outcome

Deliver a frontend feature that keeps rendering concerns, UI concerns, and domain event reporting clearly separated.

## Workflow

1. Identify the user flow that owns the simulation entry point.
2. Separate application shell responsibilities from Babylon runtime responsibilities.
3. Define the minimal contract between the scene layer and the React layer:
   - scene boot params
   - emitted events
   - completion payload
   - error conditions
4. Check asset loading, cleanup, retry, and offline failure behavior.
5. Ensure the backend-facing payloads are mapped through a typed adapter instead of being sent ad hoc.

## Rules

- Do not place grading or authorization logic inside Babylon scene code.
- Do not let page components manage low-level scene objects directly unless the code is very small and well-contained.
- Emit structured events such as `checkpoint.completed`, `interaction.failed`, or `simulation.finished`.
- Clean up engine resources on unmount or scene switch.
- Prefer progressive loading and visible user feedback for heavy assets.

## Review checklist

- Is the scene lifecycle explicit?
- Is business logic outside the rendering layer?
- Are API payloads typed and reusable?
- Are errors and retries visible to the user?
- Is there a path to test the logic without rendering the full scene?
