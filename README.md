# Conversational AI Platform SaaS

Multi-tenant conversational AI platform (serverless AWS, Next.js, Bedrock).

## Phase 1 status

Infrastructure foundation scaffold: monorepo, local Docker, Terraform modules, Cognito/API health, observability package, CI workflows.

**Deploy to AWS:** follow [docs/runbooks/phase1-deploy-handoff.md](docs/runbooks/phase1-deploy-handoff.md) (manual, approval required).

## Phase 2 status

Core AI runtime (local): `packages/ai-runtime`, `packages/tool-registry`, `packages/session-store`, chat/session API routes, SSE stream, Step Functions module, web `/chat` UI.

- Architecture: [docs/architecture/phase2-ai-runtime.md](docs/architecture/phase2-ai-runtime.md)
- API: [docs/api/v1-chat.md](docs/api/v1-chat.md)
- Local: `pnpm dynamodb:setup` then `pnpm --filter @conversational-ai/api dev` (see `.env.example`)

## Quick start (local)

```bash
pnpm install
cp .env.example .env
docker compose up -d   # you run this
pnpm --filter @conversational-ai/database prisma migrate dev   # you run this
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:3001/v1/health

## Docs

- [docs/README.md](docs/README.md)
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)

## Scripts

| Command          | Description        |
| ---------------- | ------------------ |
| `pnpm test`      | Vitest             |
| `pnpm lint`      | ESLint             |
| `pnpm typecheck` | TypeScript         |
| `pnpm -r build`  | Build all packages |
