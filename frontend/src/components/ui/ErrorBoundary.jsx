import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '24px',
          background: 'var(--bg-base)', color: 'var(--text-primary)',
          textAlign: 'center'
        }}>
          <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Oops! Something went wrong.</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px' }}>
            An unexpected error occurred. You can try refreshing the page or going back to the dashboard.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px', background: 'var(--accent)', color: 'var(--text-inverse)',
                borderRadius: 'var(--radius-sm)', fontWeight: 600
              }}
            >
              Reload Page
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              style={{
                padding: '10px 20px', border: '1px solid var(--border-default)',
                color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)'
              }}
            >
              Go to Dashboard
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{
              marginTop: '40px', padding: '16px', background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)', color: 'var(--error)', fontSize: '0.8rem',
              textAlign: 'left', maxWidth: '80vw', overflowX: 'auto'
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
