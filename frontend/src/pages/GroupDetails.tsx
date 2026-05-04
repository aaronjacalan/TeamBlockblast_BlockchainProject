import React, { useState } from "react";
import "./GroupDetails.css";
import { expenses as initialExpenses, members as initialMembers, CURRENCY } from "../data";

const EXPENSE_ICONS = ["chalet","restaurant","shopping_cart","flight","local_gas_station","sports_basketball","movie","local_bar","directions_car","hotel"];

const GroupDetails: React.FC = () => {
  const [expenseList, setExpenseList] = useState(initialExpenses);
  const [memberList, setMemberList] = useState(initialMembers);
  const [hoveredExpense, setHoveredExpense] = useState<string | null>(null);

  // Add Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState("You");
  const [expenseIcon, setExpenseIcon] = useState("receipt_long");

  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // Delete Member Modal
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  const handleAddExpense = () => {
    if (!expenseName.trim() || !expenseAmount.trim()) return;
    const newExp = {
      id: Date.now().toString(),
      icon: expenseIcon,
      name: expenseName.trim(),
      paidBy: expensePaidBy,
      amount: `${CURRENCY}${parseFloat(expenseAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      when: "Just now",
    };
    setExpenseList((prev) => [newExp, ...prev]);
    setExpenseName("");
    setExpenseAmount("");
    setExpensePaidBy("You");
    setExpenseIcon("receipt_long");
    setShowExpenseModal(false);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenseList((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const newMember = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      contribution: "25%",
      balance: `${CURRENCY}0.00`,
      balanceColor: "#000",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newMemberName)}&background=732ee4&color=fff`,
      isYou: false,
    };
    setMemberList((prev) => [...prev, newMember]);
    setNewMemberName("");
    setNewMemberEmail("");
    setShowAddMemberModal(false);
  };

  const confirmDeleteMember = (id: string) => {
    setMemberToDelete(id);
    setShowDeleteMemberModal(true);
  };

  const handleDeleteMember = () => {
    if (memberToDelete) {
      setMemberList((prev) => prev.filter((m) => m.id !== memberToDelete));
    }
    setMemberToDelete(null);
    setShowDeleteMemberModal(false);
  };

  const memberToDeleteObj = memberList.find((m) => m.id === memberToDelete);

  return (
    <>
      <main className="group-details page-offset">
        <div className="container">
          <div className="gd-inner">
            {/* ── Group Header ──────────────────────── */}
            <div className="gd-header">
              <div className="gd-header-left">
                <div className="gd-group-avatar">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwCNNDVytjdQz3iuYTy8vWcmlFtShZto7-gBGZaz0j80ThSa-D89lhKWBNK1ZjmELlUC458ph9M_IyeIc95-0rOdo8ELtIA6bsrpCP0wbwvZjW5qNmmV4vUVswwUNNXWx6jJDhpvzidvZiBUjgakDz3vOZykYB6wJh1v2AtUjRj9VxKD_pd_ON9u4XsCRPKkcw0rC8IMqjtk1rXgaJCxHc9iRh6AqsvIaTsSzaWZPAKadheUeKUjzWeZlbhD_XBGlhTuYMy3-3Tve8"
                    alt="Ski trip"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div>
                  <h1 className="text-headline-lg">Ski Trip 2024</h1>
                  <p style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--color-zinc-500)", fontSize: 14, marginTop: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_today</span>
                    Jan 15 – Jan 22
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

            {/* ── Summary Stats ─────────────────────── */}
            <div className="gd-stats">
              {[
                { label: "Total Group Spend", value: `${CURRENCY}4,850.00`, variant: "default" },
                { label: "You Paid", value: `${CURRENCY}1,200.00`, variant: "purple" },
                { label: "Your Balance", value: `-${CURRENCY}245.50`, variant: "error" },
              ].map(({ label, value, variant }) => (
                <div key={label} className={`gd-stat-card gd-stat-${variant}`}>
                  <span className={`text-label-sm gd-stat-label gd-stat-label-${variant}`}>{label}</span>
                  <span className={`text-data-display gd-stat-value-${variant}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* ── Main Content ──────────────────────── */}
            <div className="gd-content-grid">
              {/* Expense List */}
              <section className="gd-expenses">
                <div className="gd-expenses-header">
                  <h2 className="text-headline-sm">Expense History</h2>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["filter_list", "search"].map((icon) => (
                      <button key={icon} className="gd-tool-btn">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="gd-expense-list">
                  {expenseList.map((exp) => (
                    <div
                      key={exp.id}
                      className="gd-expense-row card card-p"
                      onMouseEnter={() => setHoveredExpense(exp.id)}
                      onMouseLeave={() => setHoveredExpense(null)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <div className="gd-expense-icon">
                          <span className="material-symbols-outlined" style={{ color: "var(--color-zinc-400)" }}>
                            {exp.icon}
                          </span>
                        </div>
                        <div>
                          <p className="text-headline-sm" style={{ fontSize: 15 }}>{exp.name}</p>
                          <p className="text-label-sm" style={{ color: "var(--color-zinc-500)", marginTop: 3 }}>
                            Paid by <strong style={{ color: "#000" }}>{exp.paidBy}</strong>
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                        <div style={{ textAlign: "right" }}>
                          <p className="text-headline-sm" style={{ fontSize: 15 }}>{exp.amount}</p>
                          <p className="text-label-sm" style={{ color: "var(--color-zinc-400)", marginTop: 2 }}>{exp.when}</p>
                        </div>
                        <div className="gd-expense-actions" style={{ opacity: hoveredExpense === exp.id ? 1 : 0 }}>
                          <button className="gd-expense-action-btn gd-action-edit">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                          </button>
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
                    <div className="gd-split-chip">
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>equalizer</span>
                      Split Equally
                    </div>
                  </div>

                  <div className="gd-member-list">
                    {memberList.map((m) => (
                      <div
                        key={m.id}
                        className={`gd-member-row ${m.isYou ? "gd-member-you" : ""}`}
                        style={{ position: "relative" }}
                        onMouseEnter={(e) => {
                          if (!m.isYou) {
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
                          <img src={m.avatar} alt={m.name} className="gd-member-avatar" />
                          <div>
                            <p className="text-label-md" style={{ lineHeight: 1 }}>{m.name}</p>
                            <p style={{ fontSize: 10, color: "var(--color-zinc-400)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Contribution: {m.contribution}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="text-headline-sm" style={{ fontSize: 14, color: m.balanceColor }}>{m.balance}</span>
                          {!m.isYou && (
                            <button
                              className="gd-member-del-btn"
                              onClick={() => confirmDeleteMember(m.id)}
                              style={{
                                opacity: 0,
                                transition: "opacity 0.15s",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 2,
                                color: "var(--color-error)",
                              }}
                              title="Remove member"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="gd-member-actions">
                    <button className="gd-invite-btn" onClick={() => setShowAddMemberModal(true)}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person_add</span>
                      Add Member
                    </button>
                    <button className="gd-split-btn">Change Split Logic</button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      {/* ── Add Expense Modal ─────────────────── */}
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
                <label className="modal-label">Amount ({CURRENCY})</label>
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
                  <option value="You">You</option>
                  {memberList.filter((m) => !m.isYou).map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="modal-field">
                <label className="modal-label">Category Icon</label>
                <div className="modal-icon-grid">
                  {EXPENSE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      className={`modal-icon-btn ${expenseIcon === icon ? "modal-icon-btn-active" : ""}`}
                      onClick={() => setExpenseIcon(icon)}
                      title={icon}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>Cancel</button>
              <button className="btn btn-dark" onClick={handleAddExpense}>Add Expense</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Member Modal ─────────────────── */}
      {showAddMemberModal && (
        <div className="modal-backdrop" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-headline-sm">Add Member</h2>
              <button className="modal-close-btn" onClick={() => setShowAddMemberModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Full Name</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="e.g. Juan Dela Cruz"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Email (optional)</label>
                <input
                  className="modal-input"
                  type="email"
                  placeholder="e.g. juan@email.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddMemberModal(false)}>Cancel</button>
              <button className="btn btn-dark" onClick={handleAddMember}>Add Member</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Member Confirm Modal ───────── */}
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
                  Remove <strong>{memberToDeleteObj?.name}</strong> from this group? Their balances will need to be manually settled.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteMemberModal(false)}>Cancel</button>
              <button
                className="btn"
                style={{ background: "var(--color-error)", color: "#fff" }}
                onClick={handleDeleteMember}
              >
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
