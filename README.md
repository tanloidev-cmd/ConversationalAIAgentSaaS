# Conversational AI Platform SaaS

Multi-tenant conversational AI platform (serverless AWS, Next.js, Bedrock).

## Phase 1 status

Infrastructure foundation scaffold: monorepo, local Docker, Terraform modules, Cognito/API health, observability package, CI workflows.

**Deploy to AWS:** follow [docs/runbooks/phase1-deploy-handoff.md](docs/runbooks/phase1-deploy-handoff.md) (manual, approval required).

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
