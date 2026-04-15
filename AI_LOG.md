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
