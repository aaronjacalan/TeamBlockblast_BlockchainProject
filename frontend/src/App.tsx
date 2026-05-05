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
  const [userId, setUserId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const navigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    navigate("group-details");
  };

  const fetchGroups = async () => {
    const res = await fetch("/api/groups/");
    const data = await res.json();
    setGroups(
      data.map((g: any) => ({
        id: g.id,
        name: g.name ?? "Unnamed Group",
        description: g.description ?? "",
        balance: g.balance ?? "0",
        balanceColor: g.balanceColor ?? "var(--color-on-surface)",
        icon: g.icon ?? "group",
      }))
    );
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
          onLogin={async (user: any) => {
          console.log("LOGIN USER:", user);

          if (!user.id) {
            console.error("User ID missing from backend!");
            return;
          }

          setUserId(user.id);
          setWalletAddress(user.stake_address);

          await fetchGroups();
          navigate("dashboard");
        }}
        />
      )}

      {currentPage === "dashboard" && (
        <Dashboard
          groups={groups}
          onNavigate={navigate}
          onCreateGroup={() => setCreateGroupOpen(true)}
          onSelectGroup={navigateToGroup}
        />
      )}

      {currentPage === "groups" && (
        <Groups
          groups={groups}
          onNavigate={navigate}
          onCreateGroup={() => setCreateGroupOpen(true)}
          onSelectGroup={navigateToGroup}
        />
      )}

      {createGroupOpen && (
        <CreateGroup
          userId={userId}
          onClose={() => setCreateGroupOpen(false)}
          onCreated={async () => {
            await fetchGroups();
            setCreateGroupOpen(false);
            navigate("groups");
          }}
        />
      )}

      {currentPage === "group-details" && (
        <GroupDetails
          groupId={selectedGroupId}
          userId={userId}
        />
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