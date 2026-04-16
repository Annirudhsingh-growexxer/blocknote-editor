// Shared validation helpers used by both the /documents and /blocks routes.
// Keeping a single source of truth prevents rule drift between endpoints.

const ALLOWED_BLOCK_TYPES = new Set([
  'paragraph',
  'heading_1',
  'heading_2',
  'todo',
  'code',
  'divider',
  'image',
]);

const MAX_BLOCK_TEXT_LENGTH = 50000;
const MAX_IMAGE_URL_LENGTH = 2000;

// Only allow http(s) URLs and root-relative paths. This blocks javascript:,
// data:, file:, and other schemes that become XSS sinks if the URL is ever
// rendered somewhere other than an <img src>.
function isSafeImageUrl(url) {
  if (typeof url !== 'string') return false;
  if (url.length === 0 || url.length > MAX_IMAGE_URL_LENGTH) return false;
  return /^(https?:\/\/|\/)/i.test(url);
}

function validateBlockType(type) {
  if (!ALLOWED_BLOCK_TYPES.has(type)) return 'Invalid block type';
  return null;
}

function validateBlockContent(content) {
  if (content === undefined || content === null) return null;
  if (typeof content !== 'object' || Array.isArray(content)) return 'Invalid block content';

  if ('text' in content) {
    if (typeof content.text !== 'string') return 'Invalid block text';
    if (content.text.length > MAX_BLOCK_TEXT_LENGTH) return 'Content text too long';
  }

  if ('url' in content) {
    if (!isSafeImageUrl(content.url)) return 'Invalid image URL';
  }

  if ('checked' in content) {
    if (typeof content.checked !== 'boolean') return 'Invalid todo checked value';
  }

  return null;
}

module.exports = {
  ALLOWED_BLOCK_TYPES,
  MAX_BLOCK_TEXT_LENGTH,
  MAX_IMAGE_URL_LENGTH,
  isSafeImageUrl,
  validateBlockType,
  validateBlockContent,
};
