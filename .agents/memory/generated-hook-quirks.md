---
name: Generated hook TypeScript quirks
description: Known TS workarounds for Orval-generated React Query hooks in this project
---

## Quirks

1. **`query:` property** — hooks like `useGetMe`, `useGetWallet`, `useGetNotifications` need `// @ts-ignore` before the `query:` line to suppress TS errors about the option type.

2. **useGetTransactions** — takes `{limit: 30}` as the first positional argument (not inside `query:`).

3. **useGetWalletSummary, useGetNotifications** — both exist in generated API; no special treatment needed beyond the `query:` ignore.

**Why:** The Orval-generated types for query options have strict typing that conflicts with how TanStack Query v5 infers generics. The `// @ts-ignore` is the least invasive fix without modifying generated files.
