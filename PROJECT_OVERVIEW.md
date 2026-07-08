# Project Overview: useAxiom

## Project Summary & Vision
**useAxiom** is an enterprise SaaS platform acting as an AI-powered project management and execution agent. The core philosophy is simple: **Managers make decisions; AI executes those decisions.** Employees do not use a dashboard—they communicate entirely through WhatsApp, making the platform virtually frictionless for the workforce.

## Architecture Summary
- **Backend:** Node.js (TypeScript) + Express/NestJS in a Modular Monolith architecture.
- **Frontend:** React (Vite) + Tailwind CSS (Manager Dashboard SPA).
- **Database:** PostgreSQL (Core Data) + Redis (Queues & Caching).
- **AI/Workers:** BullMQ background workers processing LLM requests (OpenAI/Gemini) and WhatsApp webhooks.
- **Monorepo:** Managed via pnpm workspaces and Turborepo.

## Folder Structure
See `/docs/04-architecture/repository-architecture.md` for the full breakdown.
- `apps/`: Deployable frontend and backend applications.
- `packages/`: Shared types, UI components, DB schemas, and AI configurations.
- `docs/`: Master repository for product and engineering documentation.
- `infra/`: Docker, Terraform, and Kubernetes configurations.

## Team Structure & Sprint Roadmap
The project is divided into 5 business domains: Platform, AI System, Dashboard, WhatsApp Gateway, and Data Core. 
- See `/docs/08-team/team-responsibilities.md` for domain assignments.
- See `/docs/07-development/sprint-plan.md` for the execution roadmap.

## Documentation Index
The central knowledge base is located at `/docs/README.md`.

## Quick Start for Developers
1. Ensure `pnpm`, `Node.js 20+`, and `Docker` are installed.
2. Clone the repository and run `pnpm install`.
3. Read the onboarding guide: `/docs/08-team/onboarding.md`.
4. Run `pnpm dev` to spin up local infrastructure.

## Contribution Guidelines
Please read `CONTRIBUTING.md` for branching strategies, PR templates, and coding standards.
