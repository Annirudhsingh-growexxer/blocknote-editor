import React, { useState } from 'react';
import { Plus, Trash2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import ConfirmModal from '../ui/ConfirmModal';

export default function Sidebar({ documents, loading, onCreate, activeDocId, onSelect, onDelete }) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState(null);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [deletePhase, setDeletePhase] = useState('confirm');

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch(e) {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('activeDocumentId');
    navigate('/login');
  };

  function timeAgo(dateString) {
    const diff = Date.now() - new Date(dateString).getTime();
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    
    if (diff < 60000) return 'just now';
    
    const minutes = Math.round(diff / 60000);
    if (minutes < 60) return rtf.format(-minutes, 'minute');
    
    const hours = Math.round(diff / 3600000);
    if (hours < 24) return rtf.format(-hours, 'hour');
    
    const days = Math.round(diff / 86400000);
    return rtf.format(-days, 'day');
  }

  return (
    <div style={{
      width: '240px', height: '100vh', background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column',
      flexShrink: 0
    }}>
      <div style={{ padding: '24px 16px 16px' }}>
        <h2 onClick={() => navigate('/')} style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600,
          color: 'var(--text-primary)', marginBottom: '24px', cursor: 'pointer'
        }}>BlockNote</h2>
        
        <button onClick={onCreate} disabled={loading} style={{
          width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
          color: loading ? 'var(--text-muted)' : 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px',
          fontWeight: 500, opacity: loading ? 0.6 : 1
        }}>
          <Plus size={16} /> New Document
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No documents yet
          </div>
        ) : documents.map(doc => (
          <div
            key={doc.id}
            onMouseEnter={() => setHoveredId(doc.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelect(doc.id)}
            style={{
              padding: '8px 12px', margin: '2px 0', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: activeDocId === doc.id ? 'var(--accent-dim)' : 'transparent',
              borderLeft: activeDocId === doc.id ? '3px solid var(--accent)' : '3px solid transparent',
            }}
          >
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
              <div style={{ color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {doc.title}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                {timeAgo(doc.updated_at)}
              </div>
            </div>

            {hoveredId === doc.id && (
              <div
                className="doc-menu"
                style={{ display: 'flex' }}
                onClick={e => { e.stopPropagation(); setDeletingDoc(doc); setDeletePhase('confirm'); }}
                aria-label="Delete document"
              >
                <Trash2 size={14} color="var(--text-muted)" />
              </div>
            )}
          </div>
        ))}
      </div>

      {deletingDoc && (
        <ConfirmModal
          phase={deletePhase}
          title="Delete Document"
          description={<>Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deletingDoc.title}</strong>? This action cannot be undone.</>}
          confirmLabel="Delete"
          successMessage="Document deleted successfully."
          errorMessage="Failed to delete the document. Please try again."
          onConfirm={async () => {
            try {
              await onDelete(deletingDoc.id);
              setDeletePhase('success');
            } catch {
              setDeletePhase('error');
            }
          }}
          onClose={() => { setDeletingDoc(null); setDeletePhase('confirm'); }}
        />
      )}

      <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)',
          width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)'
        }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}
