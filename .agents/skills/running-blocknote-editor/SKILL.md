# Running & Testing BlockNote Editor

Full-stack app: React + Vite frontend, Express backend, Postgres. Runs via docker-compose.

## Start the stack

```bash
# From repo root. Requires a .env (DB_PASSWORD / JWT_SECRET / VITE_API_URL).
docker compose up --build -d
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001 (`GET /` returns 404 — that's normal; all routes are under `/api`)
- DB: Postgres 15 at localhost:5432 (user `blocknote`, db `blocknote_dev`)

Schema auto-seeds from `backend/src/db/schema.sql` on first DB start.

Logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## App routes & auth

- `/register`, `/login`: email + password forms. On success, JWT is stored in `localStorage.accessToken` and the app navigates to `/dashboard`.
- `/dashboard`: sidebar with documents + editor pane. `activeDocumentId` is persisted in `localStorage` so a refresh reopens the same doc.
- `/share/:token`: read-only shared view (enforced by `x-share-token` middleware on `/api/blocks`).

For automated flows, register a test user via the API:

```bash
curl -s -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"tester@example.com","password":"password123"}'
```

## Editor internals (useful for testing)

- **Block types** (see `frontend/src/components/editor/SlashMenu.jsx`): `paragraph`, `heading_1`, `heading_2`, `todo`, `code`, `divider`, `image`. Insert via `/` + filter (e.g. `/heading 1`, `/todo`, `/code`) then Enter.
- **Auto-save** (`frontend/src/hooks/useAutoSave.js`): 1-second debounce after last edit, fires `PATCH /api/documents/:id` with `blocks` + `lastKnownUpdatedAt`. `SaveIndicator` cycles `Saving…` → `Saved` (2s) → idle.
- **Title edit:** click the pencil icon next to the title. Enter or blur commits via a separate `PATCH /api/documents/:id`.
- **Code block quirk:** inside a `code` block, `Enter` inserts a newline and `/` does NOT open the slash menu. There is no obvious way to add a new block *after* a trailing code block — if you need another block below, add it before converting the last block to `code`.

## Known auto-save race (false-positive 409)

If you type quickly right after creating a document, changing the title, or changing a block type, the client can PATCH with a stale `lastKnownUpdatedAt` and the backend returns 409. The UI shows a red `This document changed in another tab. Reload to avoid overwriting newer edits.` banner even in a single tab. Clicking **Reload** refetches the server state and **discards any in-memory blocks that weren't yet persisted**. When scripting tests, pace typing (≥1.5s between multi-block batches and Reload after any `PATCH` title update) to avoid this.

## Verifying persistence directly

The strongest check that auto-save worked is to query the backend, not just reload the UI:

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"tester@example.com","password":"password123"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["accessToken"])')
DOC_ID=$(curl -s http://localhost:3001/api/documents -H "Authorization: Bearer $TOKEN" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)[0]["id"])')
curl -s http://localhost:3001/api/documents/$DOC_ID -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

## Lint

```bash
(cd frontend && npm run lint)
```

There is no automated test suite in the repo.
