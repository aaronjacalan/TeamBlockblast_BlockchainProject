import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">FairShare</span>
          <p className="footer-copy">© 2024 FairShare. Built on Cardano.</p>
        </div>

        <nav className="footer-links">
          {["Security", "Terms", "API", "Status"].map((link) => (
            <a key={link} href="#">
              {link}
            </a>
          ))}
        </nav>

        <div className="footer-social">
          <button className="social-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              share
            </span>
          </button>
          <button className="social-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              code
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
