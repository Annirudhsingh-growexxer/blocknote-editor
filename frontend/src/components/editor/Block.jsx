import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import DragHandle from './DragHandle';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function Block({ 
  block, readOnly, onUpdate, onKeyDown, onPaste, onTypeChange, onImageSet, 
  focused, onFocus, onBlur 
}) {
  const contentRef = useRef(null);
  const { id, type, content } = block;
  const [isHovered, setIsHovered] = useState(false);
  const [imageUrl, setImageUrl] = useState(content.url || '');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: 'relative'
  };

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    const nextText = content?.text || '';
    const isFocused = document.activeElement === contentRef.current;
    if (!isFocused && contentRef.current.innerText !== nextText) {
      contentRef.current.innerText = nextText;
    }
  }, [content?.text, type]);

  useEffect(() => {
    setImageUrl(content.url || '');
  }, [content.url]);

  const handleInput = (e) => {
    onUpdate(id, { text: e.target.innerText });
  };


  const toggleTodo = () => {
    if (readOnly) return;
    onUpdate(id, { text: content.text, checked: !content.checked });
  };

  const placeholderText = focused
    ? (
        type === 'paragraph' ? 'Type something, or / for commands' :
        type === 'heading_1' ? 'Heading 1' :
        type === 'heading_2' ? 'Heading 2' : ''
      )
    : '';

  return (
    <div 
      ref={setNodeRef}
      style={{
        ...dndStyle,
        padding: '3px 0 3px 32px',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!readOnly && isHovered && <DragHandle id={id} />}

      <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: type === 'todo' ? 'flex-start' : 'center',
          transition: 'border var(--t-fast)',
          borderLeft: focused && !readOnly ? '2px solid var(--accent-dim)' : '2px solid transparent',
          paddingLeft: '6px',
          marginLeft: '-8px'
      }}>
        {type === 'todo' && (
          <button
            type="button"
            role="checkbox"
            aria-checked={Boolean(content.checked)}
            aria-label={content.checked ? 'Mark todo as incomplete' : 'Mark todo as complete'}
            onClick={toggleTodo}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleTodo();
              }
            }}
            style={{
              width: '16px', height: '16px', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)', background: content.checked ? 'var(--accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: readOnly ? 'default' : 'pointer',
              marginTop: '4px', marginRight: '8px', flexShrink: 0
            }}
          >
            {content.checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>
        )}

        {type === 'divider' ? (
          <div style={{ padding: '8px 0', width: '100%', cursor: 'pointer' }}
               tabIndex={readOnly ? -1 : 0} 
               onFocus={() => onFocus(id)}
               onKeyDown={(e) => { if (e.key === 'Backspace' || e.key === 'Delete') onKeyDown(e, id); }}
          >
            <hr style={{ border: 'none', height: '1px', background: 'var(--border-default)', margin: 0 }} />
          </div>
        ) : type === 'image' ? (
          <div style={{ width: '100%', padding: '8px 0' }} tabIndex={readOnly ? -1 : 0} 
               onFocus={() => onFocus(id)}
               onKeyDown={(e) => { if (e.key === 'Backspace' || e.key === 'Delete') onKeyDown(e, id); }}>
            {content.url ? (
              <div style={{ position: 'relative' }}>
                <img 
                  src={content.url} 
                  alt="Block content" 
                  style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)', display: 'block' }} 
                  onClick={() => { if (!readOnly) onUpdate(id, { url: '' }); }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{ 
                  display: 'none', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px',
                  background: 'var(--bg-overlay)',
                  border: '1px dashed var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }} onClick={() => { if (!readOnly) onUpdate(id, { url: '' }); }}>
                  <span style={{ fontSize: '24px' }}>⚠️</span>
                  <p>Image failed to load</p>
                  <p style={{ fontSize: '0.8rem' }}>Click to edit URL</p>
                </div>
              </div>
            ) : (
              <div style={{
                background: 'var(--bg-overlay)', padding: '24px', borderRadius: 'var(--radius-md)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
              }}>
                <span style={{ fontSize: '24px' }}>🖼</span>
                <input 
                  type="url" 
                  autoFocus={focused && !readOnly}
                  placeholder="Paste image URL and press Enter"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                       e.preventDefault();
                       const isValid = imageUrl.startsWith('http') || imageUrl.startsWith('/');
                       if (isValid) onUpdate(id, { url: imageUrl });
                    }
                  }}
                  onBlur={() => {
                    const isValid = imageUrl.startsWith('http') || imageUrl.startsWith('/');
                    if (isValid) onUpdate(id, { url: imageUrl });
                  }}
                  disabled={readOnly}
                  style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                    width: '100%', maxWidth: '400px', outline: 'none'
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          <div
            ref={contentRef}
            contentEditable={!readOnly}
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={(e) => onKeyDown(e, id)}
            onPaste={(e) => onPaste?.(e, id)}
            onFocus={() => onFocus(id)}
            onBlur={onBlur}
            className={`block-content ${type}`}
            style={{
              flex: 1,
              outline: 'none',
              minHeight: '1.5em',
              cursor: readOnly ? 'default' : 'text',
              wordBreak: 'break-word',
              // Type specific styles
              ...(type === 'paragraph' ? {
                fontFamily: 'var(--font-ui)', color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap'
              } : type === 'heading_1' ? {
                fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'pre-wrap'
              } : type === 'heading_2' ? {
                fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'pre-wrap'
              } : type === 'code' ? {
                fontFamily: 'var(--font-mono)', fontSize: '0.875rem', background: 'var(--bg-overlay)',
                border: '1px solid var(--border-subtle)', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                color: '#a8d8b0', whiteSpace: 'pre-wrap', lineHeight: 1.6, minHeight: '2.6em'
              } : type === 'todo' ? {
                fontFamily: 'var(--font-ui)', color: content.checked ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: content.checked ? 'line-through' : 'none', whiteSpace: 'pre-wrap'
              } : {})
            }}
            data-placeholder={placeholderText}
          />
        )}
      </div>

    </div>
  );
}

export default Block;
