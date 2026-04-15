import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';

export function useAutoSave(documentId, blocks) {
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const abortRef = useRef(null);
  const timeoutRef = useRef(null);
  const hydratedDocumentRef = useRef(null);
  const lastSnapshotRef = useRef('');
  const latestDocumentIdRef = useRef(documentId);
  const latestBlocksRef = useRef(blocks);
  const dirtyRef = useRef(false);

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
      body: JSON.stringify({ blocks: latestBlocksRef.current }),
      keepalive: true,
    });
  }, []);

  const persistBlocks = useCallback(async () => {
    if (!latestDocumentIdRef.current || !latestBlocksRef.current || !dirtyRef.current) return;

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await api.patch(
        `/api/documents/${latestDocumentIdRef.current}`,
        { blocks: latestBlocksRef.current },
        { signal: controller.signal }
      );

      dirtyRef.current = false;
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus((current) => (current === 'saved' ? 'idle' : current));
      }, 2000);
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return;
      }
      setSaveStatus('error');
    }
  }, []);

  useEffect(() => {
    latestDocumentIdRef.current = documentId;
    latestBlocksRef.current = blocks;
  }, [documentId, blocks]);

  useEffect(() => {
    if (!documentId || !blocks) return;

    const snapshot = JSON.stringify(blocks);

    if (hydratedDocumentRef.current !== documentId) {
      hydratedDocumentRef.current = documentId;
      lastSnapshotRef.current = snapshot;
      dirtyRef.current = false;
      setSaveStatus('idle');
      return;
    }

    // Guard against saving initial empty state if it's just a transition
    if (blocks.length === 0 && lastSnapshotRef.current !== '[]') {
      return;
    }

    if (snapshot === lastSnapshotRef.current) {
      return;
    }

    lastSnapshotRef.current = snapshot;

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

  return { saveStatus };
}
