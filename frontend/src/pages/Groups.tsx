import React, { useState } from "react";
import "./Groups.css";

type Page = "landing" | "login" | "dashboard" | "groups" | "group-details" | "create-group" | "settings";

interface GroupsProps {
  onNavigate: (page: Page) => void;
  onCreateGroup: () => void;
  onSelectGroup: (groupId: string) => void;
  groups: any[];
}

const Groups: React.FC<GroupsProps> = ({ onCreateGroup, onSelectGroup, groups }) => {
  const [query, setQuery] = useState("");

  const settledGroups: any[] = [];

  return (
    <main className="groups page-offset">
      <div className="container groups-inner">
        {/* Header */}
        <section className="groups-hero">
          <div>
            <h1 className="text-headline-lg">Your Groups</h1>
            <p className="text-body-md" style={{ color: "var(--color-on-surface-variant)", marginTop: 6 }}>
              Manage your shared expenses across trips, home, and social circles.
            </p>
          </div>
          <button className="groups-create-btn" onClick={onCreateGroup}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>add</span>
            Create New Group
          </button>
        </section>

        {/* Search + Filters */}
        <section className="groups-toolbar">
          <div className="groups-search">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
            <input
              type="text"
              placeholder="Find a group..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="groups-filters">
            <button className="groups-filter-btn">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>sort</span>
              Recent
            </button>
          </div>
        </section>

        {/* Active Groups */}
        <section className="groups-section">
          <div className="groups-section-title">
            <h2 className="text-headline-sm">Active Groups</h2>
            <span className="groups-chip groups-chip-purple">{groups.length} Active</span>
          </div>

          <div className="groups-grid">
            {groups
              .filter((g) => g.name.toLowerCase().includes(query.toLowerCase()))
              .map((g) => (
                <button
                  key={g.id}
                  className="groups-card"
                  onClick={() => onSelectGroup(g.id)}
                >
                  <div className="groups-card-top">
                    <span className="badge badge-purple">Active</span>
                  </div>
                  <h3 className="text-headline-sm groups-card-title">{g.name}</h3>
                  <p className="text-body-md" style={{ color: "var(--color-zinc-400)", marginTop: 4 }}>
                    {g.description}
                  </p>
                  <div className="groups-card-meta">
                    <span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>group</span>
                      {g.group_members?.length || 0} members
                    </span>
                    <span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                      {new Date(g.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="groups-card-footer">
                    <span className="groups-view">View Details</span>
                  </div>
                </button>
              ))}
          </div>
        </section>

        {/* Settled */}
        {settledGroups.length > 0 && (
          <section className="groups-section">
            <div className="groups-section-title">
              <h2 className="text-headline-sm">Settled Groups</h2>
              <span className="groups-chip groups-chip-muted">{settledGroups.length} Settled</span>
            </div>

            <div className="groups-settled-list">
              {settledGroups.map((g) => (
                <div key={g.id} className="groups-settled-row">
                  <div className="groups-settled-left">
                    <div className="groups-settled-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>group</span>
                    </div>
                    <div>
                      <h4 className="text-body-lg">{g.name}</h4>
                      <p className="text-label-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                        {g.meta}
                      </p>
                    </div>
                  </div>
                  <div className="groups-settled-right">
                    <span className="groups-settled-pill">
                      <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: '"FILL" 1' }}>
                        check_circle
                      </span>
                      Fully Settled
                    </span>
                    <button className="groups-chevron">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default Groups;
