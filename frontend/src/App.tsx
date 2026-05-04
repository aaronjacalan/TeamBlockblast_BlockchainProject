import React, { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CreateGroup from "./pages/CreateGroup";
import GroupDetails from "./pages/GroupDetails";
import Settings from "./pages/Settings";

type Page =
  | "landing"
  | "dashboard"
  | "groups"
  | "group-details"
  | "create-group"
  | "settings";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState("Aditya");

  const navigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate("dashboard");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
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
      ) : (
        <Header
          currentPage={currentPage}
          onNavigate={navigate}
          displayName={displayName}
          onLogout={handleLogout}
        />
      )}

      {currentPage === "landing" && (
        <div style={{ paddingTop: "var(--header-height)" }}>
          <Landing onGetStarted={handleLogin} />
        </div>
      )}

      {(currentPage === "dashboard" || currentPage === "groups") && (
        <Dashboard onNavigate={navigate} />
      )}

      {currentPage === "create-group" && (
        <CreateGroup onNavigate={navigate} />
      )}

      {currentPage === "group-details" && (
        <GroupDetails onNavigate={navigate} />
      )}

      {currentPage === "settings" && (
        <Settings
          displayName={displayName}
          onDisplayNameChange={setDisplayName}
          onNavigate={navigate}
        />
      )}

      <Footer />
    </>
  );
};

export default App;
