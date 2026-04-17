// Minimal whitelist sanitizer for inline-formatted block text.
// The block editor stores rich text as HTML strings (wrapped in <b>, <i>,
// <u>, <s>, <code>) produced by the floating FormatToolbar + execCommand.
// This helper strips everything outside the whitelist so we never persist
// — or render back into a contenteditable / public share view — arbitrary
// scripts, event handlers, inline styles, or non-inline structural tags.
const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'CODE', 'BR', 'SPAN']);

// For SPAN tags produced by execCommand('foreColor') / execCommand('hiliteColor'),
// preserve ONLY the 'color' and 'background-color' CSS properties so text-color
// and highlight formatting survive round-trips through state.
// All other CSS, event handlers, class, and id attributes are always stripped.
function sanitizeSpanStyle(styleValue) {
  if (!styleValue) return null;
  const kept = [];
  for (const decl of styleValue.split(';')) {
    const trimmed = decl.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const val  = trimmed.slice(colonIdx + 1).trim();
    if ((prop === 'color' || prop === 'background-color') && val) {
      kept.push(`${prop}: ${val}`);
    }
  }
  return kept.length ? kept.join('; ') : null;
}

function sanitizeNode(node) {
  // Element
  if (node.nodeType === 1) {
    const tag = node.tagName;
    if (!ALLOWED_TAGS.has(tag)) {
      // Replace disallowed element with its text content.
      const text = document.createTextNode(node.textContent || '');
      node.replaceWith(text);
      return;
    }

    // Capture safe style value BEFORE stripping attributes.
    let safeStyle = null;
    if (tag === 'SPAN') {
      safeStyle = sanitizeSpanStyle(node.getAttribute('style'));
    }

    // Strip every attribute (event handlers, class, id, href, etc.).
    const attrsToRemove = Array.from(node.attributes).map(a => a.name);
    for (const attr of attrsToRemove) {
      node.removeAttribute(attr);
    }

    // Restore only the safe style subset for SPAN (color/background-color).
    if (tag === 'SPAN' && safeStyle) {
      node.setAttribute('style', safeStyle);
    }

    for (const child of Array.from(node.childNodes)) {
      sanitizeNode(child);
    }
  }
  // Comments / processing instructions — remove.
  else if (node.nodeType === 8 || node.nodeType === 7) {
    node.remove();
  }
}

export function sanitizeInlineHTML(html) {
  if (typeof html !== 'string') return '';
  if (!html) return '';
  // If the string doesn't contain any tag, pass it through (fast path for
  // existing plain-text blocks) but HTML-escape angle brackets so that a
  // value like "1 < 2" doesn't start being parsed as markup next time.
  if (!/[<&]/.test(html)) return html;

  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  for (const child of Array.from(tpl.content.childNodes)) {
    sanitizeNode(child);
  }
  return tpl.innerHTML;
}
