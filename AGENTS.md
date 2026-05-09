# AGENTS.md — FairShare

## Project layout

Two independent packages, no workspace tooling:

- `frontend/` — React 19 + TypeScript 6.0 + Vite 8. Entry: `src/main.tsx`
- `backend/` — Python FastAPI server. Entry: `main.py`

## Frontend

### Commands (run from `frontend/`)
| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on `:5173` |
| `npm run build` | `tsc -b && vite build` — **tsc errors block build** |
| `npm run lint` | ESLint flat config (`eslint.config.js`) |
| `npm run preview` | Vite preview of production build |

`noUnusedLocals` and `noUnusedParameters` are enabled — unused imports/vars are build errors.

### Vite config quirks (`vite.config.ts`)
- Four required plugins: `@vitejs/plugin-react`, `vite-plugin-wasm`, `vite-plugin-top-level-await`, `vite-plugin-node-polyfills`. Removing any breaks the Cardano Mesh SDK module resolution.
- `define: { global: 'globalThis' }` — needed by Mesh polyfills.
- **Proxy**: `/api/*` → `http://localhost:8000`. The frontend uses both the proxy (`/api/...`) AND direct hardcoded URLs (`http://localhost:8000/api/...`) inconsistently. Both work in dev; only hardcoded URLs work in production.

### Wallet / blockchain
- Uses `@meshsdk/react`, `@meshsdk/core`, `@meshsdk/wallet`.
- App tree wrapped in `<MeshProvider>` (in `main.tsx`), imports `@meshsdk/react/styles.css`.
- Login: nonce-based Cardano wallet signature flow (`POST /api/auth/nonce` → `wallet.signData()` → `POST /api/auth/verify`).
- Blockfrost provider at `src/utils/provider.ts` reads `import.meta.env.VITE_BLOCKFROST_API_KEY`.

### Environment
- `frontend/.env` tracked — contains `VITE_BLOCKFROST_API_KEY`.

## Backend

### Commands (run from `backend/`)
```bash
pip install -r requirements.txt
uvicorn main:app --reload        # or python main.py
```
Runs on `:8000`, API docs at `/docs`.

Dependencies: `fastapi`, `uvicorn`, `supabase`, `python-dotenv`.

### Router mounting (`backend/main.py`)
| Prefix | Router | Routes |
|---|---|---|
| `/api` | `auth` | `/api/auth/nonce`, `/api/auth/verify`, `/api/profile`, `/api/profile/by-email` |
| `/api/auth` | `auth` | duplicate — same routes nested under `/api/auth/auth/...` (likely a bug, leave as-is) |
| `/api/groups` | `groups` | group CRUD, invites, members, activities |
| `/api/expenses` | `expenses` | expense CRUD, splits, `/summary` |

### Environment
`backend/.env` needs `SUPABASE_URL` and `SUPABASE_KEY`. Both are currently filled in and tracked (`.env` is **not** gitignored for backend).

`database.py` creates the Supabase client at module import — crashes at startup if env vars are missing.

CORS wide-open (`allow_origins=["*"]`).

### No tests, no CI, no pre-commit hooks exist in either package.
