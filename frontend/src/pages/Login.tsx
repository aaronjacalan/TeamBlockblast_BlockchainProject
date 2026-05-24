import React, { useState, useEffect, type ChangeEvent } from "react";
import { MeshCardanoBrowserWallet } from "@meshsdk/wallet";
import { useWallet } from "@meshsdk/react";
import "./Login.css";

interface LoginProps {
  onLogin: (user: any, walletName: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string>("Disconnected");
  const [loading, setLoading] = useState(false);

  // Profile step state
  const [step, setStep] = useState<"wallet" | "profile">("wallet");
  const [pendingUser, setPendingUser] = useState<object | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ displayName?: string; email?: string }>({});

  const { setWallet } = useWallet();

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
      setWallet(wallet, selectedWallet);
      const rewardAddresses = await wallet.getRewardAddresses();
      const stakeAddress = rewardAddresses[0];
      if (!stakeAddress) throw new Error("No stake address found");

      const paymentAddress = await wallet.getChangeAddressBech32();

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
          payment_address: paymentAddress,
        }),
      });
      if (!verifyRes.ok) throw new Error("Failed to verify signature");
      const { user } = await verifyRes.json();

      // if user already has display name and email, skip profile step
    if (user.display_name && user.email) {
      onLogin(user, selectedWallet);
    } else {
      setPendingUser(user);
      setStep("profile");
    }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateProfile = () => {
    const errors: { displayName?: string; email?: string } = {};
    if (!displayName.trim()) {
      errors.displayName = "Display name is required.";
    }
    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }
    return errors;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateProfile();
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }
    setProfileErrors({});
    setProfileLoading(true);
    try {
      const user = pendingUser as any;

      // save to database
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          display_name: displayName.trim(),
          email: email.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");
      const updatedUser = await res.json();

      onLogin(updatedUser, selectedWallet);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setProfileLoading(false);
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
            {/* ── Step 1: Wallet Connect ── */}
            <div className={`login-card login-card-step ${step === "wallet" ? "login-card-visible" : "login-card-hidden"}`}>
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

            {/* ── Step 2: Profile Setup ── */}
            <div className={`login-card login-card-step ${step === "profile" ? "login-card-visible" : "login-card-hidden"}`}>
              <div className="login-card-header">
                <div className="login-profile-icon">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1', fontSize: "28px", color: "var(--color-tertiary)" }}>
                    person
                  </span>
                </div>
                <h2 className="text-headline-sm" style={{ marginTop: "12px" }}>Set Up Your Profile</h2>
                <p className="text-body-md" style={{ color: "var(--color-on-surface-variant)" }}>
                  Wallet connected! Tell your group who you are.
                </p>
              </div>

              {/* Wallet connected indicator */}
              <div className="login-wallet-badge">
                <span className="material-symbols-outlined" style={{ fontSize: "16px", fontVariationSettings: '"FILL" 1' }}>
                  check_circle
                </span>
                <span>{selectedWallet} connected</span>
              </div>

              <form className="login-form" onSubmit={handleProfileSubmit} noValidate>
                <div className="login-field">
                  <label className="login-label" htmlFor="displayName">Display Name</label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon material-symbols-outlined">badge</span>
                    <input
                      id="displayName"
                      className={`login-input login-input-with-icon${profileErrors.displayName ? " login-input-error" : ""}`}
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (profileErrors.displayName) setProfileErrors((p) => ({ ...p, displayName: undefined }));
                      }}
                      disabled={profileLoading}
                      autoComplete="name"
                    />
                  </div>
                  {profileErrors.displayName && (
                    <p className="login-field-error">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>error</span>
                      {profileErrors.displayName}
                    </p>
                  )}
                </div>

                <div className="login-field">
                  <label className="login-label" htmlFor="email">Email Address</label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon material-symbols-outlined">mail</span>
                    <input
                      id="email"
                      className={`login-input login-input-with-icon${profileErrors.email ? " login-input-error" : ""}`}
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (profileErrors.email) setProfileErrors((p) => ({ ...p, email: undefined }));
                      }}
                      disabled={profileLoading}
                      autoComplete="email"
                    />
                  </div>
                  {profileErrors.email && (
                    <p className="login-field-error">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>error</span>
                      {profileErrors.email}
                    </p>
                  )}
                </div>

                <button className="login-submit" type="submit" disabled={profileLoading} style={{ marginTop: "4px" }}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
                    arrow_forward
                  </span>
                  {profileLoading ? "Saving..." : "Continue to FairShare"}
                </button>

                <button
                  type="button"
                  className="login-back-btn"
                  onClick={() => { setStep("wallet"); setPendingUser(null); }}
                  disabled={profileLoading}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span>
                  Back to wallet selection
                </button>
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