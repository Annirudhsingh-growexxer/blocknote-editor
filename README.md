# BlockNote Editor

A full-stack, Notion-like block editor built entirely from scratch, specifically without using any existing block editor frameworks like Slate, Tiptap, or ProseMirror.

## 1. Setup Instructions

The easiest way to run the project locally is via Docker Compose.

1. Ensure you have Docker and docker-compose installed.
2. Clone the repository.
3. Start the containers:
   ```bash
   docker-compose up --build
   ```
4. Access the frontend at `http://localhost:5173/`

*Note: The database schema is automatically seeded via the `backend/src/db/schema.sql` mapped in the docker-compose file.*

## 2. Environment Variables

Reference the provided `.env.example` file. Here is what each variable does:
- `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` / `DB_NAME`: Database connection parameters for PostgreSQL.
- `JWT_SECRET`: Secret key used for signing user authentication and refresh tokens. Must be securely held.
- `VITE_API_URL`: The URL the frontend uses to contact the backend (default: `http://localhost:3001`).
- `PORT`: The backend express server port (default: `3001`).

## 3. Architecture Decisions

- **Custom `contentEditable`**: React state and `contentEditable` do not mix well natively. Instead of relying on controlled inputs bound to state, the block editor uses uncontrolled `contenteditable` divs and only synchronizes text changes to React state aggressively during splits/merges, tracking general changes in an `onInput` ref for the auto-saver. This drastically reduces cursor jumping issues.
- **Raw SQL over ORM**: For a strict requirement like `order_index` floating-point math, an ORM often hides the underlying structural behavior. Writing raw parameterized SQL strings with `pg` guarantees control over integer vs. float parsing during reorder renormalization.
- **REST / Polling Auto-save**: Kept the architecture strictly HTTP/REST based. Used `keepalive` and `AbortController` to handle auto-saves rather than WebSockets, as the requirements specifically noted "no real-time collaboration".

## 4. Known Issues

- **Mobile keyboards**: Virtual keyboards (like Safari iOS) occasionally try to inject DOM elements like `<span>` inside `contentEditable` when doing auto-correction, which the current `contentEditable` scrubber might not catch elegantly. (Tested primarily on Chrome Desktop).
- **Extremely fast dragging**: React-DnD sometimes drops frame lag if dragging blocks highly aggressively.
- **Deep nesting backspacing**: Currently, there's no rich markdown shortcut parsing besides the explicit `/` block command handler.

## 5. Edge Case Decisions

- **Enter mid-block split**: The system explicitly slices the string manually at the `Selection API` cursor offset, fires a `PATCH` update instantly on the existing block string payload, and sends a `POST` request to create the second half block right beneath it. This prevents the auto-save from writing full strings and discarding typed words right before unmounting.
- **Backspace on first block**: Prevented explicitly. No action occurs, ensuring the document cannot enter a "zero block state" which breaks formatting.
- **Backspace when previous block is a divider or image**: Because cursors cannot go organically *into* a divider, pressing backspace deletes the non-text block outright while keeping your cursor securely docked in the current text block.
- **Slash menu text bleed**: The keydown event intercepts `/` using `e.preventDefault()`. The slash is never rendered to the actual DOM so it never has to be stripped via regex later.
- **Order index precision**: All operations insert items at `(a + b) / 2`. A server middleware checks if `gap < 0.001` per document batch operation, renormalizes into integers sequentially via a PostgreSQL loop, and forces the frontend to fetch the fresh normalized blocks array.
- **Share token read-only**: Enforced strictly via a global middleware on the `/api/blocks` route. If `x-share-token` is present in headers, any method besides HTTP GET will immediately throw a 403 Forbidden.
- **Auto-save race condition**: `AbortController` cleanly breaks fetch promises on the client in the event of congestion overlapping, backed by backend `BEGIN` / `COMMIT` transactions to ensure database rows aren't left half-written.
- **Document ownership**: Assertions explicitly `JOIN documents ... WHERE blocks.id = $1` taking the `user_id` mapping to ensure no malicious JWT holder can PATCH a block they don't own (Tested and throws `403`).
