import React from 'react';

export default function DragHandle({ listeners, attributes, isDragging }) {
  return (
    <div
      className="drag-handle"
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        color: 'var(--text-muted)',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      {...listeners}
      {...attributes}
      aria-label="Drag to reorder"
    >
      <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
        <circle cx="4" cy="4" r="1.5" />
        <circle cx="8" cy="4" r="1.5" />
        <circle cx="4" cy="8" r="1.5" />
        <circle cx="8" cy="8" r="1.5" />
        <circle cx="4" cy="12" r="1.5" />
        <circle cx="8" cy="12" r="1.5" />
      </svg>
    </div>
  );
}
