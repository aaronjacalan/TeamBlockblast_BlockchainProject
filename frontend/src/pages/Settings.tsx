import React, { useState } from "react";

type Page = "landing" | "dashboard" | "groups" | "group-details" | "create-group" | "settings";

interface SettingsProps {
  displayName: string;
  onDisplayNameChange: (name: string) => void;
  onNavigate: (page: Page) => void;
}

const Settings: React.FC<SettingsProps> = ({ displayName, onDisplayNameChange, onNavigate }) => {
  const [nameInput, setNameInput] = useState(displayName);
  const [email, setEmail] = useState("aditya@email.com");
  const [saved, setSaved] = useState(false);
  const [groupActivity, setGroupActivity] = useState(true);
  const [settlements, setSettlements] = useState(true);

  const handleSave = () => {
    onDisplayNameChange(nameInput.trim() || displayName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = nameInput
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="page-offset">
      <div className="container" style={{ maxWidth: 960, paddingTop: 48, paddingBottom: 80 }}>
        {/* Page Header */}
        <div style={{ marginBottom: 40 }}>
          <button
            onClick={() => onNavigate("dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-zinc-500)",
              fontSize: 14,
              fontFamily: "var(--font-family)",
              marginBottom: 20,
              padding: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            Back to Dashboard
          </button>
          <h1 className="text-headline-lg">Settings</h1>
          <p className="text-body-md" style={{ color: "var(--color-zinc-500)", marginTop: 6 }}>
            Manage your account preferences and notification settings.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, maxWidth: 720 }}>
          {/* Profile Section */}
          <section className="card" style={{ padding: 32 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
              <div>
                <h2 className="text-headline-sm">Profile Identity</h2>
                <p className="text-label-sm" style={{ color: "var(--color-zinc-500)", marginTop: 4 }}>
                  How you appear to other members in groups.
                </p>
              </div>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "var(--color-tertiary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  fontFamily: "var(--font-family)",
                }}
              >
                {initials || "?"}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--color-on-surface)",
                    marginBottom: 8,
                  }}
                >
                  Display Name
                </label>
                <input
                  style={{
                    width: "100%",
                    borderTop: "none",
                    borderLeft: "none",
                    borderRight: "none",
                    borderBottom: "2px solid var(--color-zinc-200)",
                    outline: "none",
                    padding: "8px 0",
                    fontSize: 16,
                    fontFamily: "var(--font-family)",
                    background: "transparent",
                    color: "var(--color-on-surface)",
                    transition: "border-color 0.15s",
                    boxSizing: "border-box",
                  }}
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--color-tertiary)")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "var(--color-zinc-200)")}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--color-on-surface)",
                    marginBottom: 8,
                  }}
                >
                  Email Address
                </label>
                <input
                  style={{
                    width: "100%",
                    borderTop: "none",
                    borderLeft: "none",
                    borderRight: "none",
                    borderBottom: "2px solid var(--color-zinc-200)",
                    outline: "none",
                    padding: "8px 0",
                    fontSize: 16,
                    fontFamily: "var(--font-family)",
                    background: "transparent",
                    color: "var(--color-on-surface)",
                    transition: "border-color 0.15s",
                    boxSizing: "border-box",
                  }}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={(e) => (e.currentTarget.style.borderBottomColor = "var(--color-tertiary)")}
                  onBlur={(e) => (e.currentTarget.style.borderBottomColor = "var(--color-zinc-200)")}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 8 }}>
                <button
                  className="btn btn-dark"
                  onClick={handleSave}
                  style={{ minWidth: 120 }}
                >
                  {saved ? (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                      Saved!
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
                {saved && (
                  <p style={{ fontSize: 13, color: "var(--color-tertiary)", fontWeight: 600 }}>
                    Your display name has been updated.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="card" style={{ padding: 32 }}>
            <h2 className="text-headline-sm" style={{ marginBottom: 6 }}>Notifications</h2>
            <p className="text-label-sm" style={{ color: "var(--color-zinc-500)", marginBottom: 24 }}>
              Choose when you want to be alerted about activity.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                {
                  key: "groupActivity",
                  title: "Group Activity",
                  desc: "Get notified when someone adds a new expense to your groups.",
                  value: groupActivity,
                  onChange: setGroupActivity,
                },
                {
                  key: "settlements",
                  title: "Settlements",
                  desc: "Alert me when a peer confirms a settlement.",
                  value: settlements,
                  onChange: setSettlements,
                },
              ].map(({ key, title, desc, value, onChange }, i, arr) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--color-zinc-100)" : "none",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#000" }}>{title}</p>
                    <p style={{ fontSize: 13, color: "var(--color-zinc-500)", marginTop: 3 }}>{desc}</p>
                  </div>
                  <label style={{ position: "relative", display: "inline-flex", alignItems: "center", cursor: "pointer", flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => onChange(e.target.checked)}
                      style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                    />
                    <div
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        background: value ? "var(--color-tertiary)" : "var(--color-zinc-200)",
                        transition: "background 0.2s",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 3,
                          left: value ? 23 : 3,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#fff",
                          transition: "left 0.2s",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                      />
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </section>

          {/* Privacy Section */}
          <section className="card" style={{ padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span className="material-symbols-outlined" style={{ color: "var(--color-on-surface)" }}>privacy_tip</span>
              <h2 className="text-headline-sm">Privacy</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {["Public Profile Visibility", "Transaction Privacy", "Manage Blocked Users"].map((item) => (
                <button
                  key={item}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid var(--color-zinc-100)",
                    cursor: "pointer",
                    fontFamily: "var(--font-family)",
                    fontSize: 15,
                    color: "var(--color-on-surface)",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-tertiary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-on-surface)")}
                >
                  {item}
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span>
                </button>
              ))}
            </div>
          </section>

          {/* Support */}
          <section className="card" style={{ padding: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ color: "var(--color-on-surface)" }}>help</span>
              <h2 className="text-headline-sm">Support</h2>
            </div>
            <p className="text-label-sm" style={{ color: "var(--color-zinc-500)", marginBottom: 20 }}>
              Need help with a split or a transaction? Our team is here to assist.
            </p>
            <a
              href="#"
              style={{
                display: "block",
                textAlign: "center",
                border: "1px solid var(--color-on-surface)",
                padding: "12px 0",
                fontFamily: "var(--font-family)",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: "var(--color-on-surface)",
                textDecoration: "none",
                borderRadius: 4,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-on-surface)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--color-on-surface)";
              }}
            >
              Contact Support
            </a>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Settings;
