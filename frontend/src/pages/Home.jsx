import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import Footer from '../components/layout/Footer';

export default function Home() {
  const rawToken = localStorage.getItem('accessToken');
  const token = rawToken && rawToken !== 'undefined' && rawToken !== 'null' ? rawToken : null;

  return (
    <div className="home-container">
      {/* Dynamic Background Glows */}
      <div className="home-bg-glow"></div>
      <div className="home-bg-glow-2"></div>

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
        {[
          {
            icon: '⚡️',
            title: 'Turn text into headings',
            body: 'Use our powerful inline block-type control (just type "/") to instantly convert a written paragraph into Headings, Todo lists, Code chunks, and more.'
          },
          {
            icon: '📋',
            title: 'Paste long notes cleanly',
            body: 'Multi-line paste automatically splits your copied content into separate native blocks so meeting notes and drafts instantly remain organized.'
          },
          {
            icon: '🔒',
            title: 'Share publicly & safely',
            body: 'Never worry about accidental edits. Generate a single public read-only link for quick review without giving modification access to anyone else.'
          }
        ].map((item) => (
          <div key={item.title} className="feature-card">
            <div className="feature-icon">{item.icon}</div>
            <h2 className="feature-title">{item.title}</h2>
            <p className="feature-body">{item.body}</p>
          </div>
        ))}
      </section>

      <section className="showcase-section">
        <div className="showcase-copy">
          <p className="showcase-label">Secure task management for teams</p>
          <h2 className="showcase-heading">Work on big ideas, without the busywork.</h2>
          <p className="showcase-description">
            From the small stuff to the big picture, BlockNote organizes work so teams know what to do, why it matters, and how to get it done.
          </p>
        </div>

        <div className="showcase-panels">
          <article className="showcase-panel panel-pink">
            <div className="panel-heading">On going Project</div>
            <div className="panel-avatar-row">
              <span className="panel-avatar">B</span>
              <div className="panel-line-group">
                <span className="panel-line panel-line-short"></span>
                <span className="panel-line panel-line-long"></span>
              </div>
            </div>
            <ul className="panel-list">
              <li>New Brand</li>
              <li>Product Road Map</li>
            </ul>
            <div className="panel-line-group panel-line-group-compact">
              <span className="panel-line"></span>
              <span className="panel-line panel-line-short"></span>
            </div>
          </article>

          <article className="showcase-panel panel-yellow">
            <div className="panel-heading">Daily Activity</div>
            <div className="task-list">
              <div className="task-row">
                <span className="task-dot filled"></span>
                <span>Review meeting notes</span>
              </div>
              <div className="task-row">
                <span className="task-dot filled"></span>
                <span>Plan next launch</span>
              </div>
              <div className="task-row">
                <span className="task-dot"></span>
                <span>Share updates with team</span>
              </div>
            </div>
          </article>

          <article className="showcase-panel panel-purple">
            <div className="panel-heading">Live Conversation</div>
            <div className="chat-row">
              <span className="panel-avatar">A</span>
              <div className="chat-block">
                <span className="chat-line"></span>
                <span className="chat-line chat-line-short"></span>
              </div>
            </div>
            <div className="chat-row">
              <span className="panel-avatar">C</span>
              <div className="chat-block">
                <span className="chat-line"></span>
                <span className="chat-line chat-line-short"></span>
              </div>
            </div>
          </article>
        </div>

        <div className="showcase-metrics">
          <div className="metric-item">
            <strong>Secure</strong>
            <span>and compliant</span>
          </div>
          <div className="metric-item">
            <strong>4 Million</strong>
            <span>and compliant</span>
          </div>
          <div className="metric-item">
            <strong>Editor's Choice</strong>
            <span>iOS App Store</span>
          </div>
          <div className="metric-item">
            <strong>4.7 Stars</strong>
            <span>Google Play Store</span>
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
