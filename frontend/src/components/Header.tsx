import React, { useState, useRef, useEffect } from "react";

type Page = "landing" | "dashboard" | "groups" | "group-details" | "create-group" | "settings";

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  displayName: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  displayName,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinks: { label: string; page: Page }[] = [
    { label: "Dashboard", page: "dashboard" },
    { label: "Groups", page: "groups" },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="header">
      <div className="container header-inner">
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <button
        className="header-logo"
        onClick={() => onNavigate("landing")}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
          >
        <img src="/src/assets/logo.svg" alt="FairShare" width={32} height={32} />
        <span style={{ fontSize: "18px", fontWeight: "700", color: "#732ee4" }}>
        Fair<span style={{ color: "#000000" }}>Share</span>
        </span>
          </button>

          <nav className="header-nav">
            {navLinks.map(({ label, page }) => (
              <a
                key={label}
                href="#"
                className={
                  currentPage === page ||
                  (page === "groups" &&
                    (currentPage === "group-details" ||
                      currentPage === "create-group"))
                    ? "active"
                    : ""
                }
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(page);
                }}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <div className="header-actions">
          <button className="icon-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              notifications
            </span>
          </button>

          {/* Account dropdown */}
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              className="account-chip"
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--color-zinc-100)",
                border: "1px solid var(--color-zinc-200)",
                borderRadius: 8,
                padding: "6px 12px",
                cursor: "pointer",
                fontFamily: "var(--font-family)",
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-on-surface)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--color-tertiary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              {displayName}
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--color-zinc-400)" }}>
                expand_more
              </span>
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "#fff",
                  border: "1px solid var(--color-zinc-200)",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                  minWidth: 180,
                  zIndex: 200,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-zinc-100)" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#000" }}>{displayName}</p>
                  <p style={{ fontSize: 11, color: "var(--color-zinc-400)", marginTop: 2 }}>Personal Account</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); onNavigate("settings"); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    fontFamily: "var(--font-family)",
                    color: "var(--color-on-surface)",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-zinc-50)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-zinc-500)" }}>settings</span>
                  Settings
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    borderTop: "1px solid var(--color-zinc-100)",
                    cursor: "pointer",
                    fontSize: 14,
                    fontFamily: "var(--font-family)",
                    color: "var(--color-error)",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-error-container)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
