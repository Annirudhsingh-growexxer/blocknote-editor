import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import api from '../lib/api';
import Editor from './Editor';

const SIDEBAR_BREAKPOINT = 768;

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(() => localStorage.getItem('activeDocumentId'));
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= SIDEBAR_BREAKPOINT
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < SIDEBAR_BREAKPOINT) {
        setSidebarOpen((open) => (open ? false : open));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (activeDocId) {
      localStorage.setItem('activeDocumentId', activeDocId);
    } else {
      localStorage.removeItem('activeDocumentId');
    }
  }, [activeDocId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/documents');
      setDocuments(data);
      setActiveDocId((current) => {
        if (current && data.some((doc) => doc.id === current)) {
          return current;
        }
        return data[0]?.id || null;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { data } = await api.post('/api/documents');
      setDocuments([data, ...documents]);
      setActiveDocId(data.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (activeDocId === id) setActiveDocId(null);
    } catch (err) {
      console.error(err);
      throw err; // re-throw so ConfirmModal can show the error phase
    }
  };

  const handleTitleChange = (id, newTitle) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, title: newTitle } : d));
  };

  const handleRename = async (id, newTitle) => {
    // Optimistic update
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, title: newTitle } : d));
    try {
      await api.patch(`/api/documents/${id}`, { title: newTitle });
    } catch (err) {
      console.error('Rename failed', err);
      // Revert on failure by refetching
      fetchDocuments();
    }
  };

  const toggleSidebar = () => setSidebarOpen((open) => !open);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
      {sidebarOpen && (
        <Sidebar
          documents={documents}
          loading={loading}
          onCreate={handleCreate}
          activeDocId={activeDocId}
          onSelect={(id) => {
            setActiveDocId(id);
            if (window.innerWidth < SIDEBAR_BREAKPOINT) setSidebarOpen(false);
          }}
          onDelete={handleDelete}
          onRename={handleRename}
        />
      )}

      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {!activeDocId ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Select or create a document</p>
          </div>
        ) : (
          <Editor
            documentId={activeDocId}
            onTitleChange={handleTitleChange}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />
        )}
      </div>
    </div>
  );
}
