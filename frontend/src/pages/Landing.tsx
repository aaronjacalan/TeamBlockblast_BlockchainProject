import React from "react";
import "./Landing.css";

interface LandingProps {
  onGetStarted: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
  return (
    <main className="landing">
      {/* ── Hero ─────────────────────────────── */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-badge">
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 14,
                  fontVariationSettings: '"FILL" 1',
                  color: "var(--color-tertiary)",
                }}
              >
                bolt
              </span>
              <span>FairShare</span>
            </div>

            <h1 className="hero-headline">
              Split Expenses with{" "}
              <span className="hero-headline-accent">Blockchain</span> Precision.
            </h1>

            <p className="hero-body">
              The ultimate expense tracking utility for splitting bills with friends.
              Manage group costs off-chain with lightning speed and settle
              instantly with ease.
            </p>

            <div className="hero-cta">
              <button className="btn btn-hero-primary" onClick={onGetStarted}>
                Get Started
              </button>

            </div>

            <div className="hero-trust">
              {[
                { icon: "verified", label: "Audit Verified" },
                { icon: "public", label: "Open Source" },
              ].map(({ icon, label }) => (
                <div key={label} className="hero-trust-item">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {icon}
                  </span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-wrap">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6fqgQzz19-JExa3l_dz6KL9M2zYaQotLTUsLLbjFflR4xdjHF5XJXC2HMXDpUL8vYuk7zL_pSN_nx82e8tWai0Vu2315pfPscItP-FfRFvHuvtTtO6m3EtbPKh8sm_TFDiWh9nTMKuUcXQCvs_IN1JR-yQXHW5JWVmWz4mDdujMhmB6WMLvGWQX3qjWaPSBbF4x5i0ssKqRHm4npQhmcb12XXKvRp3huLhPvVDLZOeGExlz-cgqSsLtzUHyyiQQC1bFHdjxuEceua"
                alt="FairShare wallet interface"
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1) contrast(1.25)" }}
              />
            </div>
            <div className="hero-float-card">
              <div className="hero-float-card-top">
                <div className="hero-float-icon">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: '"FILL" 1', color: "var(--color-tertiary)" }}
                  >
                    account_balance_wallet
                  </span>
                </div>
                <span className="text-label-sm" style={{ color: "var(--color-zinc-400)" }}>
                  Active
                </span>
              </div>
              <p className="text-label-sm" style={{ color: "var(--color-zinc-500)", marginBottom: 4 }}>
                Total Balance
              </p>
              <p className="text-data-display">₱4,250.00</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits Bento ───────────────────── */}
      <section className="benefits">
        <div className="container">
          <div className="benefits-header">
            <h2 className="text-headline-lg">Engineered for Financial Clarity</h2>
            <p className="text-body-md" style={{ color: "var(--color-zinc-500)" }}>
              Built to handle complex splits with zero friction, combining web3
              security with traditional utility.
            </p>
          </div>

          <div className="benefits-grid">
            {/* Feature 1 – wide */}
            <div className="benefit-card benefit-card-wide">
              <div className="benefit-card-content">
                <div className="benefit-icon-wrap">
                  <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                    speed
                  </span>
                </div>
                <h3 className="text-headline-md">Off-Chain Velocity</h3>
                <p className="text-body-md" style={{ color: "var(--color-zinc-500)", marginTop: 12 }}>
                  Track every dinner, trip, and shared bill instantly. Our
                  off-chain ledger ensures lightning-fast updates without waiting
                  for block confirmations or paying gas for every entry.
                </p>
              </div>
              <div className="benefit-card-footer">
                <hr className="divider" style={{ flex: 1 }} />
                <span
                  className="text-label-md"
                  style={{ color: "var(--color-tertiary)", letterSpacing: "0.1em" }}
                >
                  REAL-TIME SYNCING
                </span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="benefit-card">
              <div className="benefit-icon-wrap">
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                  security
                </span>
              </div>
              <h3 className="text-headline-md" style={{ marginTop: 24 }}>
                Non-Custodial
              </h3>
              <p
                className="text-body-md"
                style={{ color: "var(--color-zinc-500)", marginTop: 12 }}
              >
                Your funds, your keys. We never touch your money. Settlement
                happens directly between friends.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="benefit-card">
              <div className="benefit-icon-wrap">
                <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                  analytics
                </span>
              </div>
              <h3 className="text-headline-md" style={{ marginTop: 24 }}>
                Transparent
              </h3>
              <p
                className="text-body-md"
                style={{ color: "var(--color-zinc-500)", marginTop: 12 }}
              >
                Immutable history for all group transactions. Everyone sees the
                same data, ensuring absolute trust and accountability.
              </p>
            </div>

            {/* Feature 4 – wide dark */}
            <div className="benefit-card benefit-card-wide benefit-card-dark">
              <div className="benefit-card-content">
                <h3 className="text-headline-md" style={{ color: "#fff" }}>
                  Global Settlement
                </h3>
                <p
                  className="text-body-md"
                  style={{ color: "#a1a1aa", marginTop: 12, maxWidth: 400 }}
                >
                  Settle up with anyone, anywhere. One click converts your
                  balance into a simple settlement. No more bank
                  transfers or awkward requests across borders.
                </p>
                <button
                  className="benefit-explore-btn"
                  style={{ marginTop: 28 }}
                  onClick={onGetStarted}
                >
                  EXPLORE SETTLEMENT LOGIC
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    arrow_forward
                  </span>
                </button>
              </div>
              <div className="benefit-card-dark-bg">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDI85YkGrEsKNC09jSnRp4jrOYOK8pAxJg6AaL3gKVerIqztSTiuctK1hQqjjjsOz3jHjxwEovA9XkrEx_zPUe6ik4Rfw9e5MNn5kA4FwW5dXVZTlNdk6HpLMno867ANwwHpNstg3zlErwUtvF8QxzdpjOl86e2HAq8VdzxlNrkZ7GI3wCJ3jVgLlufzCb09oLGOLL3exV9L02aPzYKJgAE38RJ1wnQYEcpr0ygnPJAV_I3AEfUurJR2A0b8vLxMQAr1QCDK2s2q7US"
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", transform: "rotate(12deg)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────── */}
      <section className="how-it-works">
        <div className="container how-grid">
          <div className="how-copy">
            <h2 className="text-headline-lg">
              Simple tracking for complex lives.
            </h2>

            <div className="how-steps">
              {[
                {
                  num: "01",
                  title: "Create a Group",
                  body: "Add friends by name or email. Set your group and start tracking expenses immediately.",
                },
                {
                  num: "02",
                  title: "Log Expenses",
                  body: "Quickly enter amounts and split them equally, by percentage, or exact shares. Attach receipts for full transparency.",
                },
                {
                  num: "03",
                  title: "Settle with One Tap",
                  body: "The app calculates the minimum number of settlements needed. Confirm, settle up, and you're done.",
                },
              ].map(({ num, title, body }) => (
                <div key={num} className="how-step">
                  <span
                    className="text-data-display"
                    style={{ color: "var(--color-tertiary)", fontSize: 36, minWidth: 56 }}
                  >
                    {num}
                  </span>
                  <div>
                    <h4 className="text-headline-sm">{title}</h4>
                    <p
                      className="text-body-md"
                      style={{ color: "var(--color-zinc-500)", marginTop: 6 }}
                    >
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="how-mockup">
            <div className="how-mockup-inner card card-p">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <h5 className="text-headline-sm">London Trip 🇬🇧</h5>
                <span className="badge badge-green">In Progress</span>
              </div>

              <div className="how-expense-list">
                {[
                  { icon: "restaurant", name: "Dinner at Sketch", paidBy: "Alice", amount: "₱240.00" },
                  { icon: "hotel", name: "Hotel Booking", paidBy: "You", amount: "₱1,150.00" },
                ].map(({ icon, name, paidBy, amount }) => (
                  <div key={name} className="how-expense-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="how-expense-icon">
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-zinc-400)" }}>
                          {icon}
                        </span>
                      </div>
                      <div>
                        <p className="text-label-md" style={{ color: "#000" }}>{name}</p>
                        <p style={{ fontSize: 10, color: "var(--color-zinc-400)", marginTop: 2 }}>
                          Paid by {paidBy}
                        </p>
                      </div>
                    </div>
                    <span className="text-label-md">{amount}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid var(--color-zinc-100)",
                }}
              >
                <div>
                  <p style={{ fontSize: 12, color: "var(--color-zinc-400)" }}>You are owed</p>
                  <p
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: "var(--color-tertiary)",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    ₱450.00
                  </p>
                </div>
                <button className="btn btn-dark" style={{ padding: "8px 16px", fontSize: 13 }}>
                  Settle
                </button>
              </div>

              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "var(--color-zinc-500)",
                    marginBottom: 8,
                  }}
                >
                  <span>Manual Split</span>
                  <span>60% / 40%</span>
                </div>
                <div className="how-split-bar">
                  <div
                    className="how-split-purple"
                    style={{ width: "60%" }}
                  />
                  <div
                    className="how-split-dark"
                    style={{ width: "40%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-glow" />
            <div className="cta-content">
              <h2 className="cta-headline">Ready to settle the score?</h2>
              <p className="cta-body">
                Join thousands of users who have upgraded their group
                finances with FairShare.
              </p>
              <button className="btn btn-xl-purple" onClick={onGetStarted}>
                Get Started for Free
              </button>
              <p className="cta-wallets">
                Free to use. No registration required to get started.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Landing;
