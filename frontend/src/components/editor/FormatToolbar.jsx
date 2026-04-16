import React, { useEffect, useRef, useState } from 'react';

const TEXT_COLORS = [
  { label: 'Default', value: '#f0ede8' },
  { label: 'Red',     value: '#e05c5c' },
  { label: 'Orange',  value: '#e8943a' },
  { label: 'Yellow',  value: '#e8c547' },
  { label: 'Green',   value: '#4caf7d' },
  { label: 'Blue',    value: '#5c9ee0' },
  { label: 'Purple',  value: '#a07de8' },
  { label: 'Muted',   value: '#999999' },
];

const HIGHLIGHT_COLORS = [
  { label: 'None',   value: null },
  { label: 'Yellow', value: '#e8c54740' },
  { label: 'Green',  value: '#4caf7d40' },
  { label: 'Blue',   value: '#5c9ee040' },
  { label: 'Red',    value: '#e05c5c40' },
  { label: 'Purple', value: '#a07de840' },
];

export default function FormatToolbar() {
  const [pos, setPos]           = useState(null);
  const [activeTab, setActiveTab] = useState('text');
  const savedRangeRef           = useRef(null);
  const toolbarRef              = useRef(null);

  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection();

      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setPos(null);
        savedRangeRef.current = null;
        return;
      }

      const range = sel.getRangeAt(0);
      const anchor = range.commonAncestorContainer;
      const el = anchor.nodeType === 3 ? anchor.parentElement : anchor;

      // Only show inside .block-content, but NOT for code blocks
      const blockContent = el.closest('.block-content');
      if (!blockContent || blockContent.classList.contains('code')) {
        setPos(null);
        savedRangeRef.current = null;
        return;
      }

      savedRangeRef.current = range.cloneRange();
      const rect = range.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    };

    document.addEventListener('selectionchange', onSelectionChange);
    return () => document.removeEventListener('selectionchange', onSelectionChange);
  }, []);

  const applyFormat = (command, value) => {
    const sel = window.getSelection();
    if (savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    document.execCommand(command, false, value);
    if (sel.rangeCount) savedRangeRef.current = sel.getRangeAt(0).cloneRange();

    // sync state via input event on the block-content element
    const el = savedRangeRef.current?.commonAncestorContainer;
    const node = el?.nodeType === 3 ? el.parentElement : el;
    node?.closest('.block-content')?.dispatchEvent(new InputEvent('input', { bubbles: true }));
  };

  if (!pos) return null;

  const colors = activeTab === 'text' ? TEXT_COLORS : HIGHLIGHT_COLORS;

  return (
    <div
      ref={toolbarRef}
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -100%)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        zIndex: 200,
        padding: '6px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        animation: 'menuIn 120ms var(--ease-snap)',
      }}
    >
      <div style={{ display: 'flex', gap: '4px' }}>
        {['text', 'highlight'].map((tab) => (
          <button
            key={tab}
            onMouseDown={(e) => { e.preventDefault(); setActiveTab(tab); }}
            style={{
              flex: 1, padding: '3px 8px', fontSize: '0.7rem',
              fontFamily: 'var(--font-ui)', borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: activeTab === tab ? 'var(--accent)' : 'var(--border-subtle)',
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
              background: 'transparent', cursor: 'pointer',
            }}
          >
            {tab === 'text' ? 'A Color' : 'Highlight'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '172px' }}>
        {colors.map(({ label, value }) => (
          <button
            key={label}
            title={label}
            onMouseDown={(e) => {
              e.preventDefault();
              if (activeTab === 'text') {
                applyFormat('foreColor', value);
              } else {
                applyFormat('hiliteColor', value ?? 'transparent');
              }
            }}
            style={{
              width: '20px', height: '20px', borderRadius: '50%',
              border: '1px solid var(--border-default)',
              background: value ?? 'transparent',
              cursor: 'pointer', flexShrink: 0, position: 'relative',
            }}
          >
            {!value && (
              <span style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700,
              }}>∅</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
