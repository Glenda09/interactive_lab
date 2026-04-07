# Modular API Feature

## Use this skill when

- adding a new backend module,
- implementing a REST resource,
- extending a domain service,
- designing a feature that touches persistence, validation, and policy checks.

## Outcome

Deliver a backend feature that fits a modular monolith and keeps clear ownership of rules, data, and API behavior.

## Workflow

1. Define the owning module.
2. Write the use cases the module must support.
3. Identify input DTOs, output DTOs, domain services, repositories, and policy checks.
4. Define audit events and error cases before writing endpoint code.
5. Add tests for domain rules and integration paths.

## Rules

- Keep controllers thin.
- Put validation close to the entry point.
- Put business rules in services or policy objects, not in controllers.
- Hide persistence details behind repositories or access adapters.
- Emit audit events for security-sensitive or business-critical actions.

## Review checklist

- Is module ownership clear?
- Are DTOs and domain models separated?
- Are permission checks explicit?
- Is error handling consistent?
- Are indexes and query costs considered for the new endpoints?
