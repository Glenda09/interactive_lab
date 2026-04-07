# Learning UI Delivery

## Use this skill when

- building dashboards, course views, progress screens, or assessment flows,
- adding forms and tables for academic or administrative operations,
- shaping UX for learners, instructors, or supervisors.

## Outcome

Deliver a frontend slice that is consistent, role-aware, testable, and aligned with the training domain.

## Workflow

1. Identify the actor:
   - learner
   - instructor
   - supervisor
   - administrator
2. Identify the primary decision the screen helps the actor make.
3. Define the data contract needed from the API.
4. Design the success, loading, empty, error, and permission-denied states.
5. Implement queries, mutations, forms, and UI feedback with minimal coupling.

## Rules

- Make role-specific visibility explicit in the UI layer, but never treat it as the security boundary.
- Prefer clear progress indicators over decorative complexity.
- Keep tables, filters, and forms reusable across modules where it makes sense.
- Avoid burying operationally important data behind too many interactions.
- Favor explicit labels and audit-friendly wording for actions like publish, approve, reassign, or override.

## Review checklist

- Does the screen support the actor's main task with minimal friction?
- Are validation and field-level errors clear?
- Are destructive or sensitive actions confirmed?
- Is the state model simple enough to maintain?
- Can the backend contract evolve without breaking every component?
