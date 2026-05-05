# AGENTS.md — FairShare

## Project Structure

Two independent packages, no workspace tooling:

- `frontend/` — React 19 + TypeScript + Vite app. Entry: `src/main.tsx`
- `backend/` — Python FastAPI server. Entry: `main.py`

## Frontend

### Dev server
```bash
cd frontend && npm install && npm run dev
```
Runs at `http://localhost:5173`.

### Build
```bash
cd frontend && npm run build
```
Runs `tsc -b && vite build`. **TypeScript errors block the build**, including `noUnusedLocals` and `noUnusedParameters` (both enabled in `tsconfig.app.json`).

### Vite plugins required for build
`vite.config.ts` loads four plugins; the WASM/polyfill ones are non-optional because the Cardano Mesh SDK relies on them:
- `@vitejs/plugin-react`
- `vite-plugin-wasm`
- `vite-plugin-top-level-await`
- `vite-plugin-node-polyfills`

Do not remove these or the build will fail with module-resolution errors.

### Environment
`frontend/.env` is already tracked and contains `VITE_BLOCKFROST_API_KEY`.

## Backend

### Run server
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
Or: `python main.py` (convenience wrapper if present).

Runs at `http://localhost:8000`. API docs auto-generated at `/docs`.

### Environment variables
Backend needs a `.env` with:
```env
SUPABASE_URL=<url>
SUPABASE_KEY=<key>
```
The repo currently contains `backend/.env` with values already filled in.

### Architecture notes
- `main.py` mounts routers from `routes/auth.py` (`/api/auth`) and `routes/groups.py` (`/api/groups`).
- `database.py` initializes a Supabase client on import; it will crash at runtime if `SUPABASE_URL`/`SUPABASE_KEY` are missing.
- CORS is wide-open (`allow_origins=["*"]`).

## Testing

No test suite exists in either package yet.

## Lint / Type-check

- Frontend: `npm run lint` (ESLint, flat config in `eslint.config.js`).
- No backend linter/formatter config is present.

## Important conventions

- The frontend calls the backend via hardcoded `http://localhost:8000/api/...` URLs (see `App.tsx` and page components).
- Wallet connection uses `@meshsdk/react` + `@meshsdk/core`. The app wraps the tree in `<MeshProvider>` and imports `@meshsdk/react/styles.css`.
- React StrictMode is enabled.
