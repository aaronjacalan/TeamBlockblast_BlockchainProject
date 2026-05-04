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
      <main className="login-main">
        <div className="login-shell">
          <section className="login-left">
            <div className="login-badge">Web3 Powered Transparency</div>
            <h1 className="login-title">
              Welcome to <span>FairShare</span>
            </h1>
            <p className="login-subtitle">
              The next generation of financial clarity. Seamlessly manage shared expenses on the
              Cardano blockchain with precision, privacy, and zero fees.
            </p>

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
                  <a
                    className="login-info-card"
                    href="https://www.blockchain.com/learning-portal/lessons/crypto-wallets?utm_source=blog&utm_medium=footer&utm_campaign=footer_what_is_crypto_wallet"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="material-symbols-outlined">help_outline</span>
                    <span>What is a wallet?</span>
                  </a>
                  <a
                    className="login-info-card"
                    href="https://cardano.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="material-symbols-outlined">rocket_launch</span>
                    <span>What is Cardano?</span>
                  </a>
                </div>
              </form>
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
