import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function DragHandle({ id }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    position: 'absolute',
    left: '6px',
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: isDragging ? 'grabbing' : 'grab',
    color: 'var(--text-muted)',
    opacity: 0,
    transition: 'opacity 120ms',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...attributes.style,
  };

  return (
    <div 
      ref={setNodeRef} 
      className="drag-handle" 
      style={style} 
      {...listeners} 
      {...attributes}
      aria-label="Drag to reorder"
      onMouseDown={e => {
        // Prevent default to prevent focus shift
        // e.preventDefault(); 
      }}
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
