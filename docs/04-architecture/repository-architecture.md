# Repository Architecture: useAxiom

## 1. Monorepo Strategy
**Recommendation:** `pnpm` workspaces + `Turborepo`
**Justification:** 
The useAxiom platform consists of multiple interlocking domains: a React frontend, a Node.js API backend, background AI workers, and shared business logic. 
- **pnpm workspaces:** Provides strict dependency isolation and significantly faster installs via a global store, preventing "phantom dependencies" common in enterprise mono-repos.
- **Turborepo:** Offers highly intelligent build caching and task orchestration. It ensures that running `lint`, `test`, or `build` across the repository only executes on packages that have actually changed, saving hundreds of CI/CD hours.

## 2. Complete Folder Structure
```text
useAxiom/
├── apps/
│   ├── manager-dashboard/   # React/Vite SPA
│   ├── backend-api/         # Node.js/Express Core API
│   └── background-workers/  # AI & Webhook Consumers
├── packages/
│   ├── ui/                  # Shared React components (Tailwind)
│   ├── types/               # Shared TypeScript interfaces (DB schemas, API payloads)
│   ├── config/              # Shared configs (ESLint, TSConfig, Tailwind)
│   ├── database/            # Prisma/TypeORM schema and client
│   ├── ai-engine/           # LLM logic, prompts, and tool calls
│   └── utils/               # Shared helpers (date parsing, logging)
├── docs/
│   ├── product/             # SRS, UX Flows
│   ├── architecture/        # HLD, ADR, DB Design, API Specs, ADD
│   └── runbooks/            # Operational guides
├── infra/
│   ├── docker/              # Dockerfiles and compose setups
│   ├── terraform/           # IaC for AWS/GCP
│   └── k8s/                 # Kubernetes manifests (Future)
├── scripts/                 # CI/CD & local setup bash scripts
├── .github/
│   └── workflows/           # CI/CD pipelines
├── package.json             # Root monorepo dependencies
├── pnpm-workspace.yaml      # Workspace definitions
└── turbo.json               # Turborepo build pipeline
```

## 3. Responsibility of Top-Level Directories
- `apps/`: Deployable, runnable applications. These depend on internal `packages/` but never on other `apps/`.
- `packages/`: Internal libraries shared across apps. They are modular, purely functional, and highly testable.
- `docs/`: The single source of truth for all immutable project context.
- `infra/`: Everything required to provision, run, and scale the application in the cloud.
- `scripts/`: Developer experience (DX) tooling for local setup and database seeding.

## 4. Responsibility of Applications
- `manager-dashboard`: Consumes `packages/ui` and `packages/types`. Strictly the view layer for Managers.
- `backend-api`: Exposes REST endpoints. Consumes `packages/database`, `packages/ai-engine`, and `packages/types`.
- `background-workers`: Headless processes managing BullMQ/Redis jobs for AI generation and Meta WhatsApp outbound logic.

## 5. Shared Packages Strategy
By extracting core logic into `packages/`, we ensure DRY (Don't Repeat Yourself) principles.
- **`packages/types`**: Ensures the frontend and backend strictly agree on the shape of a `Task` or `APIError`.
- **`packages/database`**: The ORM client is instantiated once here, ensuring backend-api and background-workers share the exact same schema and connection logic.
- **`packages/ai-engine`**: Isolates LLM prompt versioning and tool definitions from HTTP request handling.

## 6. Configuration Strategy
- Utilize `packages/config/` to store base `tsconfig.json`, `.eslintrc.js`, and `prettierrc`. 
- Apps extend these base configurations. This guarantees that a linting rule applied in the backend is identically enforced in the frontend.

## 7. Environment Variable Strategy
- Utilize a strict schema validator (e.g., `zod`) at application startup.
- `.env.example` committed to version control.
- `.env` ignored.
- Use `dotenv` combined with Turborepo's `eslint-config-turbo` to ensure env vars are explicitly declared in `turbo.json`.

## 8. Documentation Structure
As outlined in `docs/`, documentation lives alongside the code. ADRs (Architecture Decision Records) must be updated whenever a new library or architectural shift is introduced.

## 9. Testing Strategy
- **Unit Tests (`vitest` / `jest`):** Run inside `packages/` focusing on pure functions and AI intent parsing logic.
- **Integration Tests:** Run inside `apps/backend-api` using an ephemeral Docker PostgreSQL database to test endpoints.
- **E2E Tests (`Playwright`):** Run against `apps/manager-dashboard` simulating critical manager workflows.

## 10. Docker Strategy
- Use multi-stage Dockerfiles located in `infra/docker/` to minimize production image sizes.
- A `docker-compose.yml` for local development that spins up PostgreSQL, Redis, and a mock LLM server if necessary.

## 11. CI/CD Directory Structure
- `.github/workflows/ci.yml`: Runs on Pull Requests. Triggers `turbo run lint test build`.
- `.github/workflows/deploy.yml`: Runs on merge to `main`. Deploys apps independently.

## 12. Infrastructure Structure
- `infra/terraform/modules/`: Contains modularized IaC for the database, redis cache, and API gateways.

## 13. Coding Standards
- Strict TypeScript (`strict: true`). No `any` types.
- Functional programming paradigms preferred over classes (except where required by frameworks like NestJS).
- Early returns to avoid deep nesting.

## 14. Naming Conventions
- **Files/Folders:** `kebab-case` (e.g., `task-controller.ts`).
- **Classes/Types:** `PascalCase` (e.g., `interface CreateTaskPayload`).
- **Variables/Functions:** `camelCase` (e.g., `generateAiPlan()`).
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`).

## 15. Branching Strategy
- **Trunk-Based Development:** All feature work branches off `main` and merges back via Pull Requests. Long-lived feature branches are forbidden.
- Branch naming: `feat/AI-task-gen`, `fix/webhook-timeout`, `chore/update-deps`.

## 16. Commit Message Conventions
- Enforce **Conventional Commits** using `commitlint` and `husky` hooks.
- Format: `type(scope): subject` (e.g., `feat(api): add task approval endpoint`).

## 17. Versioning Strategy
- Semantic Versioning (SemVer) managed via `changesets`. This allows automated changelog generation and version bumping for shared packages.

## 18. Dependency Management Strategy
- Use `pnpm` overrides to enforce single versions of critical libraries (e.g., React, Prisma) across the entire monorepo.
- Dependabot enabled for automated security patching.

## 19. Recommended Development Workflow
1. Developer pulls `main`.
2. Runs `pnpm install`.
3. Runs `pnpm run dev` (Turborepo spins up DB in Docker, starts the API, Workers, and Dashboard simultaneously).
4. Developer makes changes, runs `pnpm run test`.
5. Commits following conventions and opens a PR.

## 20. Future Scalability Considerations
The modular monorepo allows us to seamlessly add `apps/employee-mobile-app` or `packages/slack-integration` in the future without touching the core `manager-dashboard` or `backend-api` deployments. 
