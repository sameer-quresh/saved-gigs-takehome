# Saved Gigs — Take-Home

Monorepo scaffold for the Saved Gigs take-home assignment.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for Postgres)

## Setup

```bash
pnpm install
cp .env.example .env
pnpm --filter shared build
```

## Database

```bash
pnpm db:up          # start Postgres via Docker
pnpm db:migrate     # scaffold only — migration pending
pnpm db:seed        # scaffold only — seed pending
```

## Development

```bash
pnpm --filter shared dev   # watch-build shared package
pnpm --filter backend dev  # API on http://localhost:3001
pnpm --filter web dev      # web on http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run backend tests (Vitest) |
| `pnpm build` | Build shared, backend, and web |

## Packages

| Package | Description |
|---|---|
| `shared` | TypeBox schemas, response DTOs, domain enums |
| `backend` | Express + Kysely API |
| `web` | Next.js App Router frontend |

See [`TASK.md`](TASK.md) and [`CONVENTIONS.md`](CONVENTIONS.md) for the full spec.
