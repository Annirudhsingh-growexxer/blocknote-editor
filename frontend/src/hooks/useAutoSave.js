import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';

export function useAutoSave(documentId, blocks, lastKnownUpdatedAt, onServerDocumentUpdate) {
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'

  const abortRef            = useRef(null);
  const timeoutRef          = useRef(null);
  const hydratedDocumentRef = useRef(null);
  const latestDocumentIdRef = useRef(documentId);
  const latestBlocksRef     = useRef(blocks);
  const latestUpdatedAtRef  = useRef(lastKnownUpdatedAt);
  const dirtyRef            = useRef(false);
  const saveSeqRef          = useRef(0);
  const blocksVersionRef    = useRef(0);
  // Track in-progress retries so a second 409 doesn't spawn another retry.
  const isRetryingRef       = useRef(false);

  const onServerDocumentUpdateRef = useRef(onServerDocumentUpdate);
  useEffect(() => { onServerDocumentUpdateRef.current = onServerDocumentUpdate; }, [onServerDocumentUpdate]);

  // ─── Keepalive flush (pagehide / beforeunload) ───────────────────────────
  const saveWithKeepalive = useCallback(async () => {
    if (!latestDocumentIdRef.current || !latestBlocksRef.current || !dirtyRef.current) return;
    const token = localStorage.getItem('accessToken');
    await fetch(`${api.defaults.baseURL}/api/documents/${latestDocumentIdRef.current}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({
        blocks: latestBlocksRef.current,
        lastKnownUpdatedAt: latestUpdatedAtRef.current,
      }),
      keepalive: true,
    });
  }, []);

  // ─── Core save ───────────────────────────────────────────────────────────
  const persistBlocks = useCallback(async ({ isRetry = false } = {}) => {
    if (!latestDocumentIdRef.current || !latestBlocksRef.current || !dirtyRef.current) return;

    // Abort any previous in-flight save.
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const requestSeq     = ++saveSeqRef.current;
    const requestVersion = blocksVersionRef.current;

    try {
      const { data } = await api.patch(
        `/api/documents/${latestDocumentIdRef.current}`,
        {
          blocks: latestBlocksRef.current,
          lastKnownUpdatedAt: latestUpdatedAtRef.current,
        },
        { signal: controller.signal }
      );

      // Stale response — a newer save has already been fired.
      if (requestSeq !== saveSeqRef.current) return;

      // Update our timestamp baseline from the server response.
      if (data?.updated_at) {
        latestUpdatedAtRef.current = data.updated_at;
        onServerDocumentUpdateRef.current?.(data);
      }

      isRetryingRef.current = false;
      if (requestVersion === blocksVersionRef.current) {
        dirtyRef.current = false;
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus((s) => (s === 'saved' ? 'idle' : s));
        }, 2000);
      } else {
        // More changes arrived while this save was in flight — keep saving.
        setSaveStatus('saving');
      }
    } catch (err) {
      // Cancelled by the next save — silently ignore.
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      // Stale response — ignore.
      if (requestSeq !== saveSeqRef.current) return;

      if (err.response?.status === 401) {
        // Axios interceptor already attempted a token refresh and failed
        // (redirect to /login is handled there). Stop autosave cleanly.
        setSaveStatus('error');
        return;
      }

      if (err.response?.status === 409) {
        // The server's updated_at is ahead of what we sent. This happens when
        // a block mutation (POST/PATCH/DELETE /api/blocks) bumped updated_at
        // between our last bumpTimestamp() call and now.
        //
        // Strategy: fetch the document's ACTUAL current updated_at from the
        // server, update our ref, then do exactly ONE retry. If the retry also
        // fails we show an error banner rather than looping forever.
        if (isRetry) {
          // Second consecutive 409 — something is genuinely wrong.
          setSaveStatus('error');
          isRetryingRef.current = false;
          return;
        }

        if (isRetryingRef.current) return; // Another retry is already queued.
        isRetryingRef.current = true;
        setSaveStatus('saving');

        try {
          // Re-fetch the document to get the server's ground-truth updated_at.
          const { data: freshDoc } = await api.get(
            `/api/documents/${latestDocumentIdRef.current}`
          );
          const freshTs = freshDoc?.document?.updated_at;
          if (freshTs) {
            latestUpdatedAtRef.current = freshTs;
            onServerDocumentUpdateRef.current?.({ updated_at: freshTs });
          }
        } catch {
          // If we can't even GET the document, give up.
          setSaveStatus('error');
          isRetryingRef.current = false;
          return;
        }

        // One-shot retry with the freshly synced timestamp.
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          void persistBlocksRef.current({ isRetry: true });
        }, 200);
        return;
      }

      setSaveStatus('error');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const persistBlocksRef = useRef(persistBlocks);
  useEffect(() => { persistBlocksRef.current = persistBlocks; }, [persistBlocks]);

  // ─── Sync latest values into refs on every render ────────────────────────
  useEffect(() => {
    latestDocumentIdRef.current = documentId;
    // Never send optimistic/temp blocks — they don't have real DB IDs yet.
    latestBlocksRef.current = blocks?.filter(b => !b._isOptimistic) ?? blocks;
    latestUpdatedAtRef.current = lastKnownUpdatedAt;
  }, [documentId, blocks, lastKnownUpdatedAt]);

  // ─── Schedule autosave whenever blocks change ─────────────────────────────
  useEffect(() => {
    if (!documentId || !blocks) return;

    // First load — just capture the baseline snapshot, don't save.
    if (hydratedDocumentRef.current !== documentId) {
      hydratedDocumentRef.current = documentId;
      // Reset all save state for the new document so stale dirty/retry flags
      // from the previous document don't bleed across and trigger a spurious PATCH.
      dirtyRef.current = false;
      blocksVersionRef.current = 0;
      isRetryingRef.current = false;
      if (abortRef.current) abortRef.current.abort();
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
      setSaveStatus('idle');
      return;
    }

    blocksVersionRef.current += 1;
    dirtyRef.current = true;
    isRetryingRef.current = false; // A new edit supersedes any pending retry.
    setSaveStatus('saving');

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      void persistBlocksRef.current();
    }, 1000);
  }, [documentId, blocks]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Flush on tab close / page hide ──────────────────────────────────────
  useEffect(() => {
    const flush = () => { if (dirtyRef.current) void saveWithKeepalive(); };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };

    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [saveWithKeepalive]);

  // ─── Public API ───────────────────────────────────────────────────────────
  const flushNow = useCallback(async () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    await persistBlocks();
  }, [persistBlocks]);

  // Call this immediately after any block-level API call (POST/PATCH/DELETE
  // /api/blocks) returns its document_updated_at. Updating the ref synchronously
  // — before the React render cycle — ensures the next autosave PATCH sends the
  // correct lastKnownUpdatedAt and never hits 409 in the common path.
  const bumpTimestamp = useCallback((ts) => {
    if (typeof ts === 'string' && ts) {
      latestUpdatedAtRef.current = ts;
    }
  }, []);

  return { saveStatus, flushNow, bumpTimestamp };
}
