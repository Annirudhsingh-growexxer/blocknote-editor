import React, { useState } from 'react';
import { Plus, MoreHorizontal, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function Sidebar({ documents, onCreate, activeDocId, onSelect, onDelete }) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState(null);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch(e) {}
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  function timeAgo(dateString) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const daysDifference = Math.round((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    return rtf.format(daysDifference, 'day');
  }

  return (
    <div style={{
      width: '240px', height: '100vh', background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column',
      flexShrink: 0
    }}>
      <div style={{ padding: '24px 16px 16px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 600,
          color: 'var(--text-primary)', marginBottom: '24px'
        }}>BlockNote</h2>
        
        <button onClick={onCreate} style={{
          width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
          color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px',
          fontWeight: 500
        }}>
          <Plus size={16} /> New Document
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
        {documents.map(doc => (
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
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {doc.title}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                {timeAgo(doc.updated_at)}
              </div>
            </div>
            
            {hoveredId === doc.id && (
              <div className="doc-menu" style={{ display: 'flex' }} onClick={e => { e.stopPropagation(); onDelete(doc.id); }}>
                <LogOut size={14} color="var(--error)" /> 
              </div>
            )}
          </div>
        ))}
      </div>

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
