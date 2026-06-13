---
name: Direct fetch pattern for non-OpenAPI routes
description: New backend routes added outside OpenAPI spec use direct fetch with BASE_URL prefix
---

## Pattern
Routes added after OpenAPI codegen (notifications, leaderboard, achievements, daily-bonus, pending-deposits) are NOT in the generated hooks. Call them directly:

```ts
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const token = localStorage.getItem("token");

fetch(`${BASE}/api/notifications`, {
  headers: { Authorization: `Bearer ${token}` }
})
```

**Why:** Running `pnpm --filter @workspace/api-spec run codegen` after every new route is expensive. For simple CRUD endpoints, direct fetch is faster to ship and avoids regenerating all hooks.

**How to apply:** Any new route not in openapi.yaml should use this pattern on the frontend. If the route becomes stable/complex, add it to the spec and regenerate.
