import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline, Strikethrough, Code } from 'lucide-react';

// Notion-style floating format toolbar. Appears above the current text
// selection inside an editable block and applies inline formatting via
// document.execCommand. The toolbar itself is non-focusable (mousedown is
// suppressed) so clicking a button never steals the selection.
const COMMANDS = [
  { id: 'bold',          label: 'Bold',          shortcut: 'Ctrl+B', Icon: Bold },
  { id: 'italic',        label: 'Italic',        shortcut: 'Ctrl+I', Icon: Italic },
  { id: 'underline',     label: 'Underline',     shortcut: 'Ctrl+U', Icon: Underline },
  { id: 'strikeThrough', label: 'Strikethrough', shortcut: '',       Icon: Strikethrough },
  { id: 'code',          label: 'Code',          shortcut: '',       Icon: Code, custom: true },
];

// Returns the <code>-ness of the current selection. execCommand doesn't have
// a native "code" toggle, so we wrap/unwrap the selection with a <code> tag.
function applyInlineCode() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  // If the selection already sits inside a <code>, unwrap it.
  let node = range.startContainer;
  while (node && node !== document.body) {
    if (node.nodeType === 1 && node.tagName === 'CODE') {
      const parent = node.parentNode;
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      parent.removeChild(node);
      return;
    }
    node = node.parentNode;
  }
  const code = document.createElement('code');
  try {
    code.appendChild(range.extractContents());
    range.insertNode(code);
    // Reselect the code we just inserted.
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(code);
    selection.addRange(newRange);
  } catch {
    // extractContents can throw across non-editable boundaries; ignore.
  }
}

function isActive(cmd) {
  if (cmd === 'code') {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    let node = sel.anchorNode;
    while (node && node !== document.body) {
      if (node.nodeType === 1 && node.tagName === 'CODE') return true;
      node = node.parentNode;
    }
    return false;
  }
  try {
    return document.queryCommandState(cmd);
  } catch {
    return false;
  }
}

export default function FormatToolbar({ rect, editorRootRef, onAfterCommand }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({ opacity: 0 });
  const [, forceRender] = useState(0);

  // Position the toolbar above the selection rect. Clamp to the viewport so
  // it never overflows the editor area.
  useLayoutEffect(() => {
    if (!rect || !ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    const margin = 8;
    let top = rect.top - height - margin;
    // If there's no room above, flip below the selection.
    if (top < margin) top = rect.bottom + margin;

    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

    setStyle({
      position: 'fixed',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      opacity: 1,
    });
  }, [rect]);

  // When active-state changes (e.g., caret moves through bold text), re-render
  // so button highlights stay in sync.
  useEffect(() => {
    const handler = () => forceRender((n) => n + 1);
    document.addEventListener('selectionchange', handler);
    return () => document.removeEventListener('selectionchange', handler);
  }, []);

  const runCommand = (cmd) => {
    if (cmd.custom && cmd.id === 'code') {
      applyInlineCode();
    } else {
      try {
        document.execCommand(cmd.id, false, null);
      } catch {
        /* ignore */
      }
    }
    onAfterCommand?.();
  };

  return (
    <div
      ref={ref}
      className="format-toolbar"
      // Prevent the toolbar from stealing selection / focus when clicked.
      onMouseDown={(e) => e.preventDefault()}
      style={{
        ...style,
        zIndex: 200,
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        padding: '2px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: '8px',
        boxShadow: '0 10px 32px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.35)',
        transition: 'opacity 80ms ease-out',
        pointerEvents: 'auto',
      }}
      role="toolbar"
      aria-label="Text formatting"
    >
      {COMMANDS.map((cmd, idx) => {
        const active = isActive(cmd.id);
        return (
          <React.Fragment key={cmd.id}>
            {idx > 0 && idx === COMMANDS.length - 1 && (
              <span
                aria-hidden="true"
                style={{ width: '1px', background: 'var(--border-subtle)', margin: '4px 2px' }}
              />
            )}
            <button
              type="button"
              onClick={() => runCommand(cmd)}
              aria-label={cmd.label}
              aria-pressed={active}
              title={cmd.shortcut ? `${cmd.label} (${cmd.shortcut})` : cmd.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                transition: 'background var(--t-fast), color var(--t-fast)',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'var(--bg-overlay)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <cmd.Icon size={15} strokeWidth={2.25} />
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Helper used by BlockEditor: checks whether a selection lies inside
// `root` (the editor container) AND inside an editable block-content node.
export function selectionIsInEditor(root) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (!root || !root.contains(range.commonAncestorContainer)) return null;
  // Walk up from the selection to find a `.block-content` contenteditable.
  let node = range.commonAncestorContainer;
  while (node && node !== root) {
    if (node.nodeType === 1 && node.classList?.contains('block-content') && node.isContentEditable) {
      return range.getBoundingClientRect();
    }
    node = node.parentNode;
  }
  return null;
}
