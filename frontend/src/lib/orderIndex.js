// Returns midpoint between two order_index values
export function midpoint(a, b) {
  return (a + b) / 2;
}

// Generate order_index for inserting after a given block
// prevIndex: order_index of block above (or 0 if inserting at top)
// nextIndex: order_index of block below (or prevIndex + 2 if inserting at bottom)
export function insertAfter(prevIndex, nextIndex) {
  return midpoint(prevIndex, nextIndex);
}

// Detect if renormalization is needed
export function needsRenormalization(blocks) {
  const sorted = [...blocks].sort((a, b) => a.order_index - b.order_index);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].order_index - sorted[i-1].order_index < 0.001) return true;
  }
  return false;
}

// Return blocks with fresh integer-spaced order_index values
export function renormalize(blocks) {
  const sorted = [...blocks].sort((a, b) => a.order_index - b.order_index);
  return sorted.map((b, i) => ({ ...b, order_index: (i + 1) * 1.0 }));
}
