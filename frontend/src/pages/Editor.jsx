import React, { useState, useEffect } from 'react';
import { ArrowLeft, Share2 } from 'lucide-react';
import api from '../lib/api';
import BlockEditor from '../components/editor/BlockEditor';
import SaveIndicator from '../components/ui/SaveIndicator';
import ShareModal from '../components/ui/ShareModal';
import { useAutoSave } from '../hooks/useAutoSave';

export default function Editor({ documentId, onTitleChange }) {
  const [doc, setDoc] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const { saveStatus } = useAutoSave(documentId, blocks);

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const { data } = await api.get(`/api/documents/${documentId}`);
      setDoc(data.document);
      setBlocks(data.blocks);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTitleBlur = async (e) => {
    const newTitle = e.target.textContent || 'Untitled';
    if (newTitle !== doc.title) {
      setDoc({ ...doc, title: newTitle });
      onTitleChange(documentId, newTitle);
      try {
        await api.patch(`/api/documents/${documentId}`, { title: newTitle });
      } catch (err) {
         console.error(err);
      }
    }
  };

  if (!doc) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '100px' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center',
        padding: '12px 24px', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 
            contentEditable 
            suppressContentEditableWarning
            role="textbox"
            aria-label="Document title"
            aria-multiline="false"
            onBlur={handleTitleBlur}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
            style={{ 
              fontFamily: 'var(--font-display)', color: 'var(--text-primary)',
              fontSize: '1.2rem', outline: 'none', cursor: 'text'
            }}
          >
            {doc.title}
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
          <SaveIndicator status={saveStatus} />
          
          <button onClick={() => setIsShareModalOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            color: 'var(--text-primary)', borderRadius: 'var(--radius-md)'
          }}>
            <Share2 size={16} /> Share
          </button>
        </div>
      </header>

      <main style={{ width: '100%', padding: '36px 48px 160px' }}>
        <div style={{ width: '100%', maxWidth: 'none' }}>
          <div style={{ marginBottom: '24px' }}>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              marginBottom: '8px',
              letterSpacing: '0.03em',
              textTransform: 'uppercase'
            }}>
              Editor
            </p>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '70ch' }}>
              Paste notes, meeting minutes, or drafts directly here. Multi-line paste now turns each line into its own block so the document stays structured and easy to edit.
            </p>
          </div>

          <div style={{
            width: '100%',
            minHeight: '72vh',
            padding: '24px 28px 80px',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%), var(--bg-surface)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
          }}>
            <BlockEditor 
              documentId={documentId} 
              initialBlocks={blocks} 
              onChange={setBlocks} 
              readOnly={false} 
            />
          </div>
        </div>
      </main>

      {isShareModalOpen && (
        <ShareModal 
          documentId={documentId}
          initialIsPublic={doc.is_public}
          initialToken={doc.share_token}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
}
