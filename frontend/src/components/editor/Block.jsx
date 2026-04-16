import React, { useRef, useEffect, useState, useLayoutEffect, memo } from 'react';
import DragHandle from './DragHandle';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { sanitizeInlineHTML } from '../../lib/sanitizeInlineHTML';

// `code` blocks are intentionally plain-text per the product spec
// ("Monospace. No rich formatting."); everything else supports the
// floating FormatToolbar, so we store their value as sanitized HTML.
const RICH_TEXT_TYPES = new Set(['paragraph', 'heading_1', 'heading_2', 'todo']);

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

function Block({ 
  block, readOnly, onUpdate, onKeyDown, onPaste, onTypeChange, onImageSet,
  focused, selected, slashActive, onFocus, onBlur 
}) {
  const setImage = onImageSet || ((id, url) => onUpdate(id, { url }));
  const contentRef = useRef(null);
  const { id, type, content } = block;
  const [isHovered, setIsHovered] = useState(false);
  // imageUrl is kept fully in-sync with content.url via an effect so that
  // clicking "reset" (which sets content.url to '') always clears the input.
  const [imageUrl, setImageUrl] = useState(content.url || '');
  const [imageError, setImageError] = useState(false);
  const [formatMenu, setFormatMenu] = useState(false); // open/close block format menu
  const [activeTab, setActiveTab] = useState('text');
  const formatBtnRef = useRef(null);
  const formatMenuRef = useRef(null);

  // Close format menu on outside click
  useEffect(() => {
    if (!formatMenu) return;
    const handler = (e) => {
      if (!formatMenuRef.current?.contains(e.target) && !formatBtnRef.current?.contains(e.target)) {
        setFormatMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [formatMenu]);

  const applyBlockFormat = (command, value) => {
    const el = contentRef.current;
    if (!el) return;
    // Select all content in the block
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand(command, false, value);
    sel.removeAllRanges();
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));
  };

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
    const el = contentRef.current;
    const nextText = content?.text || '';
    const isFocused = document.activeElement === el;
    // Don't clobber the DOM while the user is actively editing it — the
    // FormatToolbar mutates the DOM directly via execCommand and we must
    // preserve those edits until React re-renders with synced state.
    if (isFocused) return;

    if (RICH_TEXT_TYPES.has(type)) {
      const nextHTML = sanitizeInlineHTML(nextText);
      if (el.innerHTML !== nextHTML) {
        el.innerHTML = nextHTML;
      }
    } else if (el.innerText !== nextText) {
      // `code` and any other plain-text type.
      el.innerText = nextText;
    }
  }, [content?.text, type]);

  // Sync local imageUrl state whenever content.url changes (including reset to '').
  // Also clear any previous image error so the new URL gets a fresh attempt.
  useEffect(() => {
    setImageUrl(content.url || '');
    setImageError(false);
  }, [content.url, id]); // include `id` so switching to a different image block resets too

  const handleInput = (e) => {
    // Store HTML for rich-text block types so inline formatting (<b>, <i>,
    // <u>, <s>, <code>) survives round-trips through state. Plain `innerHTML`
    // is passed up unsanitized here because the *rendering* site (the
    // useLayoutEffect above and the read-only share view) always runs it
    // back through sanitizeInlineHTML before inserting it into the DOM.
    const payload = RICH_TEXT_TYPES.has(type)
      ? { text: e.target.innerHTML }
      : { text: e.target.innerText };
    onUpdate(id, payload);
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
        flexDirection: 'column',
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!readOnly && isHovered && <DragHandle id={id} />}
      {!readOnly && (focused || isHovered) && type !== 'divider' && type !== 'image' && (
        <div style={{ position: 'absolute', left: '-4px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
          <button
            ref={formatBtnRef}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setFormatMenu((v) => !v); setActiveTab('text'); }}
            title="Format block"
            style={{
              width: '18px', height: '18px', borderRadius: '50%',
              background: formatMenu ? 'var(--accent)' : 'var(--bg-overlay)',
              border: '1px solid var(--border-default)',
              color: formatMenu ? 'var(--text-inverse)' : 'var(--text-muted)',
              fontSize: '14px', lineHeight: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
            }}
          >+</button>

          {formatMenu && (
            <div
              ref={formatMenuRef}
              onMouseDown={(e) => e.preventDefault()}
              style={{
                position: 'absolute', left: '24px', top: '0',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                zIndex: 200, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '6px',
                animation: 'menuIn 120ms var(--ease-snap)',
              }}
            >
              {/* Tabs */}
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
              {/* Swatches */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '172px' }}>
                {(activeTab === 'text' ? TEXT_COLORS : HIGHLIGHT_COLORS).map(({ label, value }) => (
                  <button
                    key={label}
                    title={label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (activeTab === 'text') applyBlockFormat('foreColor', value);
                      else applyBlockFormat('hiliteColor', value ?? 'transparent');
                      setFormatMenu(false);
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
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700,
                      }}>∅</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: type === 'todo' ? 'flex-start' : 'center',
          transition: 'border var(--t-fast)',
          borderLeft: (focused || (selected && !readOnly)) ? '2px solid var(--accent-dim)' : '2px solid transparent',
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
            {content.url && !imageError ? (
              <div style={{ position: 'relative' }}>
                <img 
                  src={content.url} 
                  alt="Block content" 
                  style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)', display: 'block' }} 
                  onClick={() => { if (!readOnly) { setImage(id, ''); } }}
                  onError={() => setImageError(true)}
                />
              </div>
            ) : content.url && imageError ? (
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px',
                background: 'var(--bg-overlay)',
                border: '1px dashed var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }} onClick={() => { if (!readOnly) { setImage(id, ''); setImageError(false); } }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <p>Image failed to load</p>
                <p style={{ fontSize: '0.8rem' }}>Click to edit URL</p>
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
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                       e.preventDefault();
                       const trimmed = imageUrl.trim();
                       const isValid = trimmed.startsWith('http') || trimmed.startsWith('/') || trimmed.startsWith('data:');
                       if (isValid) setImage(id, trimmed);
                    }
                  }}
                  onBlur={() => {
                    const trimmed = imageUrl.trim();
                    const isValid = trimmed.startsWith('http') || trimmed.startsWith('/') || trimmed.startsWith('data:');
                    if (isValid && trimmed !== content.url) setImage(id, trimmed);
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
        )
        }
      </div>

    </div>
  );
}

export default memo(Block, (prev, next) => {
  // Shallow-compare block fields instead of reference identity so that only
  // the block that actually changed causes a re-render. syncBlockMutation in
  // BlockEditor always builds new objects, so reference equality would cause
  // every block to re-render on every keystroke.
  if (
    prev.readOnly !== next.readOnly ||
    prev.focused !== next.focused ||
    prev.selected !== next.selected ||
    prev.slashActive !== next.slashActive
  ) return false;

  const pb = prev.block;
  const nb = next.block;
  if (pb === nb) return true;
  if (pb.id !== nb.id || pb.type !== nb.type) return false;

  // Shallow-compare content fields
  const pc = pb.content || {};
  const nc = nb.content || {};
  const pcKeys = Object.keys(pc);
  const ncKeys = Object.keys(nc);
  if (pcKeys.length !== ncKeys.length) return false;
  for (const k of pcKeys) {
    if (pc[k] !== nc[k]) return false;
  }
  return true;
});
