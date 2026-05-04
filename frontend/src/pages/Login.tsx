import React, { useState } from "react";
import "./Login.css";

interface LoginProps {
  onLogin: (walletAddress: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [walletInput, setWalletInput] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = walletInput.trim();
    if (!trimmed) return;
    onLogin(trimmed);
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="login-header-inner">
          <div className="login-logo">EqualiFi</div>
          <div className="login-header-actions">
            <button className="login-icon-btn" aria-label="Wallet">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </button>
            <button className="login-icon-btn" aria-label="Notifications">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </div>
      </header>

      <main className="login-main">
        <div className="login-shell">
          <section className="login-left">
            <div className="login-badge">Web3 Powered Transparency</div>
            <h1 className="login-title">
              Welcome to <span>Splitwise</span>
            </h1>
            <p className="login-subtitle">
              The next generation of financial clarity. Seamlessly manage shared expenses on the
              Cardano blockchain with precision, privacy, and zero fees.
            </p>

            <div className="login-glass">
              <div className="login-glass-row">
                <div className="login-glass-icon">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
                    security
                  </span>
                </div>
                <div>
                  <p className="login-glass-title">Decentralized Trust</p>
                  <p className="login-glass-sub">End-to-end encrypted splits</p>
                </div>
              </div>
              <div className="login-progress">
                <span />
              </div>
            </div>
          </section>

          <section className="login-right">
            <div className="login-card">
              <div className="login-card-header">
                <h2 className="text-headline-sm">Sign In</h2>
                <p className="text-body-md" style={{ color: "var(--color-on-surface-variant)" }}>
                  Enter your Cardano wallet address to start splitting bills securely.
                </p>
              </div>

              <form className="login-form" onSubmit={handleSubmit}>
                <label className="login-label">Cardano Wallet Address</label>
                <input
                  className="login-input"
                  type="text"
                  placeholder="addr1..."
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                />
                <button className="login-submit" type="submit">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
                    account_balance_wallet
                  </span>
                  Continue with Wallet
                </button>

                <div className="login-divider">
                  <span>or information</span>
                </div>

                <div className="login-info-grid">
                  <a className="login-info-card" href="#">
                    <span className="material-symbols-outlined">help_outline</span>
                    <span>What is a wallet?</span>
                  </a>
                  <a className="login-info-card" href="#">
                    <span className="material-symbols-outlined">rocket_launch</span>
                    <span>New to Cardano?</span>
                  </a>
                </div>
              </form>

              <div className="login-footer">
                <div className="login-avatars">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0xktaip8ZY4ya0O_Am9IK8F0qrKJBtEM1Ep19YBpFUb-9Qkzh5zd2-JlEXBQST6zbinpyw-LEdGisw85iBNAw9jzfNW48m-lUlx2TburWdNFPwxp9-6q-BL4SEBFYMcMWdefvz6imO4OPOsYG8PtdGCXhOvV6Af1_R4Z2a8270WQ39iilr-E2Tj97OEKTWH3M_awlCVKdKhVnqphgNt0OujU3hmRmKX8acgHsu3xUpJO__Oo047FIVE23TP1Q_8_iMSG7XCAdhTZY"
                    alt="User"
                  />
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtmbCGucIYFkLduh_EMN1V0O1p75u2hf43j1bVGV0u03-jM3WC9oYLMwFgBYtMvkN5pM4HtIEaBq7cg_vRyPedfE_3eQoIcFNj0Rdum2Bwpa0Vs-XBXaKy35QNgbDsjchW68L3xG0E85DJWw99MldRBt2QVrwQdbiGdQzWsxidFH44GAIsa_5lV8lHySCu7LKv6gXobuA9Xl234U6P6uTVNbQTUn4JJ4oI2PQtsLGf9QfE7w3VUJr-QgJOuTcU0OLQaj5MmypfnwLB"
                    alt="User"
                  />
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMJwQYhTPveWVnMxTPbAT2DUz8csFtdFefyUYVMXBwzJu3R29qp_rBzSy-h3rvxGxB7L2Lz2DZBBb7wOhVXre5K5iM3TdGDPgfcL8kgjFxtYeBobZV8Ue7vwdRynPb097c4pOdRxuTuBhEyTD_19hCbSoMJ6BoCmB5dPwfJavwBQ3CKHNfDVWE72aSG_n5Kmv7XUmp8SKB8R-OQfGTqVxxI1uT9tjU-86aJ-IO58IG4ZChy9dgUjya-rGHsJQg2-hb-bV5qbtj3CLj"
                    alt="User"
                  />
                </div>
                <p>
                  Joined by 10k+ users managing <strong>1.2M ADA</strong>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <div className="login-accent" aria-hidden="true">
        <div className="login-accent-ring" />
        <div className="login-accent-ring login-accent-ring-sm" />
      </div>
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg-top" />
        <div className="login-bg-bottom" />
      </div>
    </div>
  );
};

export default Login;
