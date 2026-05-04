import React, { useState } from "react";
import "./Groups.css";
import { groups } from "../data";

type Page = "landing" | "login" | "dashboard" | "groups" | "group-details" | "create-group" | "settings";

interface GroupsProps {
  onNavigate: (page: Page) => void;
  onCreateGroup: () => void;
}

const avatarUrls = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBsseU36y3nqC3L1YSnmAcA7Qrq9l0jAQiMIdX7jIhJ8Ol7HMjWGALkvYdznMw8Qt4Bz3ISM6fMtMxdDFIio-SFyendadwL886iLWG-JVgoi533YIpGt_a1S-0srPxAdSGV-7RJSwZ1Jo0Ns7602guu6qs_FroDr8713vJz9JA-qe7HgNKFPLnL_Avpb2s-waohlrQvlaHD5mDGsZ04ADo-qNjP57SqqmFbukBHIDLU3hPEoZh6z0knh-FWfcSJar4zkbv5ZAuF-ogi",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDskhlsZ07lvPxVG8pWGYzHXgDwfSTa4wtmWbHNYG-URm7amJ11HFJ4KKCWQuH86B49FF3llmg9L9PJ-lpph7nYJBQxOGLoo685bPvRK3I9bjpGXQtQoIsBHcSvX5HFFuQfhSshcpz3-aanLdxZZxjocW2wVpSTaBQtUZ2vjPUXAB4kcfDO1MmV2SgaFlF_Sf01R73mS7rymytKC9XCLqg05nXVSXZzrqihstfh-vw7jJUc-gnxXsrnC_fx5yVtcy7T7jdfxKpA3jFz",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCkABJsHCeX4ZulxrbYBynyDvZOK6tt4GKEcr0kOK4xb1cR-1RD9FpFla8WphQOqUdLMUiQmJCCmNJPGrZ_HZZtP0u1kKmfM3e46bCqsjBziidpzi1cK3c9U0ktZyGVSv9bJC53lxMjtZnWK1i68IpKrb9SDrcxnoj0FQ2hmcRdAoyuI9Cb6ektz0npuiF9s9MEtN3HdKWI05RrKC2bfG5fdLCz2gzusQlD9kwQdCxs8vekyS8bRMMvWR3CwMyneaxSRuG-n_uO1brK",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAztOUK09UNB2JyOCy20Mx1-pfiz2W8m9uLWIjdzYpFeFcXJIYJcGDHg-XxVcNHjXKLyP2aAuC_X7jfcocoUs9pvEqWtE9D64yZgPR58jSmQ3XJfMqqtxeZkwzSpuztjwJ--Nx5k7eLvDc_AvVWCVjNmqp6gFW4YateDUqjszhbHUp0l9FQnAT4RQHI5Kvk-8aqWgwyL9o4sxqanZpoFkrOTHGWvrizZoq_KfehRFjEEFluhfI3DRGvkV6mSDjJNEVCdSM30xUr-Wt_",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBjPjHI4T4AbCg29cS2oOhosO03xVkCnHfP-TeIDU-gDCTpX44Nvld2Hz1Wk7hAmH9PJhQ5DrZmfsBrKpE_L0csgEuulahupyN0SxKL57g4z44-gMrQzugfl01DOXoiPx99qs3NVFoiPx7jJOEQjGm0TT6GTLERtE8DQdqNEaR3N0VMBuqmn5moAJJFhbkP-Wi4FHDFw0SpDGx1N8r10FWTeKvejxfIraufbRbsx1qqppHMTlkqlxR1WxvwkE0WUH-4xdvKNqPLWaKe",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB2DZLae-kHP31rAF9J4AqRE6IvjrXYG0bYmjIfZQBg9-VR75sYewEQO4JMASy6xYhDyUJ9ko9dE0SCM5V54x4S5Un71BKGWaubZwX6a4s7sZsMT9xOTx8NHkx-scTxwEVfT-Q_rKpPgSXgfkfExfHpRz76C5Nkl7E3B_u73icYrgLyahDmlxRmHB3QfAdsaIi51Xw7A5HRXhfGQSSBSrzIze84Bx-EKKRNXaXG_QBTiHtxv9aSCXfgw3ML0P9_Vk8z78tElEw7pg_6"
];

const Groups: React.FC<GroupsProps> = ({ onNavigate, onCreateGroup }) => {
  const [query, setQuery] = useState("");

  const activeGroups = groups;
  const settledGroups = [
    {
      id: "birthday",
      icon: "restaurant",
      name: "Birthday Dinner",
      meta: "8 members • Settled Dec 20, 2023",
    },
    {
      id: "roadtrip",
      icon: "directions_car",
      name: "Road Trip to LA",
      meta: "4 members • Settled Nov 05, 2023",
    },
  ];

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
            <span className="groups-chip groups-chip-purple">{activeGroups.length} Active</span>
          </div>

          <div className="groups-grid">
            {activeGroups
              .filter((g) => g.name.toLowerCase().includes(query.toLowerCase()))
              .map((g, index) => (
                <button
                  key={g.id}
                  className="groups-card"
                  onClick={() => onNavigate("group-details")}
                >
                  <div className="groups-card-top">
                    <div className="groups-card-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: 28 }}>{g.icon}</span>
                    </div>
                    <div className="groups-card-balance">
                      <span className="text-label-sm" style={{ color: "var(--color-on-surface-variant)" }}>
                        Current Balance
                      </span>
                      <span className="text-headline-sm" style={{ color: g.balanceColor }}>
                        {g.balance.replace("+", "")}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-headline-sm groups-card-title">{g.name}</h3>
                  <p className="text-body-md" style={{ color: "var(--color-zinc-400)", marginTop: 4 }}>
                    {g.description}
                  </p>
                  <div className="groups-card-meta">
                    <span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>group</span>
                      {index + 3} members
                    </span>
                    <span>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                      {index === 0 ? "2 hrs ago" : index === 1 ? "Yesterday" : "Mar 12, 2024"}
                    </span>
                  </div>
                  <div className="groups-card-footer">
                    <div className="groups-avatars">
                      {avatarUrls.slice(index, index + 2).map((src) => (
                        <img key={src} src={src} alt="Group member" />
                      ))}
                      <div className="groups-avatar-more">+{index + 2}</div>
                    </div>
                    <span className="groups-view">View Details</span>
                  </div>
                </button>
              ))}
          </div>
        </section>

        {/* Settled */}
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
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>{g.icon}</span>
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
      </div>
    </main>
  );
};

export default Groups;
