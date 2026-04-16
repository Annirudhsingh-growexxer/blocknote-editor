import React, { useEffect, useRef, useState } from 'react';

export default function SlashMenu({ position, filter, onSelect, onClose }) {
  const menuRef = useRef(null);
  
  const items = [
    { type: 'paragraph', label: 'Paragraph', icon: '¶', shortcut: 'p' },
    { type: 'heading_1', label: 'Heading 1', icon: 'H₁', shortcut: '#' },
    { type: 'heading_2', label: 'Heading 2', icon: 'H₂', shortcut: '##' },
    { type: 'todo', label: 'Todo', icon: '☑', shortcut: '[]' },
    { type: 'code', label: 'Code', icon: '</>', shortcut: '```' },
    { type: 'divider', label: 'Divider', icon: '—', shortcut: '---' },
    { type: 'image', label: 'Image', icon: '🖼', shortcut: 'img' }
  ];

  const filteredItems = items.filter(item => 
    item.label.toLowerCase().includes(filter.toLowerCase()) || 
    item.shortcut.toLowerCase().includes(filter.toLowerCase())
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const displayedItems = filteredItems.slice(0, 7);

  useEffect(() => setSelectedIndex(0), [filter, filteredItems.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      const maxIndex = Math.max(0, displayedItems.length - 1);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((s) => Math.min(s + 1, maxIndex));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((s) => Math.max(s - 1, 0));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (displayedItems.length > 0) {
          onSelect(displayedItems[selectedIndex].type);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [displayedItems, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    if (!menuRef.current) return;
    const el = menuRef.current.children[selectedIndex];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (filteredItems.length === 0) return null;

  return (
    <div ref={menuRef} role="listbox" aria-label="Block type menu" style={{
      position: 'fixed',
      left: position.x + 'px',
      top: position.y + 'px',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      width: '260px',
      maxHeight: '300px',
      overflowY: 'auto',
      zIndex: 100,
      animation: 'menuIn 150ms var(--ease-snap)',
      transformOrigin: 'top left'
    }}>
      {displayedItems.map((item, idx) => (
        <div 
          key={item.type}
          role="option"
          aria-selected={idx === selectedIndex}
          onClick={() => onSelect(item.type)}
          style={{
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            background: idx === selectedIndex ? 'var(--bg-overlay)' : 'transparent',
            color: 'var(--text-primary)'
          }}
          onMouseEnter={() => setSelectedIndex(idx)}
        >
          <div style={{
            width: '24px', height: '24px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'var(--bg-surface)', borderRadius: '4px',
            border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)'
          }}>{item.icon}</div>
          <div style={{ flex: 1, fontSize: '0.875rem' }}>{item.label}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.shortcut}</div>
        </div>
      ))}
    </div>
  );
}
