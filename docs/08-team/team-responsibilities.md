# Team Responsibilities & Implementation Guides

To ensure parallel development with minimal bottlenecks, ownership is divided by business domains rather than purely frontend/backend splits.

## Developer 1: Platform & Infrastructure
- **Domain:** Monorepo architecture, CI/CD, Docker, Database Migrations, Auth Core.
- **Responsibilities:** Setting up Turborepo, configuring Prisma/TypeORM, writing the RBAC middleware, and managing deployment pipelines.
- **Key Docs:** `repository-architecture.md`, `database-design.md` (Sections 1, 4.1, 4.2).
- **Integration Points:** Provides the database client and Auth APIs for the rest of the team.

## Developer 2: AI & Agent System
- **Domain:** AI Orchestrator, LLM Integration, BullMQ Workers.
- **Responsibilities:** Building the background worker fleet. Writing prompts and tool-calls for the Planner and Assignment agents. 
- **Key Docs:** `ai-agent-design.md`, `api-specification.md` (Section 5).
- **Integration Points:** Consumes Project data from Dev 5; feeds status updates to Dev 4.

## Developer 3: Manager Dashboard
- **Domain:** React (Vite) Frontend SPA.
- **Responsibilities:** Building the UI components (Tailwind), managing state (React Query), and wiring up the API endpoints for the Manager experience.
- **Key Docs:** `ux-product-flows.md`, `api-specification.md`.
- **Integration Points:** Strictly consumes APIs built by Devs 1, 2, and 5.

## Developer 4: WhatsApp & Notifications
- **Domain:** Meta API Webhooks, Conversational State, Notifications.
- **Responsibilities:** Handling inbound webhook security, pushing payloads to Redis, parsing intent, and sending daily summaries.
- **Key Docs:** `database-design.md` (Section 10), `api-specification.md` (Section 6).
- **Integration Points:** Highly dependent on Dev 1's Redis infrastructure and Dev 2's intent classification models.

## Developer 5: Projects, Tasks & Analytics
- **Domain:** Execution Core API.
- **Responsibilities:** Implementing the core business logic and APIs for Projects, Milestones, Tasks, and Manager Approvals.
- **Key Docs:** `database-design.md` (Section 4.3, 4.4), `api-specification.md` (Section 4).
- **Integration Points:** Provides the core data structures that the AI (Dev 2) and Dashboard (Dev 3) manipulate.
