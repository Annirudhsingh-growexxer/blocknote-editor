import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';

export function useAutoSave(documentId, blocks, lastKnownUpdatedAt, onServerDocumentUpdate, onConflict) {
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const abortRef = useRef(null);
  const timeoutRef = useRef(null);
  const hydratedDocumentRef = useRef(null);
  const lastSnapshotRef = useRef('');
  const latestDocumentIdRef = useRef(documentId);
  const latestBlocksRef = useRef(blocks);
  const latestUpdatedAtRef = useRef(lastKnownUpdatedAt);
  const dirtyRef = useRef(false);
  const conflictRef = useRef(false);
  const saveSeqRef = useRef(0);
  const blocksVersionRef = useRef(0);

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

  const persistBlocks = useCallback(async () => {
    if (!latestDocumentIdRef.current || !latestBlocksRef.current || !dirtyRef.current) return;
    if (conflictRef.current) return;
    const requestSeq = ++saveSeqRef.current;
    const requestVersion = blocksVersionRef.current;

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data } = await api.patch(
        `/api/documents/${latestDocumentIdRef.current}`,
        {
          blocks: latestBlocksRef.current,
          lastKnownUpdatedAt: latestUpdatedAtRef.current,
        },
        { signal: controller.signal }
      );
      // Ignore stale in-flight responses (prevents false 409/conflict UI).
      if (requestSeq !== saveSeqRef.current) return;

      if (data?.updated_at) {
        latestUpdatedAtRef.current = data.updated_at;
        onServerDocumentUpdate?.(data);
      }

      // Only clear "dirty" if nothing changed while this request was in flight.
      if (requestVersion === blocksVersionRef.current) {
        dirtyRef.current = false;
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus((current) => (current === 'saved' ? 'idle' : current));
        }, 2000);
      } else {
        setSaveStatus('saving');
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return;
      }
      if (requestSeq !== saveSeqRef.current) return;
      if (err.response?.status === 409) {
        conflictRef.current = true;
        setSaveStatus('error');
        onConflict?.(err.response?.data);
        return;
      }
      setSaveStatus('error');
    }
  }, [onConflict, onServerDocumentUpdate]);

  useEffect(() => {
    latestDocumentIdRef.current = documentId;
    latestBlocksRef.current = blocks;
    // If we had a 409 conflict and the caller reloaded the document
    // (updated_at changed), reset local autosave baseline.
    if (conflictRef.current && lastKnownUpdatedAt) {
      conflictRef.current = false;
      lastSnapshotRef.current = JSON.stringify(blocks);
      dirtyRef.current = false;
      setSaveStatus('idle');
    }

    latestUpdatedAtRef.current = lastKnownUpdatedAt;
  }, [documentId, blocks, lastKnownUpdatedAt]);

  useEffect(() => {
    if (!documentId || !blocks) return;

    if (hydratedDocumentRef.current !== documentId) {
      hydratedDocumentRef.current = documentId;
      lastSnapshotRef.current = JSON.stringify(blocks);
      dirtyRef.current = false;
      setSaveStatus('idle');
      return;
    }

    // Mark dirty on any edit. Avoid JSON-string diffs each keystroke.
    blocksVersionRef.current += 1;

    dirtyRef.current = true;
    setSaveStatus('saving');

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      void persistBlocks();
    }, 1000);
  }, [documentId, blocks, persistBlocks]);

  useEffect(() => {
    const flushPendingChanges = () => {
      if (!dirtyRef.current) return;
      void saveWithKeepalive();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingChanges();
      }
    };

    window.addEventListener('pagehide', flushPendingChanges);
    window.addEventListener('beforeunload', flushPendingChanges);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', flushPendingChanges);
      window.removeEventListener('beforeunload', flushPendingChanges);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [saveWithKeepalive]);

  const flushNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await persistBlocks();
  }, [persistBlocks]);

  return { saveStatus, flushNow };
}
