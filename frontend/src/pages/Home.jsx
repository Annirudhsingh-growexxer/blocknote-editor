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

      <Footer />
    </div>
  );
}
