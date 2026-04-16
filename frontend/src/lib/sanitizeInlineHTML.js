// Minimal whitelist sanitizer for inline-formatted block text.
// The block editor stores rich text as HTML strings (wrapped in <b>, <i>,
// <u>, <s>, <code>) produced by the floating FormatToolbar + execCommand.
// This helper strips everything outside the whitelist so we never persist
// — or render back into a contenteditable / public share view — arbitrary
// scripts, event handlers, inline styles, or non-inline structural tags.
const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'CODE', 'BR', 'SPAN']);

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
    // Strip every attribute on allowed tags (including style/class/event handlers).
    for (const attr of Array.from(node.attributes)) {
      node.removeAttribute(attr.name);
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
