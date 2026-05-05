import React, { useState, useEffect } from "react";
import "./GroupDetails.css";
import { CURRENCY } from "../data";

interface Member {
  id: string;
  user_id: string;
  stake_address: string;
  joined_at: string;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  currency: string;
  split_type: string;
  paid_by: string;
  tx_hash: string | null;
  tx_status: string;
  created_at: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  image_url: string;
  created_by: string;
  created_at: string;
  group_members: Member[];
}

interface GroupDetailsProps {
  groupId: string;
  userId: string;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({ groupId, userId }) => {
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredExpense, setHoveredExpense] = useState<string | null>(null);

  // Add Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState(userId);
  const [splitType, setSplitType] = useState("equal");
  const [expenseLoading, setExpenseLoading] = useState(false);

  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Delete Member Modal
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchGroup();
    fetchExpenses();
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) throw new Error("Failed to fetch group");
      const data = await res.json();
      setGroup(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`/api/expenses/?group_id=${groupId}`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setExpenses([]);
    }
  };

  const handleAddExpense = async () => {
    if (!expenseName.trim() || !expenseAmount.trim()) return;
    setExpenseLoading(true);
    try {
      const res = await fetch("/api/expenses/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: groupId,
          paid_by: expensePaidBy,
          name: expenseName.trim(),
          amount: parseFloat(expenseAmount),
          currency: "ADA",
          split_type: splitType,
        }),
      });
      if (!res.ok) throw new Error("Failed to add expense");
      await fetchExpenses();
      setExpenseName("");
      setExpenseAmount("");
      setExpensePaidBy(userId);
      setSplitType("equal");
      setShowExpenseModal(false);
    } catch (err) {
      alert("Failed to add expense. Please try again.");
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    } catch (err) {
      alert("Failed to delete expense.");
    }
  };

  const handleGenerateInvite = async () => {
    setInviteLoading(true);
    try {
      const res = await fetch("/api/groups/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId, created_by: userId }),
      });
      if (!res.ok) throw new Error("Failed to generate invite");
      const data = await res.json();
      const link = `${window.location.origin}/invite/${data.invite_code}`;
      setInviteLink(link);
    } catch (err) {
      alert("Failed to generate invite link.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToDelete) return;
    try {
      await fetch(`/api/groups/${groupId}/members/${memberToDelete}?requester_id=${userId}`, {
        method: "DELETE",
      });
      await fetchGroup();
    } catch (err) {
      alert("Failed to remove member.");
    } finally {
      setMemberToDelete(null);
      setShowDeleteMemberModal(false);
    }
  };

  if (loading) return <main className="group-details page-offset"><div className="container">Loading...</div></main>;
  if (!group) return <main className="group-details page-offset"><div className="container">Group not found.</div></main>;

  const memberToDeleteObj = group.group_members?.find((m) => m.user_id === memberToDelete);

  return (
    <>
      <main className="group-details page-offset">
        <div className="container">
          <div className="gd-inner">
            {/* Group Header */}
            <div className="gd-header">
              <div className="gd-header-left">
                <div className="gd-group-avatar">
                  {group.image_url ? (
                    <img src={group.image_url} alt={group.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--color-zinc-400)" }}>group</span>
                  )}
                </div>
                <div>
                  <h1 className="text-headline-lg">{group.name}</h1>
                  <p style={{ color: "var(--color-zinc-500)", fontSize: 14, marginTop: 4 }}>
                    {group.description}
                  </p>
                </div>
              </div>

              <div className="gd-header-actions">
                <button className="btn btn-secondary">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>payments</span>
                  Settle Up
                </button>
                <button className="btn btn-dark" onClick={() => setShowExpenseModal(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                  Add Expense
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="gd-content-grid">
              {/* Expense List */}
              <section className="gd-expenses">
                <div className="gd-expenses-header">
                  <h2 className="text-headline-sm">Expense History</h2>
                </div>

                <div className="gd-expense-list">
                  {expenses.length === 0 && (
                    <p style={{ color: "var(--color-zinc-400)", fontSize: 14 }}>No expenses yet.</p>
                  )}
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="gd-expense-row card card-p"
                      onMouseEnter={() => setHoveredExpense(exp.id)}
                      onMouseLeave={() => setHoveredExpense(null)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <div className="gd-expense-icon">
                          <span className="material-symbols-outlined" style={{ color: "var(--color-zinc-400)" }}>receipt_long</span>
                        </div>
                        <div>
                          <p className="text-headline-sm" style={{ fontSize: 15 }}>{exp.name}</p>
                          <p className="text-label-sm" style={{ color: "var(--color-zinc-500)", marginTop: 3 }}>
                            Paid by <strong style={{ color: "#000" }}>{exp.paid_by}</strong>
                            {" · "}{exp.tx_status}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                        <div style={{ textAlign: "right" }}>
                          <p className="text-headline-sm" style={{ fontSize: 15 }}>
                            {exp.currency} {exp.amount.toLocaleString()}
                          </p>
                          <p className="text-label-sm" style={{ color: "var(--color-zinc-400)", marginTop: 2 }}>
                            {new Date(exp.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="gd-expense-actions" style={{ opacity: hoveredExpense === exp.id ? 1 : 0 }}>
                          <button
                            className="gd-expense-action-btn gd-action-delete"
                            onClick={() => handleDeleteExpense(exp.id)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Side Panel */}
              <aside className="gd-sidebar">
                <div className="card gd-members-card">
                  <div className="gd-members-header">
                    <h2 className="text-headline-sm">Members</h2>
                  </div>

                  <div className="gd-member-list">
                    {group.group_members?.map((m) => (
                      <div
                        key={m.id}
                        className={`gd-member-row ${m.user_id === userId ? "gd-member-you" : ""}`}
                        style={{ position: "relative" }}
                        onMouseEnter={(e) => {
                          if (m.user_id !== userId) {
                            const btn = e.currentTarget.querySelector<HTMLButtonElement>(".gd-member-del-btn");
                            if (btn) btn.style.opacity = "1";
                          }
                        }}
                        onMouseLeave={(e) => {
                          const btn = e.currentTarget.querySelector<HTMLButtonElement>(".gd-member-del-btn");
                          if (btn) btn.style.opacity = "0";
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div className="cg-member-avatar-placeholder">
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
                          </div>
                          <div>
                            <p className="text-label-md" style={{ lineHeight: 1 }}>
                              {m.user_id === userId ? "You" : m.stake_address?.slice(0, 12) + "..."}
                            </p>
                            <p style={{ fontSize: 10, color: "var(--color-zinc-400)", marginTop: 4 }}>
                              {m.user_id === group.created_by ? "Creator" : "Member"}
                            </p>
                          </div>
                        </div>
                        {m.user_id !== userId && (
                          <button
                            className="gd-member-del-btn"
                            onClick={() => { setMemberToDelete(m.user_id); setShowDeleteMemberModal(true); }}
                            style={{ opacity: 0, transition: "opacity 0.15s", background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--color-error)" }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_remove</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="gd-member-actions">
                    <button className="gd-invite-btn" onClick={() => setShowAddMemberModal(true)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person_add</span>
                      Invite Member
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="modal-backdrop" onClick={() => setShowExpenseModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-headline-sm">Add Expense</h2>
              <button className="modal-close-btn" onClick={() => setShowExpenseModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Expense Name</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="e.g. Dinner at Jollibee"
                  value={expenseName}
                  onChange={(e) => setExpenseName(e.target.value)}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Amount (ADA)</label>
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Paid By</label>
                <select
                  className="modal-input"
                  value={expensePaidBy}
                  onChange={(e) => setExpensePaidBy(e.target.value)}
                >
                  {group.group_members?.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.user_id === userId ? "You" : m.stake_address?.slice(0, 12) + "..."}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-field">
                <label className="modal-label">Split Type</label>
                <select
                  className="modal-input"
                  value={splitType}
                  onChange={(e) => setSplitType(e.target.value)}
                >
                  <option value="equal">Equal</option>
                  <option value="exact">Exact</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>Cancel</button>
              <button className="btn btn-dark" onClick={handleAddExpense} disabled={expenseLoading}>
                {expenseLoading ? "Adding..." : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showAddMemberModal && (
        <div className="modal-backdrop" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-headline-sm">Invite Member</h2>
              <button className="modal-close-btn" onClick={() => setShowAddMemberModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              {inviteLink ? (
                <div className="modal-field">
                  <label className="modal-label">Invite Link</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="modal-input" type="text" value={inviteLink} readOnly />
                    <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(inviteLink)}>
                      Copy
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--color-zinc-400)", marginTop: 8 }}>
                    Link expires in 7 days.
                  </p>
                </div>
              ) : (
                <p className="text-body-md" style={{ color: "var(--color-zinc-500)" }}>
                  Generate an invite link to share with new members. They'll join by connecting their Cardano wallet.
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddMemberModal(false)}>Close</button>
              {!inviteLink && (
                <button className="btn btn-dark" onClick={handleGenerateInvite} disabled={inviteLoading}>
                  {inviteLoading ? "Generating..." : "Generate Link"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Member Modal */}
      {showDeleteMemberModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteMemberModal(false)}>
          <div className="modal-box modal-box-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-headline-sm">Remove Member</h2>
              <button className="modal-close-btn" onClick={() => setShowDeleteMemberModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-error-container)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--color-error)", fontSize: 22 }}>person_remove</span>
                </div>
                <p className="text-body-md">
                  Remove <strong>{memberToDeleteObj?.stake_address?.slice(0, 12)}...</strong> from this group?
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteMemberModal(false)}>Cancel</button>
              <button className="btn" style={{ background: "var(--color-error)", color: "#fff" }} onClick={handleRemoveMember}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupDetails;