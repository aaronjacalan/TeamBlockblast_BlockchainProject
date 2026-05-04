import React from "react";
import "./Dashboard.css";
import { activityItems, groups, CURRENCY } from "../data";

type Page = "landing" | "dashboard" | "groups" | "group-details" | "create-group" | "settings";

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <main className="dashboard page-offset">
      <div className="container dashboard-inner">
        {/* ── Balance Hero ─────────────────────── */}
        <section className="db-balance-section">
          <div className="db-balance-grid">
            <div className="card card-p db-balance-card">
              <h1 className="text-headline-lg">Overview</h1>
              <p className="text-body-md" style={{ color: "var(--color-zinc-500)", marginTop: 6 }}>
                Your shared expenses and group balances at a glance.
              </p>

              <div className="db-balance-numbers">
                <div>
                  <span className="text-label-sm db-balance-label">You are owed</span>
                  <div className="db-balance-amount db-balance-amount-purple">
                    <span className="db-big-num">4,250.00</span>
                    <span className="db-currency db-currency-purple">{CURRENCY}</span>
                  </div>
                </div>
                <div className="db-balance-divider" />
                <div>
                  <span className="text-label-sm db-balance-label">You owe</span>
                  <div className="db-balance-amount">
                    <span className="db-big-num db-big-num-dark">1,120.45</span>
                    <span className="db-currency">{CURRENCY}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="db-insight-card">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6f2tr7lvTdlQIUGsEfht6vBTdckrpLDjgTK9CDkM09aJvHzQ5vcKKiB8Sg6qRNZYD_zTx165pQVrOn4V3FvhZ4-McmmMIT4IkkHRDffUlpC5tylIZsW3X2laljA3-7G6eCSZ6PXEuxivD_o6ULNuEDxU4ajDF42C1SmXleyiXomXBaJCF4xfAFrXPD_IVictH_BQkXFvTdw9yeqDtF5jv1dLAkTz20tb6su7RNqRcXeNLvCIl-5JUTDRgLVIMiat0sj1l92yELkCY"
                alt="Portfolio visual"
                className="db-insight-img"
              />
              <div className="db-insight-overlay" />
              <div className="db-insight-text">
                <span className="text-label-sm" style={{ opacity: 0.8, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Monthly Summary
                </span>
                <p className="text-headline-sm" style={{ lineHeight: 1.3, marginTop: 4 }}>
                  Your balance increased by 12% this month.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Groups + Activity ─────────────────── */}
        <div className="db-main-grid">
          {/* Active Groups */}
          <section className="db-groups-section">
            <div className="db-section-header">
              <h3 className="text-headline-md">Active Groups</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: "6px 0", display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}
                  onClick={() => onNavigate("groups")}
                >
                  View all
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    arrow_forward
                  </span>
                </button>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: 13, padding: "8px 14px" }}
                  onClick={() => onNavigate("create-group")}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    add
                  </span>
                  Create Group
                </button>
              </div>
            </div>

            <div className="db-groups-grid">
              {groups.map((g) => (
                <button
                  key={g.id}
                  className="db-group-card card card-p"
                  onClick={() => onNavigate("group-details")}
                >
                  <div className="db-group-card-top">
                    <div className="db-group-icon">
                      <span className="material-symbols-outlined">{g.icon}</span>
                    </div>
                    <span className={`badge badge-${g.badgeVariant}`}>{g.badge}</span>
                  </div>
                  <h4 className="text-headline-sm" style={{ marginTop: 20 }}>
                    {g.name}
                  </h4>
                  <p className="text-body-md" style={{ color: "var(--color-zinc-400)", marginTop: 4 }}>
                    {g.sub}
                  </p>
                  <div className="db-group-card-footer">
                    <span className="text-label-sm" style={{ color: "var(--color-zinc-500)" }}>
                      Balance
                    </span>
                    <span className="text-headline-sm" style={{ color: g.balanceColor }}>
                      {g.balance}
                    </span>
                  </div>
                </button>
              ))}

              <button
                className="db-new-group-card"
                onClick={() => onNavigate("create-group")}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 36, marginBottom: 8 }}>
                  add_circle
                </span>
                <span className="text-label-md">Create New Group</span>
              </button>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="db-activity-section">
            <h3 className="text-headline-md" style={{ marginBottom: 16 }}>
              Recent Activity
            </h3>
            <div className="card db-activity-list">
              {activityItems.map((item, i) => (
                <div key={i} className="db-activity-item">
                  <div className={`db-activity-icon db-activity-icon-${item.color}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {item.icon}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, color: "#000", lineHeight: 1.5 }}>{item.text}</p>
                    <p style={{ fontSize: 12, color: "var(--color-zinc-400)", marginTop: 4 }}>
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
              <button className="db-load-more">Load More Activity</button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
