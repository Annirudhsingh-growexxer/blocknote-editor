import React from 'react';

export default function Footer() {
  return (
    <footer className="home-footer">
      <div className="home-footer-inner">
        <div className="footer-brand">
          <div className="home-logo footer-logo">BlockNote</div>
          <p className="footer-tagline">Write faster, think clearer.<br />Your notes, structured beautifully.</p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <span className="footer-col-title">Product</span>
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Changelog</a>
          </div>
          <div className="footer-col">
            <span className="footer-col-title">Support</span>
            <a href="#">Help</a>
            <a href="#">FAQ</a>
            <a href="#">Contact</a>
          </div>
          <div className="footer-col">
            <span className="footer-col-title">Legal</span>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </div>

      <div className="footer-wordmark">BlockNote</div>
    </footer>
  );
}
