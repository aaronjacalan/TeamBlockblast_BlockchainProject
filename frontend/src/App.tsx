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
import NotificationModal from "./pages/NotificationModal";

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
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [activities, setActivities] = useState<any[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  const isLoggedIn = Boolean(walletAddress);
  const [summary, setSummary] = useState({ you_are_owed: 0, you_owe: 0 });

  const fetchSummary = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/expenses/summary?user_id=${id}`);
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch summary");
    }
  };

  const fetchActivities = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/groups/activities?user_id=${id}`);
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error("Failed to fetch activities");
    }
  };

  const navigate = (page: Page) => {
    const nextPage = isLoggedIn && page === "landing" ? "dashboard" : page;
    setCurrentPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    navigate("group-details");
  };

  const fetchGroups = async (uid?: string) => {
    const id = uid ?? userId;
    if (!id) return;
    try {
      const res = await fetch(`/api/groups/?user_id=${id}`);
      if (!res.ok) throw new Error("Failed to fetch groups");
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      setGroups([]);
    }
  };

  const handleLogin = () => {
    navigate("login");
  };

  const handleLogout = () => {
    setWalletAddress("");
    setGroups([]);
    navigate("landing");
  };

  useEffect(() => {
    if (isLoggedIn && currentPage === "landing") {
      navigate("dashboard");
    }
  }, [isLoggedIn, currentPage]);

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
          displayName={displayName}
          email={email}
          onLogout={handleLogout}
          onOpenNotifications={() => setNotificationsOpen(true)}
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
          setUserId(user.id);
          setWalletAddress(user.stake_address);

          setDisplayName(user.display_name || "");
          setEmail(user.email || "");

          await fetchGroups(user.id);
          await fetchActivities(user.id);
          await fetchSummary(user.id);

          navigate("dashboard");
        }}
      />
      )}

      {currentPage === "dashboard" && (
        <Dashboard
          groups={groups}
          activities={activities}
          summary={summary}
          displayName={displayName}
          email={email}
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
          onExpenseAdded={async () => {
            await fetchActivities(userId);
            await fetchSummary(userId);
          }}
        />
      )}

      {currentPage === "settings" && (
        <Settings
          walletAddress={walletAddress}
          userId={userId}
          displayName={displayName}
          email={email}
          onNavigate={navigate}
        />
      )}

      {currentPage !== "login" && <Footer />}

      {notificationsOpen && (
        <NotificationModal
          onClose={() => setNotificationsOpen(false)}
          userId={userId}
          onInviteAccepted={async () => {
            await fetchGroups(userId);
            await fetchActivities(userId);
            await fetchSummary(userId);
          }}
        />
      )}
    </>
  );
};

export default App;
