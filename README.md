# BlockNote Editor

A full-stack, Notion-like block editor built entirely from scratch — no Slate, Tiptap, or ProseMirror. Custom `contenteditable` React frontend, Express REST backend, PostgreSQL database, all wired together via Docker Compose.

---

## Table of Contents

1. [Setup Instructions](#1-setup-instructions)
2. [Environment Variables](#2-environment-variables)
3. [Architecture Decisions](#3-architecture-decisions)
4. [Known Issues](#4-known-issues)
5. [Edge Case Decisions](#5-edge-case-decisions)

---

## 1. Setup Instructions

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) ≥ 20.x
- [docker-compose](https://docs.docker.com/compose/install/) ≥ 1.29 (or Docker Desktop which bundles it)

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd blocknote-editor

# 2. Create your local .env file from the example
cp .env.example .env

# 3. Fill in the required secrets (see Section 2)
nano .env   # or your preferred editor

# 4. Build and start all services (db + backend + frontend)
docker-compose up --build

# 5. Open the app
#    Frontend → http://localhost:5173
#    Backend API → http://localhost:3001
```

> **First run note:** Docker will automatically apply `backend/src/db/schema.sql` to the PostgreSQL instance on initial startup via the `docker-entrypoint-initdb.d` mechanism. No manual migration step required.

### Stopping the Stack

```bash
docker-compose down          # stops containers, keeps DB volume
docker-compose down -v       # stops containers AND deletes DB volume (full reset)
```

### Running Without Docker (manual dev mode)

If you prefer to run services individually:

```bash
# Terminal 1 – Start PostgreSQL locally and apply schema manually
psql -U <your_pg_user> -f backend/src/db/schema.sql

# Terminal 2 – Backend
cd backend
npm install
npm run dev     # starts on port 3001

# Terminal 3 – Frontend
cd frontend
npm install
npm run dev     # starts Vite on port 5173
```

---

## 2. Environment Variables

Copy `.env.example` to `.env` and fill in values before starting the stack.

| Variable | Required | Default (docker-compose) | Description |
|---|---|---|---|
| `DB_PASSWORD` |  Yes | _(none)_ | Password for the `blocknote` PostgreSQL user. Set to any strong string locally. |
| `JWT_SECRET` |  Yes | _(none)_ | Secret used to sign and verify JWT access tokens and refresh tokens. Must be at least 32 characters. Generate with: `openssl rand -hex 32` |
| `VITE_API_URL` |  Yes | `http://localhost:3001` | The base URL the frontend uses to reach the backend API. Baked into the Vite build at compile time. |
| `DB_USER` | Set by compose | `blocknote` | PostgreSQL username. Hard-coded in `docker-compose.yml`; only needed if running manually. |
| `DB_HOST` | Set by compose | `db` (Docker service name) | PostgreSQL hostname. When manual, use `localhost`. |
| `DB_PORT` | Set by compose | `5432` | PostgreSQL port. |
| `DB_NAME` | Set by compose | `blocknote_dev` | Database name created by Postgres on first boot. |
| `PORT` | Set by compose | `3001` | Express server listening port. |
| `FRONTEND_URL` | Set by compose | `http://localhost:5173` | Used by the backend for CORS `Access-Control-Allow-Origin`. |
| `NODE_ENV` | Set by compose | `development` | Node environment. Set to `production` for a production deploy. |

> **Important:** `VITE_API_URL` is the only variable that must be set in your `.env` for the frontend Docker build — Vite reads it at **build time**, not runtime. If you change this after building, you must rebuild the frontend container.

---

## 3. Architecture Decisions

### Stack Summary

| Layer | Technology | Why |
|---|---|---|
| Frontend | React + Vite | Fast HMR dev loop; no framework overhead needed beyond component model |
| Editor core | Custom `contenteditable` | Requirement: no third-party editor framework |
| Backend | Node.js + Express | Lightweight, easy REST setup; no GraphQL complexity needed |
| Database | PostgreSQL 15 | Relational integrity for document/block ownership; `NUMERIC` type for order index precision |
| Auth | JWT (access + refresh) | Stateless; pairs cleanly with REST |
| Infra | Docker Compose | Single-command local dev; easy to hand off between developers |

### Key Technical Choices

**Custom `contenteditable` over managed editors**
React's reconciler and `contenteditable` conflict by design — React wants to own the DOM, `contenteditable` lets the browser own it. The editor avoids controlled inputs entirely: blocks use uncontrolled `contenteditable` divs, and React state is only updated on explicit events (split, merge, blur, slash command). This eliminates cursor-jumping and ghost-character bugs that plague naive implementations.

**Raw SQL over an ORM**
The `order_index` system relies on floating-point midpoint insertion (`(a + b) / 2`). ORMs abstract away cast behavior and may silently coerce `NUMERIC` columns to JavaScript floats, truncating precision. Writing raw parameterized queries with `node-postgres` (`pg`) gives direct control over what arrives as `NUMERIC` from the DB and when renormalization triggers.

**REST + AbortController over WebSockets**
The spec explicitly excluded real-time collaboration, making WebSockets unnecessary overhead. HTTP with `keepalive: true` and `AbortController`-based request cancellation provides reliable auto-save semantics without maintaining a persistent connection. Each save is an independent idempotent `PATCH`; the backend wraps each in a `BEGIN`/`COMMIT` transaction.

**Share tokens as read-only middleware**
Rather than embedding permission logic inside each individual route handler, a single Express middleware inspects the `x-share-token` header globally on `/api/blocks`. Any non-GET method is rejected with `403 Forbidden`. This is safer than per-handler checks because new routes get protection automatically.

**Floating-point order index with server-side renormalization**
Block reordering uses the midpoint strategy to avoid updating sibling `order_index` values on every drag. When the gap between adjacent indices shrinks below `0.001`, a server-side PostgreSQL loop renormalizes the entire document's blocks to clean integers and returns the refreshed array to the frontend, which replaces its local state.

---

## 4. Known Issues

| # | Area | Description |
|---|---|---|
| 1 | **Mobile keyboards** | Virtual keyboards (iOS Safari in particular) inject `<span>` and `<br>` elements into `contenteditable` during autocorrect. The current DOM scrubber handles most cases but may miss unusual autocorrect sequences. Tested and optimized on Chrome Desktop only. |
| 2 | **Drag-and-drop frame drops** | React-DnD can produce visible lag when blocks are dragged very aggressively in rapid succession. The ordering logic is correct but the visual drag preview may stutter under heavy stress. |
| 3 | **No rich markdown shortcuts** | Beyond the `/` slash-command menu, there are no inline markdown shortcuts (e.g., typing `**bold**` does not auto-format). Only explicit block-type switching via the slash menu is supported. |
| 4 | **No image upload persistence** | Image blocks accept a URL input; there is no file upload storage backend. Pasting a direct image URL works; uploading a local file does not. |
| 5 | **Refresh token rotation not implemented** | JWTs are issued but the refresh token endpoint does not rotate the refresh token on each use, which is a security best practice for production deployments. |
| 6 | **No offline support** | Auto-save requires an active network connection. No local draft fallback (e.g., `localStorage` queue) exists; edits made while disconnected are lost on page close. |

---

## 5. Edge Case Decisions

| Edge Case | Decision |
|---|---|
| **Enter mid-block (cursor not at end)** | The text at the cursor is split manually via the Selection API: the existing block is `PATCH`ed with the left half instantly, and a `POST` creates the right half as a new block beneath — preventing the auto-saver from overwriting the split with stale full text. |
| **Backspace on the first block** | Explicitly blocked — no action is taken — to prevent the document entering a zero-block state, which would break all block-relative cursor math and render logic. |
| **Backspace when the previous block is a divider or image** | The non-text block is deleted outright and the cursor stays in the current text block, because a cursor cannot organically enter a structurally void block (divider/image). |
| **Slash `/` character bleeding into block content** | The `keydown` event on `/` calls `e.preventDefault()` before the character has a chance to enter the DOM, so the slash never needs to be stripped from block text retroactively. |
| **Order index precision exhaustion** | When any gap between adjacent `order_index` values falls below `0.001`, a PostgreSQL loop renormalizes the entire document's indices to sequential integers and the frontend replaces local block state with the fresh server response. |
| **Shared document write attempts** | A global Express middleware on `/api/blocks` checks for `x-share-token`; any method other than `GET` immediately returns `403 Forbidden`, enforcing strict read-only access for share link viewers. |
| **Auto-save race conditions (rapid typing or 409 conflicts)** | `AbortController` cancels any in-flight save before a new one fires; the backend wraps every mutation in `BEGIN`/`COMMIT` to prevent half-written rows, and a server-side `updated_at` timestamp guard rejects stale writes with `409 Conflict`. |
| **Block ownership spoofing** | Every block mutation query performs a `JOIN documents WHERE user_id = $jwt_user_id`, ensuring a valid JWT holder cannot modify blocks in documents they do not own (returns `403` on mismatch). |
