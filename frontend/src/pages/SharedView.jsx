import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import BlockEditor from '../components/editor/BlockEditor';

export default function SharedView() {
  const { token } = useParams();
  const [doc, setDoc] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocument();
  }, [token]);

  const fetchDocument = async () => {
    try {
      const { data } = await api.get(`/api/share/${token}`);
      setDoc(data.document);
      setBlocks(data.blocks);
    } catch (err) {
      setError(err.response?.data?.error || 'Document not found');
    }
  };

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <p style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>{error}</p>
        <Link to="/" style={{ color: 'var(--accent)' }}>Go to BlockNote →</Link>
      </div>
    );
  }

  if (!doc) return <div style={{ color: 'var(--text-muted)', padding: '24px' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: '100px' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center',
        padding: '12px 24px', justifyContent: 'space-between'
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-primary)' }}>
          BlockNote
        </h2>
        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>View only</span>
      </header>

      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ 
          fontFamily: 'var(--font-display)', color: 'var(--text-primary)',
          fontSize: '2rem', marginBottom: '32px'
        }}>
          {doc.title}
        </h1>
        
        <BlockEditor 
          documentId={doc.id} 
          initialBlocks={blocks} 
          onChange={() => {}} 
          readOnly={true} 
        />
      </main>
    </div>
  );
}
