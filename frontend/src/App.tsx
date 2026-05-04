import React, { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Groups from "./pages/Groups";
import CreateGroup from "./pages/CreateGroup";
import GroupDetails from "./pages/GroupDetails";
import Settings from "./pages/Settings";

type Page =
  | "landing"
  | "login"
  | "dashboard"
  | "groups"
  | "group-details"
  | "create-group"
  | "settings";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [walletAddress, setWalletAddress] = useState("0xA3b1F9C2D7E4b8a1c4f7D0b9E2a5C8f1d9B3A7E4");

  const navigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = () => {
    navigate("login");
  };

  const handleLogout = () => {
    navigate("landing");
  };

  return (
    <>
      {currentPage === "landing" ? (
        <header className="header">
          <div className="container header-inner">
            <button
      className="header-logo"
      onClick={() => navigate("landing")}
      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
        >
      <img src="/src/assets/logo.svg" alt="FairShare" width={32} height={32} />
      <span style={{ fontSize: "18px", fontWeight: "700", color: "#732ee4" }}>
        Fair<span style={{ color: "#000000" }}>Share</span>
      </span>
            </button>
            <div className="header-actions">
              <button className="btn btn-primary" onClick={handleLogin}>
                Get Started
              </button>
            </div>
          </div>
        </header>
      ) : currentPage === "login" ? null : (
        <Header
          currentPage={currentPage}
          onNavigate={navigate}
          walletAddress={walletAddress}
          onLogout={handleLogout}
        />
      )}

      {currentPage === "landing" && (
        <div style={{ paddingTop: "var(--header-height)" }}>
          <Landing onGetStarted={handleLogin} />
        </div>
      )}

      {currentPage === "login" && (
        <Login
          onLogin={(address) => {
            setWalletAddress(address);
            navigate("dashboard");
          }}
        />
      )}

      {currentPage === "dashboard" && (
        <Dashboard onNavigate={navigate} />
      )}

      {currentPage === "groups" && (
        <Groups onNavigate={navigate} />
      )}

      {currentPage === "create-group" && (
        <CreateGroup onNavigate={navigate} />
      )}

      {currentPage === "group-details" && (
        <GroupDetails />
      )}

      {currentPage === "settings" && (
        <Settings
          walletAddress={walletAddress}
          onNavigate={navigate}
        />
      )}
      {currentPage !== "login" && <Footer />}
    </>
  );
};

export default App;
