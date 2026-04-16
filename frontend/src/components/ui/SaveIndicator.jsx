import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

export default function SaveIndicator({ status }) {
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
           <AlertCircle size={12} /> ⚠ Save failed
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
