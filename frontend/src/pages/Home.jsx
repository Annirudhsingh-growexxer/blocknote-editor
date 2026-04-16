import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ClipboardList, Lock } from 'lucide-react';
import './Home.css';
import Footer from '../components/layout/Footer';

export default function Home() {
  const rawToken = localStorage.getItem('accessToken');
  const token = rawToken && rawToken !== 'undefined' && rawToken !== 'null' ? rawToken : null;

  const features = [
    {
      Icon: Zap,
      title: 'Turn text into headings',
      body: 'Use our powerful inline block-type control (just type "/") to instantly convert a written paragraph into Headings, Todo lists, Code chunks, and more.'
    },
    {
      Icon: ClipboardList,
      title: 'Paste long notes cleanly',
      body: 'Multi-line paste automatically splits your copied content into separate native blocks so meeting notes and drafts instantly remain organized.'
    },
    {
      Icon: Lock,
      title: 'Share publicly & safely',
      body: 'Never worry about accidental edits. Generate a single public read-only link for quick review without giving modification access to anyone else.'
    }
  ];

  return (
    <div className="home-container">
      <div className="home-bg-glow" aria-hidden="true"></div>
      <div className="home-bg-grid" aria-hidden="true"></div>

      <header className="home-header">
        <div className="home-logo">BlockNote</div>

        <div className="nav-buttons">
          {token ? (
            <Link to="/dashboard" className="btn-primary">Open Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Login</Link>
              <Link to="/register" className="btn-primary">Register</Link>
            </>
          )}
        </div>
      </header>

      <section className="home-hero">
        <div className="badge">Write Faster, Think Clearer</div>

        <h1 className="home-title">
          Documents that feel fluid from the first keystroke.
        </h1>

        <p className="home-subtitle">
          Create block-based notes, turn text into headings instantly, auto-save everything silently, and share documents with a public read-only link. Built for speed.
        </p>

        <div className="hero-buttons">
          {token ? (
            <Link to="/dashboard" className="btn-primary btn-hero-primary">Go To Workspace</Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary btn-hero-primary">Create an Account</Link>
              <Link to="/login" className="btn-secondary btn-hero-secondary">Login to Existing Workspace</Link>
            </>
          )}
        </div>
      </section>

      <section className="feature-grid">
        {features.map(({ Icon, title, body }) => (
          <div key={title} className="feature-card">
            <div className="feature-icon">
              <Icon size={22} strokeWidth={1.75} />
            </div>
            <h2 className="feature-title">{title}</h2>
            <p className="feature-body">{body}</p>
          </div>
        ))}
      </section>

      <section className="showcase-section">
        <div className="showcase-copy">
          <p className="showcase-label">Everything a modern editor needs</p>
          <h2 className="showcase-heading">Write, organise, and share — all in one place.</h2>
          <p className="showcase-description">
            Block-based writing, instant slash commands, auto-saved drafts, and one-click public sharing. BlockNote keeps your ideas structured from the first keystroke.
          </p>
        </div>

        <div className="showcase-panels">

          {/* Panel 1 — Block Editor */}
          <article className="showcase-panel panel-pink">
            <div className="panel-heading">Block Editor</div>

            {/* Fake heading block */}
            <div className="bn-block-row">
              <span className="bn-block-type-tag">H1</span>
              <span className="bn-block-text bn-block-text-heading">Product Roadmap</span>
            </div>

            {/* Fake paragraph block */}
            <div className="bn-block-row">
              <span className="bn-block-type-tag">¶</span>
              <span className="bn-block-text">Outline the key milestones and deliverables for Q3. Keep each goal measurable and time-boxed.</span>
            </div>

            {/* Fake todo blocks */}
            <div className="bn-block-row">
              <span className="bn-block-type-tag">☑</span>
              <span className="bn-block-text"><span className="bn-todo-check bn-todo-done">✓</span> Define MVP scope</span>
            </div>
            <div className="bn-block-row">
              <span className="bn-block-type-tag">☑</span>
              <span className="bn-block-text"><span className="bn-todo-check">○</span> Design block editor UX</span>
            </div>
            <div className="bn-block-row">
              <span className="bn-block-type-tag">☑</span>
              <span className="bn-block-text"><span className="bn-todo-check">○</span> Ship public share links</span>
            </div>

            {/* Fake slash hint */}
            <div className="bn-slash-hint">Type <kbd>/</kbd> for headings, todos, code &amp; more</div>
          </article>

          {/* Panel 2 — Auto-Save & Documents */}
          <article className="showcase-panel panel-yellow">
            <div className="panel-heading">Auto-Save</div>

            {/* Fake save indicator */}
            <div className="bn-save-row">
              <span className="bn-save-dot bn-save-dot-saved"></span>
              <span className="bn-save-label">All changes saved</span>
              <span className="bn-save-time">just now</span>
            </div>

            {/* Fake document list */}
            <div className="bn-doc-list">
              <div className="bn-doc-item bn-doc-active">
                <span className="bn-doc-icon">📄</span>
                <div className="bn-doc-info">
                  <span className="bn-doc-title">Product Roadmap</span>
                  <span className="bn-doc-meta">Editing now</span>
                </div>
                <span className="bn-doc-badge">Saved</span>
              </div>
              <div className="bn-doc-item">
                <span className="bn-doc-icon">📄</span>
                <div className="bn-doc-info">
                  <span className="bn-doc-title">Meeting Notes — Apr 15</span>
                  <span className="bn-doc-meta">2 hours ago</span>
                </div>
              </div>
              <div className="bn-doc-item">
                <span className="bn-doc-icon">📄</span>
                <div className="bn-doc-info">
                  <span className="bn-doc-title">Design System Draft</span>
                  <span className="bn-doc-meta">yesterday</span>
                </div>
              </div>
              <div className="bn-doc-item">
                <span className="bn-doc-icon">📄</span>
                <div className="bn-doc-info">
                  <span className="bn-doc-title">Sprint Retrospective</span>
                  <span className="bn-doc-meta">3 days ago</span>
                </div>
              </div>
            </div>

            <div className="bn-slash-hint" style={{ color: 'rgba(0,0,0,0.55)' }}>Saves 1 s after you stop typing. No manual save needed.</div>
          </article>

          {/* Panel 3 — Read-only Share */}
          <article className="showcase-panel panel-purple">
            <div className="panel-heading">Public Share</div>

            {/* Fake share modal */}
            <div className="bn-share-box">
              <div className="bn-share-row">
                <span className="bn-share-icon">🔗</span>
                <div className="bn-share-info">
                  <span className="bn-share-title">Share link active</span>
                  <span className="bn-share-url">blocknote.app/share/a3f9…</span>
                </div>
                <span className="bn-share-active-dot"></span>
              </div>
              <div className="bn-share-pill">👁 View only — no login needed</div>
            </div>

            {/* Fake read-only document preview */}
            <div className="bn-ro-preview">
              <div className="bn-ro-header">
                <span className="bn-ro-logo">BlockNote</span>
                <span className="bn-ro-badge">View only</span>
              </div>
              <div className="bn-ro-title">Product Roadmap</div>
              <div className="bn-ro-line"></div>
              <div className="bn-ro-line bn-ro-line-med"></div>
              <div className="bn-ro-line bn-ro-line-short"></div>
              <div className="bn-ro-line"></div>
              <div className="bn-ro-line bn-ro-line-med"></div>
            </div>

            <div className="bn-slash-hint">Anyone with the link can read. Only you can edit.</div>
          </article>

        </div>

        <div className="showcase-metrics">
          <div className="metric-item">
            <strong>Block-based</strong>
            <span>structured writing</span>
          </div>
          <div className="metric-item">
            <strong>Auto-saved</strong>
            <span>1 s after typing stops</span>
          </div>
          <div className="metric-item">
            <strong>Slash commands</strong>
            <span>7 block types</span>
          </div>
          <div className="metric-item">
            <strong>Public share</strong>
            <span>read-only link, no login</span>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-scatter-badges">
          <span className="scatter-badge sb-1">Block Editor</span>
          <span className="scatter-badge sb-2">Auto Save</span>
          <span className="scatter-badge sb-3">Rich Text</span>
          <span className="scatter-badge sb-4">Public Share</span>
          <span className="scatter-badge sb-5">Slash Commands</span>
          <span className="scatter-badge sb-6">Drag & Drop</span>
          <span className="scatter-badge sb-7">Todo Lists</span>
          <span className="scatter-badge sb-8">Code Blocks</span>
          <span className="scatter-badge sb-9">Headings</span>
        </div>

        <div className="cta-content">
          <h2 className="cta-heading">
            Let's Create an <span className="cta-accent">Amazing Project</span> Together!
          </h2>
          <button className="cta-button">Contact Us</button>
        </div>

        <div className="cta-services-bar">
          <div className="marquee-track">
            {[...Array(2)].map((_, i) => (
              <div className="marquee-content" key={i}>
                <span className="service-item">Block Editor</span>
                <span className="service-separator">✱</span>
                <span className="service-item">Auto Save</span>
                <span className="service-separator">✱</span>
                <span className="service-item">Slash Commands</span>
                <span className="service-separator">✱</span>
                <span className="service-item">Drag & Drop Blocks</span>
                <span className="service-separator">✱</span>
                <span className="service-item">Public Share Links</span>
                <span className="service-separator">✱</span>
                <span className="service-item">Rich Text</span>
                <span className="service-separator">✱</span>
                <span className="service-item">Todo Lists</span>
                <span className="service-separator">✱</span>
                <span className="service-item">Code Blocks</span>
                <span className="service-separator">✱</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
