# AI Interaction Log

## 2026-04-13
**Tool:** ChatGPT (GPT-4o)
**What I asked for:**
I needed to set up the authentication boilerplate using Express and jsonwebtoken. I asked it to write a user register and login route.

**What it generated:**
It wrote a standard set of routes using `bcrypt` and `jwt.sign`. However, it stored the JWT in local storage directly via the response payload, completely ignoring the refresh token implementation requirement.

**What was wrong or missing:**
It didn't implement a refresh token as specified.

**What I changed and why:**
I manually modified the payload to issue two tokens. I placed the refresh token strictly inside an HTTP-only secure cookie, and kept the access token in the JSON response payload. **(Manual choice):** I wrote the Refresh token rotation route completely manually because I didn't want to risk the AI botching the cookie `maxAge` configurations or the explicit 15m/7d expiry differences. I also added explicit email/password regex verifications because the AI didn't include enough restrictions (8 chars + 1 number).

## 2026-04-13
**Tool:** Claude 3 Opus
**What I asked for:**
"How do I split a React contenteditable block natively when the user presses Enter mid-sentence without losing cursor focus?"

**What it generated:**
Claude gave me a solution relying heavily on `document.execCommand('insertParagraph')` coupled with `onInput` syncs.

**What was wrong or missing:**
`execCommand('insertParagraph')` completely breaks when you need deterministic HTML output. Since I am sending strict JSON contents to a REST API, allowing the browser to generate random `<div><br></div>` tags inside my editor breaks the data model completely.

**What I changed and why:**
I abandoned the AI's approach entirely. I manually used the `window.getSelection()` API to capture the exact string offset. I saved the text before the cursor and patched the current block's `el.innerText`. Then I dispatched an explicit `api.post` call with the text after the cursor to create a new `paragraph` block. This maintained 100% data integrity without unpredictable DOM wrapping.

## 2026-04-14
**Tool:** GitHub Copilot
**What I asked for:**
I was typing out the initial React-DnD implementation and letting Copilot autocomplete the order indexing algorithm.

**What it generated:**
Copilot assumed my database was using INTEGER columns, so it tried to use an array swap logic: `newOrderIndex = index + 1`, and then map over every subsequent block in the array to increment their indexes by 1 to make room.

**What was wrong or missing:**
This array +1 shifting is completely non-scalable and causes terrible database thrashing. If there are 1000 blocks, a single drag-and-drop modifies 1000 rows.

**What I changed and why:**
I enforced the `order_index` schema constraint natively. I rewrote the algorithm to do `FLOAT` arithmetic (`(prevIndex + nextIndex) / 2`). I later added the `needsRenormalization` manual loop to catch when the gap between floats gets smaller than 0.001.

## 2026-04-14
**Tool:** Cursor (Claude 3.5 Sonnet)
**What I asked for:**
"Write a middleware to verify token ownership comparing the `user_id` from the JWT to the `document_id` of the blocks route."

**What it generated:**
It gave me a query: `SELECT * FROM blocks WHERE id = req.params.id`. But it assumed `blocks` had a `user_id` column.

**What was wrong or missing:**
My schema correctly normalizes data—only `documents` has `user_id`, while `blocks` map to `document_id`. The AI's code threw an SQL syntax error for an invalid column.

**What I changed and why:**
I manually authored the `assertBlockBelongsToUser` function using an explicit `JOIN documents d ON b.document_id = d.id` statement so it securely resolves cross-account validations up to the parent entity.

## 2026-04-14
**Tool:** None (Pure Manual)
**Why I wrote code manually:**
When I set up the share token functionality, I decided not to use AI. Adding the `x-share-token` logic directly into the Axios default headers, handling the UI state for the "Share" modal, and writing the `rejectSharedWrites` global API middleware was tightly coupled architecture. Using an AI here often introduces strange third-party packages or complex context layers, so I coded it manually inline alongside the API interceptors.

## 2026-04-15
**Tool:** Claude 3.5 Sonnet
**What I asked for:**
"I need a React hook `useAutoSave` that watches a `blocks` state array, waits 1 second after typing, and sends an AbortController signal if the user types again to prevent duplicate saves from colliding."

**What it generated:**
It wrote a solid debounce logic hook storing the `AbortController` reference properly and comparing a `JSON.stringify` snapshot.

**What was wrong or missing:**
It forgot about page unmounts and visibility changes. If a user closed the browser right as the 1-second timeout was pending, the data was never saved.

**What I changed and why:**
I manually attached a `document.addEventListener('visibilitychange')` watcher, and fell back to generating a save call with `keepalive: true` on the `fetch` API directly, bypassing Axios, to ensure the payload survived browser unmount closures.

# AI Interaction Log

## 2026-04-10
**Tool:** ChatGPT (GPT-4o)
**What I asked for:**
I needed to set up the authentication boilerplate using Express and jsonwebtoken. I asked it to write a user register and login route.

**What it generated:**
It wrote a standard set of routes using `bcrypt` and `jwt.sign`. However, it stored the JWT in local storage directly via the response payload, completely ignoring the refresh token implementation requirement.

**What was wrong or missing:**
It didn't implement a refresh token as specified.

**What I changed and why:**
I manually modified the payload to issue two tokens. I placed the refresh token strictly inside an HTTP-only secure cookie, and kept the access token in the JSON response payload. **(Manual choice):** I wrote the Refresh token rotation route completely manually because I didn't want to risk the AI botching the cookie `maxAge` configurations or the explicit 15m/7d expiry differences. I also added explicit email/password regex verifications because the AI didn't include enough restrictions (8 chars + 1 number).

## 2026-04-11
**Tool:** Claude 3 Opus
**What I asked for:**
"How do I split a React contenteditable block natively when the user presses Enter mid-sentence without losing cursor focus?"

**What it generated:**
Claude gave me a solution relying heavily on `document.execCommand('insertParagraph')` coupled with `onInput` syncs.

**What was wrong or missing:**
`execCommand('insertParagraph')` completely breaks when you need deterministic HTML output. Since I am sending strict JSON contents to a REST API, allowing the browser to generate random `<div><br></div>` tags inside my editor breaks the data model completely.

**What I changed and why:**
I abandoned the AI's approach entirely. I manually used the `window.getSelection()` API to capture the exact string offset. I saved the text before the cursor and patched the current block's `el.innerText`. Then I dispatched an explicit `api.post` call with the text after the cursor to create a new `paragraph` block. This maintained 100% data integrity without unpredictable DOM wrapping.

## 2026-04-12
**Tool:** GitHub Copilot
**What I asked for:**
I was typing out the initial React-DnD implementation and letting Copilot autocomplete the order indexing algorithm.

**What it generated:**
Copilot assumed my database was using INTEGER columns, so it tried to use an array swap logic: `newOrderIndex = index + 1`, and then map over every subsequent block in the array to increment their indexes by 1 to make room.

**What was wrong or missing:**
This array +1 shifting is completely non-scalable and causes terrible database thrashing. If there are 1000 blocks, a single drag-and-drop modifies 1000 rows.

**What I changed and why:**
I enforced the `order_index` schema constraint natively. I rewrote the algorithm to do `FLOAT` arithmetic (`(prevIndex + nextIndex) / 2`). I later added the `needsRenormalization` manual loop to catch when the gap between floats gets smaller than 0.001.

## 2026-04-13
**Tool:** Cursor (Claude 3.5 Sonnet)
**What I asked for:**
"Write a middleware to verify token ownership comparing the `user_id` from the JWT to the `document_id` of the blocks route."

**What it generated:**
It gave me a query: `SELECT * FROM blocks WHERE id = req.params.id`. But it assumed `blocks` had a `user_id` column.

**What was wrong or missing:**
My schema correctly normalizes data—only `documents` has `user_id`, while `blocks` map to `document_id`. The AI's code threw an SQL syntax error for an invalid column.

**What I changed and why:**
I manually authored the `assertBlockBelongsToUser` function using an explicit `JOIN documents d ON b.document_id = d.id` statement so it securely resolves cross-account validations up to the parent entity.

## 2026-04-14
**Tool:** None (Pure Manual)
**Why I wrote code manually:**
When I set up the share token functionality, I decided not to use AI. Adding the `x-share-token` logic directly into the Axios default headers, handling the UI state for the "Share" modal, and writing the `rejectSharedWrites` global API middleware was tightly coupled architecture. Using an AI here often introduces strange third-party packages or complex context layers, so I coded it manually inline alongside the API interceptors.

## 2026-04-15
**Tool:** Claude 3.5 Sonnet
**What I asked for:**
"I need a React hook `useAutoSave` that watches a `blocks` state array, waits 1 second after typing, and sends an AbortController signal if the user types again to prevent duplicate saves from colliding."

**What it generated:**
It wrote a solid debounce logic hook storing the `AbortController` reference properly and comparing a `JSON.stringify` snapshot.

**What was wrong or missing:**
It forgot about page unmounts and visibility changes. If a user closed the browser right as the 1-second timeout was pending, the data was never saved.

**What I changed and why:**
I manually attached a `document.addEventListener('visibilitychange')` watcher, and fell back to generating a save call with `keepalive: true` on the `fetch` API directly, bypassing Axios, to ensure the payload survived browser unmount closures.

## 2026-04-16

**Tool:** Claude Sonnet 4.5 (claude.ai)

**What I asked for:**
I uploaded the entire project zip and asked it to do a full pre-production security and bug audit. I told it to rate issues as P1, P2, P3 and also flag performance problems.

**What it generated:**
It did a thorough scan across all files — backend routes, middleware, frontend components, the DB schema, docker-compose, and both .env files. It came back with 4 P1s, 5 P2s, and 6 P3s formatted as a visual table. The P1s were:
- Live Railway DB credentials committed inside `backend/.env` 
- No rate limiting on `/api/documents` and `/api/blocks` routes
- Image URLs accepted without HTTPS protocol validation (SSRF risk)
- No JSONB content schema enforcement on block writes (arbitrary field injection)

**What was wrong or missing:**
Most of it was accurate but it slightly over-flagged the image URL issue. It called it a full SSRF risk, but since the URL is only ever used as an `<img src>` on the client-side and never fetched server-side, the actual attack surface is more limited — it's a stored XSS/open-redirect concern rather than SSRF. The framing was slightly off but the fix was still correct.

It also missed that the `.env` wasn't just in `backend/.env` — the real production DATABASE_URL had leaked into `.env.example` as well, which is worse because `.env.example` is intentionally committed and would 100% end up in the public repo.

**What I changed and why:**
I applied all the P1 fixes it gave me:
- Added `backend/.gitignore` explicitly ignoring `.env`
- Added `apiLimiter` (120 req/min) to documents and blocks routes
- Updated `validateBlockContent` in both `document.js` and `block.js` with `new URL()` parse + protocol whitelist
- Split JWT into `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` with separate env vars and added `type` claim to both tokens

I also manually scrubbed `.env.example` and rotated the Railway DB password — the AI correctly flagged this but didn't catch that the credential had already leaked in the example file, so I had to check git history manually and force-push a cleaned commit.

---

## 2026-04-16 (afternoon)

**Tool:** Claude Sonnet 4.5 (claude.ai) — same session

**What I asked for:**
After the security fixes I asked it to look at the share link. The deployed Vercel URL `/share/8a87953fc7f9a45877db31b8f965c730` was returning 404 and I couldn't figure out why since the route existed in React Router.

**What it generated:**
It immediately identified the problem as a missing `vercel.json` with SPA rewrite rules. It generated a two-line fix:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

It also pointed out that `VITE_API_URL` was still set to `http://localhost:3001` in the deployed frontend, meaning the share page would load but silently fail to fetch the document.

**What was wrong or missing:**
The fix was completely correct. The only thing it didn't do was tell me *where* to place the `vercel.json` file. I wasted about 10 minutes putting it in the repo root before realizing Vercel reads it relative to the build output directory — it needed to go inside `frontend/`. Minor documentation gap on its part.

**What I changed and why:**
Dropped `vercel.json` into `frontend/`, set `VITE_API_URL` to the Railway backend URL in Vercel's environment variable dashboard, and redeployed. Share links now work.

---

## 2026-04-17

**Tool:** Claude Sonnet 4.5 (claude.ai)

**What I asked for:**
The image block feature wasn't working. When converting a block to `image` type via the slash menu and then pasting a URL and pressing Enter, nothing happened — the image never appeared. I asked Claude to go through the full component tree and find what's broken.

**What it generated:**
It traced the entire call path: slash menu → `handleSlashSelect` → `api.patch` → block type change → `Block.jsx` renders URL input → user types → `onKeyDown` Enter → `setImage(id, imageUrl)` → `handleImageUrlSet` → `syncBlockMutation` + `api.patch`. It found three bugs:

1. The URL input's `onKeyDown` calls `e.preventDefault()` but NOT `e.stopPropagation()`. The Enter key bubbles up to the parent and triggers `handleKeyDown` in BlockEditor which treats it as a text block split, corrupting the block state completely.

2. `autoFocus` on the URL input doesn't work after type conversion because React only applies `autoFocus` on initial mount, not re-renders. The `setTimeout(..., 0)` focus fix in `handleSlashSelect` was racing React's reconciliation.

3. `handleImageUrlSet` doesn't rollback the optimistic state update if the `api.patch` call fails — so a network error leaves the UI showing a URL that was never saved.

**What was wrong or missing:**
Bug #1 and #3 were exactly right and I verified them both. Bug #2 was partially correct — `autoFocus` not working on re-render is true, but the `setTimeout` workaround was actually working fine in practice. The focus issue I was experiencing was caused entirely by Bug #1 (the Enter bubbling up and immediately running the split logic, which then shifted focus to a new blank paragraph block). Once Bug #1 is fixed, the focus behavior is fine with `setTimeout(..., 0)`.

It also identified that the code block Enter handler inserts a `\n` text node directly into the DOM via `createTextNode` without calling `syncBlockMutation` afterward — so autosave never captures newlines typed inside code blocks. That was a real bug I hadn't noticed at all.

**What I changed and why:**
Fixed Bug #1 by adding `e.stopPropagation()` to the image input's `onKeyDown` handler in `Block.jsx`. This was the root cause of the image feature being completely broken.

Fixed the code block newline sync bug by adding `syncBlockMutation(blockId, { text: el.innerText })` after the `createTextNode` insertion in `handleKeyDown`.

Added error rollback to `handleImageUrlSet` — on catch, calls `syncBlockMutation(id, { url: previousUrl })` to revert optimistic state.

Did NOT change the `autoFocus` / setTimeout behavior since it turned out to be a non-issue once the propagation bug was fixed. The AI's diagnosis on that point was technically correct but practically irrelevant for this specific bug.


# Technical Decisions & Implementation Notes

This document covers the four most painful parts of building this project — the ones where AI either gave me wrong code, gave me code that worked but I didn't understand why, or where I chose to write it myself because I knew handing it to an AI would make it worse. Written so that if I (or someone else) ever has to debug this later, they can understand the actual reasoning instead of just staring at the final code wondering why it's written this way.

---

## 1. Enter Mid-Block Split

### What I actually needed

When a user positions their cursor in the middle of a paragraph and presses Enter, the block needs to split cleanly into two blocks. The text before the cursor stays in the original block. The text after the cursor becomes a new block below. The cursor should end up at the start of the new block. No text should be lost or duplicated.

This sounds simple but it's probably the hardest single feature in this entire project.

### What AI gave me first

I asked Claude to implement this and it came back with something like:

```js
if (e.key === 'Enter') {
  e.preventDefault();
  document.execCommand('insertParagraph');
}
```

It explained that `execCommand('insertParagraph')` is the native browser way to split a contenteditable element at the cursor. It's one line. It works in every browser. I thought great, done.

It was not done.

### What broke

The problem is what `execCommand('insertParagraph')` actually does to the DOM. It splits the element at the cursor and wraps the new content in a `<div>`. So if you had:

```
<div contenteditable>Hello World</div>
```

And the cursor was between "Hello" and "World", after `execCommand` you'd get:

```
<div contenteditable>
  Hello
  <div>World</div>
</div>
```

That's a nested div inside a contenteditable. The browser created this. React has no idea it exists. When my `onInput` handler fires and calls `e.target.innerText`, it gets `Hello\nWorld` as a single string — because the nested div creates a newline in the text representation. So the entire content of both halves gets saved as one block with a newline in the middle. The split never actually happened in my data model. The DOM looked split, the React state was corrupted.

I spent a long time debugging this because the *visual* result in the browser looked completely correct. It was only when I checked the database that I could see both blocks weren't there — only one block with a `\n` in the content field.

Even after I understood the DOM problem, the AI's follow-up suggestion was to add an `onInput` handler that detects `\n` in the text and retroactively creates a second block. That approach is fragile because you're reacting to a corrupted state rather than preventing it.

### What I changed and why

I threw out `execCommand` entirely and wrote the split logic using `window.getSelection()` directly.

The key insight is that you need to know the character offset of the cursor *before* the Enter key changes anything. `window.getSelection()` gives you a `Range` object, but a Range is defined in terms of DOM nodes and character offsets within those nodes — not a simple integer index into the plain text string. So you can't just do `selection.anchorOffset` and get a useful number when the content has any HTML in it (bold, italic spans, etc.).

The function I wrote to get the actual text offset:

```js
const getCursorOffset = (element) => {
  const sel = window.getSelection();
  if (!sel.rangeCount) return 0;
  const range = sel.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  return preCaretRange.toString().length;
};
```

What this does: it clones the selection range, expands it to cover the entire element, then shrinks it to end exactly where the cursor is. `.toString()` on that range gives you only the text before the cursor. `.length` is your offset. This works even when there are nested `<b>`, `<i>`, `<span>` tags in the content because `.toString()` strips all the markup.

Once I have the offset, the split is straightforward:

```js
const offset = getCursorOffset(el);
const fullText = el.innerText || '';
const textBefore = fullText.slice(0, offset);
const textAfter = fullText.slice(offset);
```

Then I update the current block's DOM directly (`el.innerText = textBefore`) and POST a new block to the API with `{ text: textAfter }`. The critical ordering here matters a lot:

1. POST the new block to the API first — get back the real UUID and order_index from the server
2. Only then update the DOM of the current block
3. Then add the new block to React state

If you do step 2 before step 1, the user sees the block visually split but then there's a delay before the new block appears below it. During that delay if the user types anything, it goes into a block that doesn't exist in the database yet. That causes a save to fail silently.


---

## 2. Order Index — Float Arithmetic for Block Ordering

### What I actually needed

Every block has an `order_index` that determines its position in the document. When blocks are reordered by drag-and-drop, or when a new block is inserted between two existing ones (Enter key), I need to assign a new `order_index` to the moved/created block without updating every other block in the document.

### What AI gave me first

GitHub Copilot autocompleted my initial implementation while I was typing out the drag-and-drop handler. It generated:

```js
const handleDragEnd = (event) => {
  const { active, over } = event;
  const oldIndex = blocks.findIndex(b => b.id === active.id);
  const newIndex = blocks.findIndex(b => b.id === over.id);
  
  // Assign new positions
  const reordered = arrayMove(blocks, oldIndex, newIndex);
  reordered.forEach((block, i) => {
    block.order_index = i + 1;
  });
  
  // Save all blocks
  reordered.forEach(block => {
    api.patch(`/api/blocks/${block.id}`, { order_index: block.order_index });
  });
};
```

And for the schema it used `INTEGER` for `order_index`.

### What broke

This approach fires one API call per block every single time anything is reordered. If a document has 50 blocks and you drag the last block to the top, you send 50 PATCH requests simultaneously. The backend processes them, the database does 50 writes. Every block is "dirty" even though only one moved.

Beyond performance, it's a race condition waiting to happen. Those 50 async requests have no guaranteed order. If request #3 arrives before request #1, block 3 temporarily has the wrong index. If the user drags again during that window, the second drag reads stale order_index values from local state and the final order in the DB can be wrong.

I noticed this when doing quick successive drags and watching the blocks jump around on screen before settling.

### What I changed and why

I changed `order_index` to `DOUBLE PRECISION` in the Postgres schema and rewrote the ordering logic to use midpoint arithmetic.

The core idea: when you insert or move a block between block A (order_index = 1.0) and block B (order_index = 2.0), the new block gets `order_index = (1.0 + 2.0) / 2 = 1.5`. You only write one row to the database. No other blocks change.

```js
export function insertAfter(prevIndex, nextIndex) {
  return (prevIndex + nextIndex) / 2;
}
```

If you then insert another block between 1.0 and 1.5, it gets 1.25. Then 1.125. Then 1.0625. You can keep subdividing indefinitely in theory, but floating point numbers have finite precision. After about 52 halvings the gap becomes smaller than JavaScript can represent accurately.

The fix for that is renormalization: periodically check if any gap between adjacent blocks is less than 0.001 and if so, reassign clean integer-spaced values (1.0, 2.0, 3.0, ...) to all blocks in that document. I run this check after every drag operation:

```js
export function needsRenormalization(blocks) {
  const sorted = [...blocks].sort((a, b) => a.order_index - b.order_index);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].order_index - sorted[i-1].order_index < 0.001) return true;
  }
  return false;
}
```

In practice, for a document editor, a user would have to insert something between the same two blocks thousands of times before hitting the precision limit. The renormalization is there as a safety net, not something that fires constantly.



---

## 3. Cross-Account Document Access Protection

### What I actually needed

Every API route that reads or modifies a document or block must verify that the requesting user actually owns that resource. A user with a valid JWT should not be able to read, edit, or delete another user's documents by guessing or constructing UUIDs.

### What AI gave me first

I asked Cursor (running Claude 3.5 Sonnet) to write the ownership verification middleware. It generated:

```js
const verifyOwnership = async (req, res, next) => {
  const { id } = req.params;
  const block = await db.query('SELECT * FROM blocks WHERE id = $1', [id]);
  
  if (!block.rows[0]) return res.status(404).json({ error: 'Not found' });
  if (block.rows[0].user_id !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

### What broke

The query `SELECT * FROM blocks WHERE id = $1` fails immediately because the `blocks` table has no `user_id` column. The schema normalizes ownership upward: only `documents` has `user_id`. Blocks have `document_id` which references `documents`.

The AI assumed a flat schema. It didn't look at the actual schema file. The code threw a runtime error on the first request because Postgres returned a column-not-found error.

Beyond the schema issue, using a single middleware for both document and block routes doesn't work cleanly because the `req.params.id` for a block route is a block UUID, but to check ownership you need to walk up to the document. These are different queries with different result shapes.

### What I wrote manually

I split the ownership check into two separate functions: one for documents, one for blocks.

**For document routes** (`assertOwnership`):

```js
async function assertOwnership(docId, userId) {
  const result = await db.query(
    'SELECT user_id FROM documents WHERE id = $1', [docId]
  );
  if (!result.rows[0]) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }
  if (result.rows[0].user_id !== userId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
}
```

I throw errors instead of calling `res.status().json()` directly because these functions are called inside try/catch blocks in route handlers. Throwing lets the catch block handle the HTTP response in one consistent place. If I called `res.json()` inside the ownership function, I'd have to remember to `return` after calling it in every route to prevent "headers already sent" errors — a bug I've hit before and it's miserable to debug.

**For block routes** (`assertBlockBelongsToUser`):

```js
async function assertBlockBelongsToUser(blockId, userId, res) {
  const result = await db.query(`
    SELECT b.document_id, d.user_id 
    FROM blocks b
    JOIN documents d ON b.document_id = d.id
    WHERE b.id = $1
  `, [blockId]);
  
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Block not found' });
    return null;
  }
  if (result.rows[0].user_id !== userId) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return result.rows[0];
}
```

The JOIN is necessary. There's no other way to get from a block to its owner without going through the documents table. The AI's suggestion to query `blocks` directly for `user_id` would have required denormalizing the schema — adding `user_id` to every block row — which wastes space and creates update anomalies (if a document is transferred to another user you'd have to update potentially thousands of block rows).

### Why I also did UUID validation manually

One thing neither AI suggested was validating that the `id` parameter is actually a valid UUID before running any query. Without this check, a request like `GET /api/documents/../../etc/passwd` or `GET /api/documents/; DROP TABLE users;--` would reach the parameterized query. Parameterized queries prevent SQL injection, but the DB would still do work trying to match a malformed string against UUID-typed primary keys. I added this at the top of every route that accepts an `:id` param:

```js
if (!isUuid(req.params.id)) {
  return res.status(422).json({ error: 'Invalid document id' });
}
```

That `isUuid` function just checks against the standard UUID regex pattern. It's not glamorous but it rejects garbage inputs at the earliest possible point.

---

## 4. Code Written Manually Without AI — Specific Decisions

### 4a. The `rejectSharedWrites` middleware

The share token system works as follows: a document can be made public, which generates a `share_token`. Anyone with the URL `/share/:token` can view the document without logging in. But they absolutely cannot modify it.

I wrote the enforcement middleware manually for two reasons.

First, the architecture decision itself is subtle. There are two layers of protection needed:

- The `shareTokenMiddleware` handles the `/api/share/:token` route, which is intentionally unauthenticated. It checks that the token exists and is_public before attaching the document to the request.
- The `rejectSharedWrites` middleware is applied to the regular `/api/documents` and `/api/blocks` routes (which are normally authenticated). It checks if an `x-share-token` header is present on those routes, and if so, blocks all write operations.

Why two separate middlewares? Because a malicious client could use a valid share token to try to write to the regular authenticated routes. If the share token were passed as a header and the route just checked "is there a valid JWT?" — yes there might also be a valid JWT from a different user — the write could succeed. The `rejectSharedWrites` middleware runs before `authMiddleware` and blocks any write attempt that includes a share token header, regardless of whether a JWT is also present.

I didn't trust an AI to reason about this two-layer architecture correctly. Every time I've asked AI to write security-sensitive middleware it either adds too little (single check, easy to bypass) or adds too much (blocks legitimate reads, breaks the share view feature entirely). I wrote it manually and tested both attack vectors explicitly.

Second, the token is read from multiple possible locations in the request:

```js
const shareToken =
  req.headers['x-share-token'] ||
  req.headers['x-shareToken'] ||  // case variation
  req.query?.token ||
  req.params?.token ||
  req.body?.token;
```

I included all of these because different HTTP clients send headers differently, and the frontend Axios instance was sending `x-share-token` in lowercase while an early version of the mobile share URL put the token in the query string. AI-generated versions of this typically only check one location, which caused the middleware to silently not fire on certain request patterns.

### 4b. The `keepalive: true` save on page close

In `useAutoSave`, there's a second save function that bypasses Axios:

```js
const saveWithKeepalive = useCallback(async () => {
  const token = localStorage.getItem('accessToken');
  await fetch(`${api.defaults.baseURL}/api/documents/${latestDocumentIdRef.current}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ blocks: latestBlocksRef.current }),
    keepalive: true,
  });
}, []);
```

This is called on `pagehide` and `beforeunload` events. I wrote this manually because when I asked Claude to implement "save on browser close", it used `beforeunload` with Axios, which doesn't work. `XMLHttpRequest` and `fetch` requests are cancelled when the page unloads. The browser stops the request mid-flight because the JavaScript context is being destroyed.

The `keepalive: true` flag in the Fetch API is the browser's mechanism for allowing a request to outlive the page. It tells the browser to finish delivering the request even after the tab is closed. Axios uses `XMLHttpRequest` under the hood, which doesn't support `keepalive`. So I had to use the native `fetch` API here even though the rest of the codebase uses Axios.

The tricky part is that `keepalive` requests have a body size limit of 64KB enforced by the browser. If the document has hundreds of large blocks, the serialized JSON might exceed this. I didn't implement a fallback for this edge case — if the document is that large and the user closes the browser at the exact wrong moment, the close-time save will silently fail. The 1-second debounced autosave should have caught it before that point anyway.

Also important: `latestBlocksRef.current` instead of `blocks` directly. The `saveWithKeepalive` function has an empty dependency array `[]` so it's created once at mount. If it referenced `blocks` from the closure, it would always see the initial empty array (stale closure). The ref is updated on every render so it always has the current blocks even when called from the event listener registered at mount time.

I didn't learn this from AI. I learned it by spending two hours wondering why the close-time save was always saving an empty document.

### 4c. `getCursorOffset` implementation (already covered above)

Mentioned in section 1. The `preCaretRange.toString().length` pattern is not something AI reliably generates. Both Claude and Copilot tend to suggest `window.getSelection().anchorOffset` which is wrong for any element with nested inline tags.

### 4d. The `hydrateNonce` pattern for block state reset

When the user switches between documents in the sidebar, the `BlockEditor` component receives a new `documentId` prop and new `initialBlocks`. But the component isn't unmounted and remounted — it stays in the DOM and its internal state needs to be reset to match the new document.

The naive implementation causes a bug where the old document's blocks briefly flash on screen before the new document's blocks load. This happens because React processes the `setBlocks(sorted)` state update asynchronously, so there's one render cycle where `documentId` is already the new document but `blocks` is still the old document's content.

AI suggested solving this with a `key` prop: `<BlockEditor key={documentId} />`. Setting a new key forces React to unmount and remount the component. This works but it destroys all the component state (aborting any in-progress autosave, losing focus, resetting scroll position) and causes a visible flash as the component is re-created.

I wrote the nonce approach manually: a `hydrateNonce` number that increments every time the document changes. The `useEffect` that loads `initialBlocks` into state depends on `hydrateNonce` instead of `documentId`. This lets me control exactly when the state reset happens relative to the incoming prop update, and lets me also reset related state (autosave status, focused block, slash menu state) in the same synchronous pass before any renders happen.

It's a pattern I've seen in game loops and animation systems — using an incrementing counter to signal "reset everything" without destroying and recreating the whole component. Not something I expected an AI to suggest, and it didn't.