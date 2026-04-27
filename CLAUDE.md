# WealthView TH — Claude project memory

Personal/family wealth-management SaaS for Thai users. Next.js 14 App Router + Supabase + TypeScript strict.

## How to run things

```
pnpm dev          # local dev server
pnpm test         # jest unit
pnpm e2e          # playwright (needs `pnpm exec playwright install` once)
pnpm lint
pnpm build
pnpm exec tsc --noEmit
```

Always run `pnpm lint && pnpm exec tsc --noEmit && pnpm test` before claiming a task complete.

## Project conventions (don't break these)

**Soft delete.** Every query against `assets`, `liabilities`, `transactions` filters `.is("deleted_at", null)`. Deletion goes through `soft_delete_*` Supabase RPCs — never `.delete()` directly.

**Audit logging.** Every mutating server action calls `logAudit(action, entity, id, { diff })` from `@/lib/audit` after the write succeeds. Best-effort: failure must not throw.

**Logging.** Use `import { logger } from "@/lib/logger"` (Pino). No `console.log` / `console.error` in `src/lib/**` or `src/app/api/**`.

**Premium gate.**
- Server: `requirePremium(feature)` from `@/lib/subscription/server` — throws PremiumRequiredError.
- Client: `useSubscription().canAccess(feature)` or wrap with `<PremiumGate>` from `@/components/subscription/PremiumGate`.
- `subscription/server.ts` is server-only; importing it from a client component breaks the build. Import types from `@/lib/subscription` (re-exports `./types`).

**API versioning.** New endpoints go under `/api/v1/`. Handler logic lives in `src/lib/api/handlers/` so `/api/market/*` (deprecated, sunset 2026-09-01) and `/api/v1/market/*` share the same code. Don't duplicate handler bodies.

**Rate limiting.** `getClientKey({ userId, clientIp })` prefers user_id over IP. Always pass `userId: user.id` from authed routes.

**Zustand totals.** Use `selectTotalAssets`, `selectTotalLiabilities`, `selectNetWorth`, or the `useNetWorth()` hook. Don't reintroduce a `subscribe()` recompute loop on the store — it triggers cascading renders.

**Migrations.** Sequential numbering (`000XX_description.sql`). Never edit a migration that has been applied to staging/prod — add a new one.

## Architecture pointers

- Auth + redirect: `src/middleware.ts`
- Server actions: `src/lib/actions/*`
- Market gateway (3-layer cache): `src/lib/market/gateway.ts`
- Background jobs: `src/trigger/` (Trigger.dev v3)
- Sentry: only enabled when `NEXT_PUBLIC_SENTRY_DSN` is set
- OpenAPI spec: `src/lib/openapi/spec.ts` (single source of truth — `/api/v1/docs` reads it)

## Things that are intentional (don't "fix")

- `pnpm-workspace.yaml` + empty `packages/` — reserved for future API extraction; leave alone.
- `category` / `type` columns are constrained enums (see types in `src/types/`). Don't widen to `string`.
- `useSubscription` does NOT auto-refetch the profile — it reads from the Zustand store, hydrated once at dashboard mount.

## When working on PRs

- Branch names: `feature/<short>`, `fix/<short>`, `chore/<short>`
- Don't push directly to `main`
- PR description must list user-visible changes + risk level + how to test
- For DB changes: include the migration file AND any code that depends on it in the same PR
- Don't bump dependency majors as part of an unrelated PR
