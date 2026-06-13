# BetRoyal — Betting & Casino Platform

A production-ready, mobile-first betting and casino platform with a dark luxury aesthetic (black + gold), live jackpot counters, a full game lobby, wallet system, bonuses, referrals, and an admin panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/betting-app run dev` — run the frontend (port 24735)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + TailwindCSS + Framer Motion + Wouter (routing) + TanStack Query
- API: Express 5 + JWT authentication (bcryptjs + jsonwebtoken)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `lib/api-zod/src/generated/` — Generated Zod validation schemas
- `lib/db/src/schema/` — Drizzle ORM schema files
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/betting-app/src/` — React frontend

## Architecture decisions

- JWT auth with short-lived access tokens (15m) and long-lived refresh tokens (30d). Tokens stored in localStorage on the client.
- Game results are simulated server-side using RTP-based probability. Real game providers would replace the `placeBet` handler.
- Jackpot counters are ephemeral in-memory state that tick up over time — they reset on server restart. A real implementation would use Redis or a DB.
- All numeric values (balances, bets, RTPs) are stored as `numeric` (decimal) in PostgreSQL to avoid floating-point precision issues.
- Admin routes are protected by both `authenticate` + `requireAdmin` middleware.

## Product

- **Home**: Hero banner, animated jackpot counters (MINI/MINOR/MAJOR/GRAND), live public bets feed, platform stats
- **Game Lobby**: 22+ games across Slots, Live Casino, Crash, Mines, Dice, Plinko, Limbo, Keno, Coin Flip, Lucky Wheel, Fishing, Cards, Blockchain
- **Wallet**: Main + bonus balance, deposit/withdraw, full transaction history
- **Bonuses**: Welcome, first deposit, cashback, daily, VIP, referral bonuses with wager progress tracking
- **Referrals**: Referral code + link, earnings summary, referred users list
- **Profile**: Personal info, KYC submission, bet stats, VIP level
- **Admin Panel**: Stats dashboard (Recharts), user management, game settings, bonus management, transaction log, daily reports

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` before leaf artifact typechecks if you change `lib/*` schema or API spec
- After any OpenAPI spec change, re-run `pnpm --filter @workspace/api-spec run codegen`
- The API server must be restarted (`restart_workflow`) after code changes — it builds with esbuild before starting
- `req.params.id` in Express 5 types may appear as `string | string[]` — always wrap with `String()` before `parseInt()`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
