# Contributing to useAxiom

Thank you for contributing to useAxiom! As a core developer, please adhere to the following guidelines.

## Branching Model
We use a Trunk-Based Development model. 
- Do not commit directly to `main`.
- Create a branch formatted as `type/short-description` (e.g., `feat/whatsapp-webhook`, `fix/login-timeout`).

## Pull Requests
1. Open a PR against `main`.
2. Fill out the Pull Request Template thoroughly.
3. Ensure CI passes (Lint, TypeScript compilation, Unit Tests).
4. Request review from at least one domain owner (see `team-responsibilities.md`).
5. Use "Squash and Merge" to keep the history clean.

## Coding Standards
- Enforce strict typing. No implicit `any`.
- If modifying the database schema, generate the migration and update `database-design.md`.
- If modifying API endpoints, update `api-specification.md`.
