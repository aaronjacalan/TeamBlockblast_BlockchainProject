import React, { useEffect, useRef, useState } from "react";
import "./Landing.css";

interface LandingProps {
  onGetStarted: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);

  /* ── scroll listener for sticky nav blur ── */
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ── auto-cycle feature cards ── */
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  /* ── particle network canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: {
      x: number; y: number;
      vx: number; vy: number;
      size: number; opacity: number;
    }[] = [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`;
        ctx.fill();

        particles.forEach((p2, j) => {
          if (i >= j) return;
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  const features = [
    {
      icon: "👥",
      title: "Create Groups",
      desc: "Spin up expense groups for trips, households, or any crew. Invite members instantly.",
    },
    {
      icon: "⚡",
      title: "Split Instantly",
      desc: "Add a shared expense and FairShare auto-divides it. Equal splits or custom ratios.",
    },
    {
      icon: "🔗",
      title: "Settle on Chain",
      desc: "Balances are recorded on Cardano. Transparent, immutable, and trustless by design.",
    },
  ];

  const steps = [
    { num: "01", label: "Connect Wallet", detail: "Link your Cardano wallet in one tap" },
    { num: "02", label: "Create a Group", detail: "Name it, invite your people" },
    { num: "03", label: "Add Expenses", detail: "Log what you spent and who owes what" },
    { num: "04", label: "Settle Up", detail: "Pay balances directly on-chain" },
  ];

  const stats = [
    { value: "ADA", label: "Powered by Cardano" },
    { value: "0%", label: "Platform fees" },
    { value: "100%", label: "Transparent ledger" },
    { value: "Web3", label: "Native & trustless" },
  ];

  return (
    <main className="landing-root">

      {/* ─── HERO ─── */}
      <section className="landing-hero">
        <canvas ref={canvasRef} className="hero-canvas" />

        <div className="hero-badge">
          <span className="badge-dot" />
          Built on Cardano Blockchain
        </div>

        <h1 className="hero-title">
          Split expenses.
          <br />
          <span className="hero-accent">Trust the chain.</span>
        </h1>

        <p className="hero-sub">
          FairShare brings Splitwise-style group expense splitting to Web3.
          No spreadsheets, no disputes — just transparent, on-chain settlements.
        </p>

        <div className="hero-ctas">
          <button className="primary-cta" onClick={onGetStarted}>
            Get Started Free
            <span className="cta-arrow">→</span>
          </button>
        </div>

        <div className="hero-stats">
          {stats.map((s) => (
            <div key={s.label} className="stat-pill">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PREVIEW CARD ─── */}
      <section className="preview-section">
        <div className="preview-card">
          <div className="preview-header">
            <div className="preview-dots">
              <span className="preview-dot red" />
              <span className="preview-dot amber" />
              <span className="preview-dot green" />
            </div>
            <span className="preview-title">Weekend Trip · Boracay 🏖️</span>
          </div>
          <div className="preview-body">
            <div className="expense-list">
              {[
                { who: "Aaron", what: "Airbnb",     amount: "₱8,400", owed: "split 4 ways" },
                { who: "Mika",  what: "Groceries",  amount: "₱2,100", owed: "split 4 ways" },
                { who: "Jay",   what: "Activities", amount: "₱3,200", owed: "split 4 ways" },
              ].map((e) => (
                <div key={e.what} className="expense-row">
                  <div className="expense-avatar">{e.who[0]}</div>
                  <div className="expense-info">
                    <span className="expense-what">{e.what}</span>
                    <span className="expense-who">Paid by {e.who} · {e.owed}</span>
                  </div>
                  <span className="expense-amount">{e.amount}</span>
                </div>
              ))}
            </div>
            <div className="preview-footer">
              <span className="preview-balance">
                Your balance: <strong>+₱3,425</strong>
              </span>
              <button className="settle-btn" onClick={onGetStarted}>
                Settle on-chain ⬡
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="features-section">
        <div className="section-label">Why FairShare</div>
        <h2 className="section-title">The fairest way to split</h2>
        <p className="section-sub">
          Every peso tracked. Every settlement recorded. No one gets ghosted on their share.
        </p>

        <div className="features-grid">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`feature-card${activeFeature === i ? " active" : ""}`}
              onMouseEnter={() => setActiveFeature(i)}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              {activeFeature === i && <div className="feature-glow" />}
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="how-section">
        <div className="section-label">Simple by design</div>
        <h2 className="section-title">Up and running in minutes</h2>

        <div className="steps-grid">
          {steps.map((s, i) => (
            <div key={s.num} className="step-card">
              <div className="step-connector">
                <span className="step-num">{s.num}</span>
                {i < steps.length - 1 && <div className="step-line" />}
              </div>
              <div className="step-content">
                <h3 className="step-label">{s.label}</h3>
                <p className="step-detail">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TRUST / BLOCKCHAIN ─── */}
      <section className="trust-section">
        <div className="trust-inner">
          <div className="trust-text">
            <div className="section-label">Powered by Cardano</div>
            <h2 className="trust-title">Your money, your rules, your chain</h2>
            <p className="trust-desc">
              FairShare doesn't hold your funds. Balances and settlements are recorded directly on
              the Cardano blockchain — transparent, verifiable, and in your hands.
            </p>
            <ul className="trust-list">
              {[
                "Non-custodial — you own your wallet",
                "On-chain settlement history",
                "No hidden fees or markups",
                "Open-source smart contracts",
              ].map((item) => (
                <li key={item} className="trust-item">
                  <span className="trust-check">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="trust-visual">
            <div className="chain-card">
              <div className="chain-block">
                <span className="chain-label">Block #9,241,881</span>
                <span className="chain-hash">0x7f3a…bc12</span>
                <span className="chain-status">✓ Confirmed</span>
              </div>
              <div className="chain-arrow">↓</div>
              <div className="chain-block">
                <span className="chain-label">Settlement · Aaron → Jay</span>
                <span className="chain-hash">12.5 ADA</span>
                <span className="chain-status">✓ On-chain</span>
              </div>
              <div className="chain-arrow">↓</div>
              <div className="chain-block">
                <span className="chain-label">Block #9,241,882</span>
                <span className="chain-hash">0x2d9f…aa87</span>
                <span className="chain-status">✓ Confirmed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="cta-section">
        <div className="cta-glow" />
        <h2 className="cta-title">Ready to split fairly?</h2>
        <p className="cta-sub">
          Create your first group in under a minute. No crypto experience needed.
        </p>
        <button className="cta-big" onClick={onGetStarted}>
          Start for free →
        </button>
      </section>

    </main>
  );
};

export default Landing;