import React, { useState, useEffect } from "react";
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
  const [walletAddress, setWalletAddress] = useState("");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groups, setGroups] = useState([]);

  const navigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchGroups = async () => {
    const res = await fetch("http://localhost:8000/api/groups/");
    const data = await res.json();
    setGroups(data);
  };

  const handleLogin = () => {
    navigate("login");
  };

  const handleLogout = () => {
    setWalletAddress("");
    setGroups([]);
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
              <img src="/logo.svg" alt="FairShare" width={32} height={32} />
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
          onLogin={async (address) => {
            // 1. save wallet to backend
            await fetch("http://localhost:8000/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ wallet_address: address }),
            });

            // 2. load groups
            await fetchGroups();

            // 3. set wallet and navigate
            setWalletAddress(address);
            navigate("dashboard");
          }}
        />
      )}

      {currentPage === "dashboard" && (
        <Dashboard
          groups={groups}
          onNavigate={navigate}
          onCreateGroup={() => setCreateGroupOpen(true)}
        />
      )}

      {currentPage === "groups" && (
        <Groups
          groups={groups}
          onNavigate={navigate}
          onCreateGroup={() => setCreateGroupOpen(true)}
        />
      )}

      {createGroupOpen && (
        <CreateGroup
          walletAddress={walletAddress}
          onClose={() => setCreateGroupOpen(false)}
          onCreated={async () => {
            await fetchGroups(); // refresh groups after creating one
            setCreateGroupOpen(false);
            navigate("groups");
          }}
        />
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