# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

FairShare is a Splitwise-style expense splitter built on Cardano. See `AGENTS.md` for the original developer guide — this file extends it.

## Layout

Two independent packages, no workspace tooling:

- `frontend/` — React 19 + TypeScript + Vite 8. Entry: `src/main.tsx`. Manually-routed SPA (no React Router); pages live in `src/pages/`, shared chrome in `src/components/`.
- `backend/` — Python FastAPI + Supabase. Entry: `main.py`. Routers in `backend/routes/` (`auth`, `groups`, `expenses`, `notifications`) plus a non-router `utils.py` helper module.

## Commands

Frontend (run from `frontend/`):
| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on `:5173` (proxies `/api/*` → `:8000`) |
| `npm run build` | `tsc -b && vite build` — **tsc errors block the build** |
| `npm run lint` | ESLint flat config (`eslint.config.js`) |
| `npm run preview` | Preview production build |

Backend (run from `backend/`):
```bash
pip install -r requirements.txt
uvicorn main:app --reload      # or: python main.py
```
Serves on `:8000`, auto-docs at `/docs`. Dependencies: `fastapi`, `uvicorn`, `supabase`, `python-dotenv`. No test suite, no CI, no pre-commit hooks in either package.

## Architecture

**SPA + thin API + Cardano + Supabase.** `App.tsx` holds page state and prop-drills to pages. Wallet connection and signing happen client-side via Mesh SDK; the backend never sees private keys. All persistent state (users, groups, expenses, splits, activities, notifications, settlements) lives in Supabase; the backend is a stateless translation layer over PostgREST.

**Auth flow (nonce-based wallet signature):**
1. Client calls `POST /api/auth/nonce` with wallet address.
2. Client signs the returned nonce via `wallet.signData()`.
3. Client calls `POST /api/auth/verify` with the signature **plus the wallet's payment address**; backend verifies and upserts the user, storing both `stake_address` and `payment_address`.

Nonces expire after ~5 minutes. There's no session token — the wallet address is the identity and is passed on subsequent requests. The `payment_address` is what other members send ADA to during settlement (preferred over the stake address in member displays and settle-up flows).

**Settlement flow:** the user constructs and submits a Cardano tx via Mesh SDK directly using `MeshTxBuilder` + `BlockfrostProvider` (no smart contract). On success the client calls `PATCH /api/expenses/settle` with the `tx_hash` to mark splits settled. Settlement is **not atomic** with the on-chain tx — a failed PATCH after a successful tx leaves debts on-chain-paid but app-unsettled. Settled rows are surfaced through `GET /api/expenses/settlements?group_id=...` and rendered in the group's "Transaction History" tab (`GroupDetails.tsx`), linking each `tx_hash` to `preview.cardanoscan.io`.

**Expense splits** are calculated server-side at expense creation (`routes/expenses.py`) as an **equal split across all current `group_members`** — there is no `involved_user_ids` subset. The payer's own split row is inserted with `is_settled=true`. The `/summary` endpoint aggregates these into `you_owe` / `you_are_owed` totals.

**Split recalculation on membership changes.** `backend/routes/utils.py` exposes `recalculate_splits_for_group(group_id)`. It's invoked from the join/leave/remove paths in `routes/groups.py` and rewrites splits for every **unsettled** expense in the group (`tx_status != "settled"`): updates `amount_owed` for existing rows, inserts rows for new members, deletes rows for departed members. Settled expenses are never touched. This is a deliberate split out from `groups.py` to avoid a circular import with `expenses.py`.

**"Pay 1 ADA" group-creation gate is a UI-only stub.** In `pages/CreateGroup.tsx`, the "Pay 1 ADA" button just flips local `hasPaid` state — it does **not** build, sign, or submit a Cardano transaction, and no payment is verified on the backend. Treat this as a placeholder (commit `9a43ff0` added it as an anti-spam shell). If you're asked to "make group creation cost 1 ADA," you're implementing it for the first time, not wiring something existing.

## Backend router mounting (`backend/main.py`)

| Prefix | Router | Notable routes |
|---|---|---|
| `/api` | `auth` | `/api/auth/nonce`, `/api/auth/verify`, `/api/profile`, `/api/profile/by-email` |
| `/api/auth` | `auth` (duplicate include) | Same routes nested as `/api/auth/auth/...` — **known quirk, leave as-is** unless asked to fix. The frontend actually relies on the nested form for `/api/auth/profile` and `/api/auth/profile/by-email`. |
| `/api/groups` | `groups` | group CRUD, `/invites`, `/{id}/join`, `/{id}/invite`, `/{id}/invite/respond`, `/{id}/members/{user_id}`, `/activities` |
| `/api/expenses` | `expenses` | expense CRUD, `PATCH /settle`, `GET /settlements`, `GET /summary` |
| `/api/notifications` | `notifications` | list, mark-read, mark-all-read, delete |

`database.py` instantiates the Supabase client at import time — missing `SUPABASE_URL` / `SUPABASE_KEY` crashes startup, not request time. CORS is wide-open (`allow_origins=["*"]`). `routes/groups.py` exports a `log_activity()` helper that other routers import to write activity-feed rows — keep new mutations consistent with this.

## Frontend quirks

- **Vite plugins are load-bearing.** `vite.config.ts` registers `@vitejs/plugin-react`, `vite-plugin-wasm`, `vite-plugin-top-level-await`, and `vite-plugin-node-polyfills`. Removing any of the latter three breaks Mesh SDK module resolution. `define: { global: 'globalThis' }` is required by Mesh polyfills.
- **Dual API URL pattern.** Code mixes `fetch("/api/...")` (proxy-relative — ~15 call sites, currently the majority) with `fetch("http://localhost:8000/api/...")` (hardcoded — ~8 call sites). Both work in dev because of the Vite proxy; **only the hardcoded form works in a production build**. Pick one and stick with it for new code; if you're adding many calls in one file, prefer a single base-URL helper rather than expanding the inconsistency.
- **Strict TS.** `noUnusedLocals` and `noUnusedParameters` are on — unused imports/vars fail `npm run build`.
- **Mesh provider.** The app tree is wrapped in `<MeshProvider>` in `main.tsx`; `@meshsdk/react/styles.css` is imported there. Blockfrost client lives in `src/utils/provider.ts` and reads `import.meta.env.VITE_BLOCKFROST_API_KEY`. The settle-up flow in `GroupDetails.tsx` instantiates its own `BlockfrostProvider` + `MeshTxBuilder` inline rather than going through `provider.ts`.
- **Member display.** `memberAddress()` / `memberDisplay()` in `GroupDetails.tsx` prefer `payment_address` over `stake_address` — keep that ordering when touching member rendering.

## Environment

Both `.env` files are currently tracked in git (intentional for this academic project — do not "fix" by gitignoring without asking).

- `frontend/.env` — `VITE_BLOCKFROST_API_KEY` (Cardano preview network).
- `backend/.env` — `SUPABASE_URL`, `SUPABASE_KEY`.

Network is Cardano **preview testnet** via Blockfrost. There is no mainnet config.
