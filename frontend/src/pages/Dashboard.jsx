import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import api from '../lib/api';
import Editor from './Editor';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [activeDocId, setActiveDocId] = useState(() => localStorage.getItem('activeDocumentId'));
  const [loading, setLoading] = useState(true);

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
    }
  };

  const handleTitleChange = (id, newTitle) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, title: newTitle } : d));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar 
        documents={documents} 
        loading={loading}
        onCreate={handleCreate} 
        activeDocId={activeDocId} 
        onSelect={setActiveDocId} 
        onDelete={handleDelete}
      />
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!activeDocId ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Select or create a document</p>
          </div>
        ) : (
          <Editor documentId={activeDocId} onTitleChange={handleTitleChange} />
        )}
      </div>
    </div>
  );
}
