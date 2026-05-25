import React, { useState, useEffect } from "react";
import { useLovelace } from "@meshsdk/react";
import "./Dashboard.css";
import { CURRENCY } from "../data";

type Page = "landing" | "login" | "dashboard" | "groups" | "group-details" | "create-group" | "settings";

interface DashboardProps {
  userId?: string;
  onNavigate: (page: Page) => void;
  onCreateGroup: () => void;
  onSelectGroup: (groupId: string) => void;
  groups: any[];
  activities: any[];
  summary: { you_are_owed: number; you_owe: number };
  displayName: string;
  email: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  userId,
  onNavigate,
  onCreateGroup,
  onSelectGroup,
  groups,
  activities,
  summary,
}) => {
  const lovelace = useLovelace();
  const walletBalance = lovelace ? (parseInt(lovelace) / 1_000_000).toFixed(2) : "0.00";

  // State to load all expenses in the background to calculate true statistics
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [activeTab, setActiveTab] = useState<"spend" | "audit">("spend");

  useEffect(() => {
    if (!userId || groups.length === 0) {
      setLoadingExpenses(false);
      return;
    }

    let isMounted = true;
    const fetchAllExpenses = async () => {
      try {
        const promises = groups.map(async (g) => {
          const res = await fetch(`/api/expenses/?group_id=${g.id}`);
          if (!res.ok) return [];
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        });

        const results = await Promise.all(promises);
        const allExpenses = results.flat();

        if (isMounted) {
          setExpenses(allExpenses);
          setLoadingExpenses(false);
        }
      } catch (err) {
        console.error("Error fetching dashboard expenses:", err);
        if (isMounted) setLoadingExpenses(false);
      }
    };

    fetchAllExpenses();
    return () => {
      isMounted = false;
    };
  }, [userId, groups]);

  // Compute stats dynamically from the actual user & group data
  const groupSpent = groups
    .map((g) => {
      const spentInGroup = expenses
        .filter((e) => e.group_id === g.id && e.paid_by === userId)
        .reduce((sum, e) => sum + e.amount, 0);
      return { name: g.name, amount: spentInGroup };
    })
    .filter((item) => item.amount > 0);

  const totalPersonalOwed = summary.you_are_owed;
  const totalPersonalOwes = summary.you_owe;
  const totalImbalance = totalPersonalOwed + totalPersonalOwes;

  const personalVolume = expenses.reduce((sum, e) => {
    const isPaidByMe = e.paid_by === userId;
    const isOwedByMe = e.expense_splits?.some((s: any) => s.user_id === userId);
    return isPaidByMe || isOwedByMe ? sum + e.amount : sum;
  }, 0);

  const fairnessIndex = personalVolume > 0
    ? Math.max(0, Math.min(100, Math.round((1 - totalImbalance / (personalVolume + 1)) * 100)))
    : 100;

  const settledSplitsCount = expenses.reduce((sum, e) => {
    const settledInExpense = e.expense_splits?.filter((s: any) => s.is_settled && s.user_id === userId).length || 0;
    return sum + settledInExpense;
  }, 0);

  const activeGroupsCount = groups.filter((g) => g.status === "active").length;
  const totalFeesPaid = activeGroupsCount * 1.0;

  const outstandingSettlementsCount = expenses.reduce((sum, e) => {
    const activeInExpense = e.expense_splits?.filter((s: any) => !s.is_settled && s.user_id === userId && e.paid_by !== userId).length || 0;
    return sum + activeInExpense;
  }, 0);

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
                  <span className="text-label-sm db-wallet-label">Wallet Balance</span>
                  <div className="db-balance-amount">
                    <span className="db-wallet-currency">{CURRENCY}</span>
                    <span className="db-wallet-num">{walletBalance}</span>
                  </div>
                </div>
                <div className="db-balance-divider" />
                <div>
                  <span className="text-label-sm db-balance-label">You are owed</span>
                  <div className="db-balance-amount db-balance-amount-purple">
                    <span className="db-currency db-currency-purple">ADA</span>
                    <span className="db-big-num">{summary.you_are_owed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="db-balance-divider" />
                <div>
                  <span className="text-label-sm db-balance-label">You owe</span>
                  <div className="db-balance-amount">
                    <span className="db-currency">ADA</span>
                    <span className="db-big-num db-big-num-dark">{summary.you_owe.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card card-p db-analytics-card" style={{ background: "#fff", border: "1px solid var(--color-zinc-200)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-zinc-100)", paddingBottom: 12, marginBottom: 12 }}>
                <span className="text-label-sm" style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-zinc-500)" }}>
                  Web3 Analytics
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className={`btn ${activeTab === "spend" ? "btn-primary" : "btn-ghost"}`}
                    style={{ padding: "4px 8px", fontSize: 11, borderRadius: 6 }}
                    onClick={() => setActiveTab("spend")}
                  >
                    Spend
                  </button>
                  <button
                    className={`btn ${activeTab === "audit" ? "btn-primary" : "btn-ghost"}`}
                    style={{ padding: "4px 8px", fontSize: 11, borderRadius: 6 }}
                    onClick={() => setActiveTab("audit")}
                  >
                    Audit
                  </button>
                </div>
              </div>

              {activeTab === "spend" ? (
                <div style={{ display: "flex", gap: 16, alignItems: "center", height: "100%" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 100 100" width="76" height="76">
                      <circle cx="50" cy="50" r="40" stroke="var(--color-zinc-100)" stroke-width="8" fill="none" />
                      <circle cx="50" cy="50" r="40" stroke="var(--color-tertiary)" stroke-width="8" fill="none"
                              stroke-dasharray="251.2" stroke-dashoffset={251.2 - (251.2 * fairnessIndex) / 100}
                              stroke-linecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
                      <text x="50" y="56" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--color-zinc-800)">
                        {fairnessIndex}%
                      </text>
                    </svg>
                    <span style={{ fontSize: 10, color: "var(--color-zinc-400)", marginTop: 4, textTransform: "uppercase", fontWeight: 600 }}>Fairness</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, color: "var(--color-zinc-500)", fontWeight: 600 }}>Group Spend (Paid by You)</span>
                    {loadingExpenses ? (
                      <div style={{ fontSize: 12, color: "var(--color-zinc-400)", marginTop: 8 }}>Analyzing Ledger...</div>
                    ) : groupSpent.length === 0 ? (
                      <div style={{ fontSize: 12, color: "var(--color-zinc-400)", marginTop: 8 }}>No logged spending found.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                        {groupSpent.slice(0, 2).map((item) => {
                          const maxSpent = Math.max(...groupSpent.map(i => i.amount), 1);
                          const percentage = (item.amount / maxSpent) * 100;
                          return (
                            <div key={item.name}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                                <span style={{ fontWeight: 600, color: "var(--color-zinc-700)" }}>{item.name}</span>
                                <span style={{ color: "var(--color-tertiary)", fontWeight: 700 }}>{item.amount} ADA</span>
                              </div>
                              <div style={{ height: 6, background: "var(--color-zinc-100)", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${percentage}%`, background: "linear-gradient(to right, var(--color-tertiary), var(--color-tertiary-container))", borderRadius: 3 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                  <span style={{ fontSize: 11, color: "var(--color-zinc-500)", fontWeight: 600 }}>Cardano Ledger Statistics</span>
                  {loadingExpenses ? (
                    <div style={{ fontSize: 12, color: "var(--color-zinc-400)", marginTop: 8 }}>Loading stats...</div>
                  ) : (
                    <div className="web3-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
                      <div className="web3-stat-item" style={{ textAlign: "center", padding: "8px 4px", background: "rgba(115, 46, 228, 0.04)", borderRadius: 6, border: "1px solid rgba(115, 46, 228, 0.08)" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-tertiary)" }}>verified_user</span>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--color-zinc-800)", margin: "2px 0" }}>{settledSplitsCount}</div>
                        <div style={{ fontSize: 9, color: "var(--color-zinc-500)", textTransform: "uppercase", fontWeight: 600 }}>Settled</div>
                      </div>
                      <div className="web3-stat-item" style={{ textAlign: "center", padding: "8px 4px", background: "rgba(115, 46, 228, 0.04)", borderRadius: 6, border: "1px solid rgba(115, 46, 228, 0.08)" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-tertiary)" }}>toll</span>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--color-zinc-800)", margin: "2px 0" }}>{totalFeesPaid.toFixed(1)}</div>
                        <div style={{ fontSize: 9, color: "var(--color-zinc-500)", textTransform: "uppercase", fontWeight: 600 }}>Fees (ADA)</div>
                      </div>
                      <div className="web3-stat-item" style={{ textAlign: "center", padding: "8px 4px", background: "rgba(115, 46, 228, 0.04)", borderRadius: 6, border: "1px solid rgba(115, 46, 228, 0.08)" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-tertiary)" }}>pending_actions</span>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--color-zinc-800)", margin: "2px 0" }}>{outstandingSettlementsCount}</div>
                        <div style={{ fontSize: 9, color: "var(--color-zinc-500)", textTransform: "uppercase", fontWeight: 600 }}>Pending</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                  className="btn btn-primary db-create-big"
                  onClick={onCreateGroup}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    add
                  </span>
                  Create Group
                </button>
              </div>
            </div>

            <div className="db-groups-grid">
              {groups.filter(g => g.status !== "settled").map((g) => (
                <button
                  key={g.id}
                  className="db-group-card card card-p"
                  onClick={() => onSelectGroup(g.id)}
                >
                  <div className="db-group-card-top">
                    {g.status === "inactive" ? (
                      <span className="badge badge-warning" style={{
                        background: "rgba(245, 158, 11, 0.1)",
                        color: "#d97706",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        <span className="material-symbols-outlined spinner-icon" style={{ fontSize: 13, animation: "spin 1.5s linear infinite" }}>sync</span>
                        Verifying Payment
                      </span>
                    ) : g.status === "payment_failed" ? (
                      <span className="badge" style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#dc2626",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
                        Payment Failed
                      </span>
                    ) : (
                      <span className="badge badge-purple">Active</span>
                    )}
                  </div>
                  <h4 className="text-headline-sm" style={{ marginTop: 20 }}>
                    {g.name}
                  </h4>
                  <p className="text-body-md" style={{ color: "var(--color-zinc-400)", marginTop: 4 }}>
                    {g.description}
                  </p>
                  <div className="db-group-card-footer">
                    <span className="text-label-sm" style={{ color: "var(--color-zinc-500)" }}>
                      Members
                    </span>
                    <span className="text-headline-sm">
                      {g.group_members?.length || 0}
                    </span>
                  </div>
                </button>
              ))}

            </div>
          </section>

          {/* Recent Activity */}
          <section className="db-activity-section">
            <h3 className="text-headline-md" style={{ marginBottom: 16 }}>
              Recent Activity
            </h3>
            <div className="card db-activity-list">
              {(activities ?? []).map((item) => (
                <div key={item.id} className="db-activity-item">
                  <div className="db-activity-icon db-activity-icon-purple">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {item.type === "group_created" ? "group_add"
                        : item.type === "expense_added" ? "receipt_long"
                        : item.type === "member_joined" ? "person_add"
                        : "check_circle"}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, color: "#000", lineHeight: 1.5 }}>{item.description}</p>
                    <p style={{ fontSize: 12, color: "var(--color-zinc-400)", marginTop: 4 }}>
                      {new Date(item.created_at).toLocaleString()}
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
