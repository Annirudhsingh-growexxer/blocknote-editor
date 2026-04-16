import React from 'react';
import { X, CheckCircle, XCircle, Loader } from 'lucide-react';

// phase: 'confirm' | 'loading' | 'success' | 'error'
export default function ConfirmModal({
  phase = 'confirm',
  title,
  description,
  confirmLabel = 'Confirm',
  confirmStyle = {},
  successMessage = 'Done!',
  errorMessage = 'Something went wrong.',
  onConfirm,
  onClose,
}) {
  const isDone = phase === 'success' || phase === 'error';
  const isLoading = phase === 'loading';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', padding: '24px',
        animation: 'modalIn var(--t-mid) var(--ease-snap)', position: 'relative'
      }}>
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{ position: 'absolute', top: '24px', right: '24px', color: 'var(--text-secondary)' }}
        >
          <X size={20} />
        </button>

        {isDone ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '8px 0 4px' }}>
            {phase === 'success'
              ? <CheckCircle size={40} color="var(--success)" />
              : <XCircle size={40} color="var(--error)" />
            }
            <p style={{ color: 'var(--text-primary)', fontWeight: 500, textAlign: 'center' }}>
              {phase === 'success' ? successMessage : errorMessage}
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: '8px', width: '100%', padding: '10px',
                background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontWeight: 500
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 id="confirm-modal-title" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: '8px', paddingRight: '32px' }}>
              {title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px' }}>
              {description}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onClose}
                disabled={isLoading}
                style={{
                  flex: 1, padding: '10px', background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
                  color: isLoading ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: 500,
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={!isLoading ? onConfirm : undefined}
                disabled={isLoading}
                style={{
                  flex: 1, padding: '10px', border: 'none',
                  borderRadius: 'var(--radius-md)', color: 'white', fontWeight: 500,
                  background: 'var(--error)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', opacity: isLoading ? 0.8 : 1,
                  ...confirmStyle
                }}
              >
                {isLoading
                  ? <><Loader size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Deleting…</>
                  : confirmLabel
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
