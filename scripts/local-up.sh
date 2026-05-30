#!/usr/bin/env sh
# Suggested local services — run manually after approval (deployment-safety).
set -e
docker compose up -d
echo "Postgres: localhost:5432 | DynamoDB Local: localhost:8000"
echo "Then: cp .env.example .env && pnpm install"
echo "Then (user): pnpm --filter @conversational-ai/database prisma migrate dev"
