import React, { useState, useEffect, type ChangeEvent } from "react";
import { MeshCardanoBrowserWallet } from "@meshsdk/wallet";
import "./Login.css";
import { resolveRewardAddress } from "@meshsdk/core";

interface LoginProps {
  onLogin: (user: object) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>("Disconnected");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getAvailableWallets = async () => {
      const wallets = await MeshCardanoBrowserWallet.getInstalledWallets();
      setAvailableWallets(wallets.map((w) => w.name));
    };
    getAvailableWallets();
  }, []);

  const handleSelectedWalletChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedWallet(e.target.value);
  };

  const connectWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWallet === "Disconnected") {
      alert("Please select a wallet first!");
      return;
    }

    setLoading(true);
    try {
      const wallet = await MeshCardanoBrowserWallet.enable(selectedWallet);
      const rewardAddresses = await wallet.getRewardAddresses();
      const stakeAddress = rewardAddresses[0];
      if (!stakeAddress) throw new Error("No stake address found");

      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stake_address: stakeAddress }),
      });
      if (!nonceRes.ok) throw new Error("Failed to get nonce");
      const { nonce } = await nonceRes.json();

      const signedMessage = await wallet.signData(stakeAddress, nonce);

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stake_address: stakeAddress,
          signed_message: JSON.stringify(signedMessage),
        }),
      });
      if (!verifyRes.ok) throw new Error("Failed to verify signature");
      const { user } = await verifyRes.json();

      onLogin(user);
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    } finally {
      setLoading(false);
    }
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
                  Select your Cardano wallet to start splitting bills securely.
                </p>
              </div>

              <form className="login-form" onSubmit={connectWallet}>
                <label className="login-label">Select Wallet</label>
                <select
                  className="login-input"
                  style={{ cursor: "pointer", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-outline)", backgroundColor: "var(--color-surface)", color: "var(--color-on-surface)" }}
                  value={selectedWallet}
                  onChange={handleSelectedWalletChange}
                  disabled={loading}
                >
                  <option value="Disconnected">-- Select a wallet --</option>
                  {availableWallets.map((w, i) => (
                    <option key={i} value={w}>{w}</option>
                  ))}
                </select>

                <button className="login-submit" type="submit" disabled={loading}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
                    account_balance_wallet
                  </span>
                  {loading ? "Connecting..." : "Connect Wallet"}
                </button>

                <div className="login-divider">
                  <span>some useful information</span>
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