import React from 'react';
import { Check, AlertCircle, RotateCcw } from 'lucide-react';

export default function SaveIndicator({ status, onRetry }) {
  // status: 'idle' | 'saving' | 'saved' | 'error'
  
  if (status === 'idle') return null;

  return (
    <div aria-live="polite" role="status" style={{
      position: 'absolute', top: '16px', right: '100%', marginRight: '24px',
      fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap',
      transition: 'opacity var(--t-mid), transform var(--t-mid)',
      animation: 'slideDownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      color: status === 'saving' ? 'var(--saving)' : status === 'saved' ? 'var(--success)' : 'var(--error)'
    }}>
      {status === 'saving' && (
        <>
          <div className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--saving)' }}></div>
          Saving...
        </>
      )}
      {status === 'saved' && (
         <>
           <Check size={12} /> Saved
         </>
      )}
      {status === 'error' && (
         <>
           <AlertCircle size={12} /> Save failed
           {onRetry && (
             <button
               onClick={onRetry}
               title="Retry save (or press Ctrl+S)"
               aria-label="Retry save"
               style={{
                 display: 'inline-flex', alignItems: 'center', gap: '3px',
                 marginLeft: '4px', padding: '2px 6px',
                 background: 'rgba(224,92,92,0.15)', border: '1px solid var(--error)',
                 borderRadius: 'var(--radius-sm)', color: 'var(--error)',
                 fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                 lineHeight: 1,
               }}
             >
               <RotateCcw size={10} /> Retry
             </button>
           )}
         </>
      )}
      <style>{`
        @keyframes slideDownFade {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pulse-dot {
           animation: pulse 1s infinite alternate;
        }
        @keyframes pulse {
           from { opacity: 0.5; transform: scale(0.8); }
           to { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
