import React, { useState, useEffect, useRef } from 'react';
import { Share2, Pencil, PanelLeft } from 'lucide-react';
import api from '../lib/api';
import BlockEditor from '../components/editor/BlockEditor';
import SaveIndicator from '../components/ui/SaveIndicator';
import ShareModal from '../components/ui/ShareModal';
import { useAutoSave } from '../hooks/useAutoSave';

export default function Editor({ documentId, onTitleChange, onToggleSidebar, sidebarOpen }) {
  const [doc, setDoc] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [hydrateNonce, setHydrateNonce] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editorNotice, setEditorNotice] = useState('');
  const titleRef = useRef(null);
  
  const handleServerDocumentUpdate = useCallback((serverDoc) => {
    setDoc((prev) => (prev ? { ...prev, updated_at: serverDoc.updated_at } : prev));
  }, []);

  // const handleConflict = useCallback(() => {
  //   setEditorNotice('This document changed in another tab. Reload to avoid overwriting newer edits.');
  // }, []);

  const { saveStatus, flushNow } = useAutoSave(
    documentId,
    blocks,
    doc?.updated_at,
    handleServerDocumentUpdate,
    // handleConflict
  );

  useEffect(() => {
    const handleSaveShortcut = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void flushNow();
      }
    };
    window.addEventListener('keydown', handleSaveShortcut);
    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, [flushNow]);

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const { data } = await api.get(`/api/documents/${documentId}`);
      setDoc(data.document);
      setBlocks(data.blocks);
      setHydrateNonce((n) => n + 1);
      setEditorNotice('');
    } catch (err) {
      console.error(err);
      setEditorNotice('Could not load this document. Please refresh and try again.');
    }
  };

  const handleTitleBlur = async (e) => {
    setEditingTitle(false);
    const newTitle = e.target.textContent.trim() || 'Untitled';
    if (newTitle !== doc.title) {
      setDoc({ ...doc, title: newTitle });
      onTitleChange(documentId, newTitle);
      try {
        const { data } = await api.patch(`/api/documents/${documentId}`, { title: newTitle });
        setDoc((prev) => ({ ...prev, updated_at: data.updated_at }));
      } catch (err) {
        console.error(err);
        setEditorNotice('Title update failed. Your previous title is kept on server.');
      }
    }
  };

  const startEditingTitle = () => {
    setEditingTitle(true);
    requestAnimationFrame(() => {
      if (titleRef.current) {
        titleRef.current.focus();
        const range = document.createRange();
        range.selectNodeContents(titleRef.current);
        range.collapse(false);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
      }
    });
  };

  if (!doc) return <div style={{ color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', paddingBottom: '100px' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center',
        padding: '12px 24px', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              style={{
                display: 'flex', alignItems: 'center', padding: '6px',
                color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)'
              }}
            >
              <PanelLeft size={16} />
            </button>
          )}
          <h1
            ref={titleRef}
            contentEditable={editingTitle}
            suppressContentEditableWarning
            role="textbox"
            aria-label="Document title"
            aria-multiline="false"
            onBlur={handleTitleBlur}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } }}
            style={{
              fontFamily: 'var(--font-display)', color: 'var(--text-primary)',
              fontSize: '1.2rem', outline: 'none',
              cursor: editingTitle ? 'text' : 'default',
              borderBottom: editingTitle ? '1px solid var(--border-active)' : '1px solid transparent',
              paddingBottom: '2px', transition: 'border-color var(--t-fast)'
            }}
          >
            {doc.title}
          </h1>
          {!editingTitle && (
            <button
              onClick={startEditingTitle}
              aria-label="Edit title"
              style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '2px' }}
            >
              <Pencil size={14} />
            </button>
          )}
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

      <main className="editor-main">
        <div style={{ width: '100%', maxWidth: 'none' }}>
          {editorNotice && (
            <div style={{
              marginBottom: '16px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--error)',
              color: 'var(--text-primary)',
              background: 'rgba(224,92,92,0.12)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <span>{editorNotice}</span>
              <button onClick={fetchDocument} style={{ color: 'var(--accent)', fontWeight: 600 }}>Reload</button>
            </div>
          )}
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

          <div className="editor-box">
            <BlockEditor 
              documentId={documentId} 
              initialBlocks={blocks} 
              onChange={setBlocks} 
              readOnly={false} 
              hydrateNonce={hydrateNonce}
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
