---
name: BetRoyal bKash deposit flow
description: Manual mobile banking deposit system — merchant number, TxID submission, admin approval
---

## Flow
1. User selects bKash/Nagad/Rocket → shown merchant number +8801944265045
2. User sends money to merchant, enters TxID + optional sender number
3. POST /api/wallet/deposit with `{ amount, method, txId, senderNumber }` → creates row in `pending_deposits` table with status="pending"
4. Admin visits /admin/deposits → sees all pending deposits → approve/reject
5. On approve: POST /api/admin/pending-deposits/:id/approve → credits user balance + creates transaction record

## Key files
- `artifacts/api-server/src/routes/wallet.ts` — MERCHANT constant, deposit route handles both manual (pending) and direct flows
- `artifacts/betting-app/src/pages/wallet.tsx` — full bKash UX with merchant number display, TxID field, pending list
- `artifacts/betting-app/src/pages/admin/deposits.tsx` — admin approve/reject UI
- `lib/db/src/schema/` — pending_deposits table

**Why:** Bangladeshi users primarily use mobile banking. Real card/crypto integration would require third-party providers; this manual flow lets the platform operate without them.
