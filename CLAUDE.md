# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

FairShare is a Splitwise-style expense splitter built on Cardano. See `AGENTS.md` for the original developer guide — this file extends it.

## Layout

Two independent packages, no workspace tooling:

- `frontend/` — React 19 + TypeScript + Vite 8. Entry: `src/main.tsx`.
- `backend/` — Python FastAPI + Supabase. Entry: `main.py`.

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

**SPA + thin API + Cardano + Supabase.** Frontend is a manually-routed SPA (no React Router) — `App.tsx` holds page state and prop-drills to pages in `src/pages/`. Wallet connection and signing happen client-side via Mesh SDK; the backend never sees private keys. All persistent state (users, groups, expenses, splits, activities, notifications) lives in Supabase; the backend is a stateless translation layer over PostgREST.

**Auth flow (nonce-based wallet signature):**
1. Client calls `POST /api/auth/nonce` with wallet address.
2. Client signs the returned nonce via `wallet.signData()`.
3. Client calls `POST /api/auth/verify` with the signature; backend verifies and upserts the user.

Nonces expire after ~5 minutes. There's no session token — the wallet address is the identity and is passed on subsequent requests.

**Settlement flow:** the user constructs and submits a Cardano tx via Mesh SDK directly (no smart contract). On success the client calls `PATCH /api/expenses/settle` with the `tx_hash` to mark splits settled. Settlement is **not atomic** with the on-chain tx — a failed PATCH after a successful tx leaves debts on-chain-paid but app-unsettled.

**Expense splits** are calculated server-side at expense creation (equal split across `involved_user_ids`) and written to `expense_splits` rows. The `/summary` endpoint aggregates these into `you_owe` / `you_are_owed` totals.

## Backend router mounting (`backend/main.py`)

| Prefix | Router | Notable routes |
|---|---|---|
| `/api` | `auth` | `/api/auth/nonce`, `/api/auth/verify`, `/api/profile`, `/api/profile/by-email` |
| `/api/auth` | `auth` (duplicate include) | Same routes nested as `/api/auth/auth/...` — **known bug, leave as-is** unless asked to fix |
| `/api/groups` | `groups` | group CRUD, invites, members, `/activities` |
| `/api/expenses` | `expenses` | expense CRUD, `PATCH /settle`, `/summary` |
| `/api/notifications` | `notifications` | list, mark-read, mark-all-read |

`database.py` instantiates the Supabase client at import time — missing `SUPABASE_URL` / `SUPABASE_KEY` crashes startup, not request time. CORS is wide-open (`allow_origins=["*"]`).

## Frontend quirks

- **Vite plugins are load-bearing.** `vite.config.ts` registers `@vitejs/plugin-react`, `vite-plugin-wasm`, `vite-plugin-top-level-await`, and `vite-plugin-node-polyfills`. Removing any of the latter three breaks Mesh SDK module resolution. `define: { global: 'globalThis' }` is required by Mesh polyfills.
- **Dual API URL pattern.** Code calls `fetch("/api/...")` in some places and `fetch("http://localhost:8000/api/...")` in others. Both work in dev because of the Vite proxy; **only the hardcoded form works in a production build**. When adding new calls, prefer the hardcoded `http://localhost:8000` form to match the dominant existing pattern, or factor through a single base-URL helper.
- **Strict TS.** `noUnusedLocals` and `noUnusedParameters` are on — unused imports/vars fail `npm run build`.
- **Mesh provider.** The app tree is wrapped in `<MeshProvider>` in `main.tsx`; `@meshsdk/react/styles.css` is imported there. Blockfrost client lives in `src/utils/provider.ts` and reads `import.meta.env.VITE_BLOCKFROST_API_KEY`.

## Environment

Both `.env` files are currently tracked in git (intentional for this academic project — do not "fix" by gitignoring without asking).

- `frontend/.env` — `VITE_BLOCKFROST_API_KEY` (Cardano preview network).
- `backend/.env` — `SUPABASE_URL`, `SUPABASE_KEY`.

Network is Cardano **preview testnet** via Blockfrost. There is no mainnet config.
