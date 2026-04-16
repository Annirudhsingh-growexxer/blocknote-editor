import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import api from '../../lib/api';

export default function ShareModal({ documentId, initialIsPublic, initialToken, onClose }) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [token, setToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleShare = async () => {
    setLoading(true);
    try {
      if (isPublic) {
        await api.delete(`/api/documents/${documentId}/share`);
        setIsPublic(false);
        setToken(null);
      } else {
        const { data } = await api.post(`/api/documents/${documentId}/share`);
        setIsPublic(true);
        setToken(data.shareUrl.split('/').pop());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = token ? `${window.location.origin}/share/${token}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="share-modal-title" style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', padding: '24px',
        animation: 'modalIn var(--t-mid) var(--ease-snap)', position: 'relative'
      }}>
        <button 
          onClick={onClose} 
          aria-label="Close modal"
          style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-secondary)' }}
        >
          <X size={20} />
        </button>
        
        <h2 id="share-modal-title" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '24px' }}>Share Document</h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Enable public link</span>
          <button 
            disabled={loading}
            onClick={toggleShare} 
            aria-pressed={isPublic}
            aria-label={isPublic ? 'Disable public link' : 'Enable public link'}
            style={{
              width: '44px', height: '24px', borderRadius: '12px',
              background: isPublic ? 'var(--accent)' : 'var(--bg-overlay)',
              border: isPublic ? 'none' : '1px solid var(--border-subtle)',
              position: 'relative', transition: 'background var(--t-fast)'
            }}
          >
            <div style={{
              position: 'absolute', top: '2px', left: isPublic ? '22px' : '2px',
              width: '20px', height: '20px', borderRadius: '50%', background: 'white',
              transition: 'left var(--t-fast)'
            }}></div>
          </button>
        </div>

        {isPublic ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              readOnly 
              value={shareUrl} 
              style={{
                flex: 1, padding: '10px 12px', background: 'var(--bg-overlay)', color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', outline: 'none'
              }}
            />
            <button onClick={handleCopy} style={{
              padding: '0 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              color: copied ? 'var(--success)' : 'var(--text-primary)', borderRadius: 'var(--radius-md)',
              fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              {copied ? <><Check size={16} /> Copied</> : 'Copy'}
            </button>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Anyone with the link can no longer view this document.
          </p>
        )}

      </div>
    </div>
  );
}
