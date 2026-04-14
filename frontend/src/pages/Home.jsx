import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const token = localStorage.getItem('accessToken');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '72px 32px 96px'
      }}>
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '72px'
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontStyle: 'italic'
          }}>
            BlockNote
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to={token ? '/dashboard' : '/login'} style={{
              padding: '10px 16px',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)'
            }}>
              {token ? 'Open Dashboard' : 'Log in'}
            </Link>
            <Link to={token ? '/dashboard' : '/register'} style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent)',
              color: 'var(--text-inverse)',
              fontWeight: 600
            }}>
              {token ? 'Continue Writing' : 'Get Started'}
            </Link>
          </div>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
          gap: '32px',
          alignItems: 'stretch'
        }}>
          <div style={{
            padding: '40px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '24px',
            background: 'linear-gradient(145deg, rgba(232,197,71,0.1), rgba(255,255,255,0.02) 40%, rgba(255,255,255,0) 100%), var(--bg-surface)'
          }}>
            <p style={{
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: '0.78rem',
              marginBottom: '18px'
            }}>
              Write faster
            </p>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.8rem, 6vw, 5.1rem)',
              lineHeight: 0.96,
              marginBottom: '22px'
            }}>
              Documents that feel fluid from the first keystroke.
            </h1>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1.08rem',
              lineHeight: 1.8,
              maxWidth: '60ch',
              marginBottom: '30px'
            }}>
              Create block-based notes, turn text into headings instantly, auto-save everything, and share documents with a public read-only link.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <Link to={token ? '/dashboard' : '/register'} style={{
                padding: '14px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent)',
                color: 'var(--text-inverse)',
                fontWeight: 700
              }}>
                {token ? 'Go To Workspace' : 'Create Account'}
              </Link>
              <Link to={token ? '/dashboard' : '/login'} style={{
                padding: '14px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)'
              }}>
                {token ? 'Open Current Documents' : 'Open Existing Workspace'}
              </Link>
            </div>
          </div>

          <div style={{
            padding: '28px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '24px',
            background: 'var(--bg-surface)',
            display: 'grid',
            gap: '16px'
          }}>
            {[
              {
                title: 'Turn text into headings',
                body: 'Use the new inline block-type control to convert a written paragraph into Heading 1, Heading 2, todo, code, and more.'
              },
              {
                title: 'Paste long notes cleanly',
                body: 'Multi-line paste splits content into separate blocks so meeting notes and copied drafts stay organized.'
              },
              {
                title: 'Share safely',
                body: 'Generate a public read-only link for quick review without giving editing access to anyone else.'
              }
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  padding: '18px 18px 20px',
                  borderRadius: '18px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <h2 style={{ fontSize: '1rem', marginBottom: '8px' }}>{item.title}</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
