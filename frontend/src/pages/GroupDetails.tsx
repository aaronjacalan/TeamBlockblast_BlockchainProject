import React, { useState, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
import { BlockfrostProvider, MeshTxBuilder } from "@meshsdk/core";
import "./GroupDetails.css";

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
  expense_splits: {
    user_id: string;
    amount_owed: number;
    is_settled: boolean;
  }[];
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
  onExpenseAdded: () => void;
  onExpenseDeleted: () => void;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({ groupId, userId, onExpenseAdded, onExpenseDeleted }) => {
  const { wallet } = useWallet();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredExpense, setHoveredExpense] = useState<string | null>(null);

  // Settle Up Modal
  const [showSettleUpModal, setShowSettleUpModal] = useState(false);
  const [settleUpAddress, setSettleUpAddress] = useState("");
  const [settleUpAmount, setSettleUpAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Group Modal
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [editGroupLoading, setEditGroupLoading] = useState(false);

  // Add Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState(userId);
  const [expenseLoading, setExpenseLoading] = useState(false);

  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // Delete Member Modal
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchGroup();
    fetchExpenses();
  }, [groupId]);

  useEffect(() => {
    if (group) {
      setEditGroupName(group.name || "");
      setEditGroupDescription(group.description || "");
    }
  }, [group]);

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
          split_type: "equal",
        }),
      });
      if (!res.ok) throw new Error("Failed to add expense");
      await fetchExpenses();
      onExpenseAdded(); 
      setExpenseName("");
      setExpenseAmount("");
      setExpensePaidBy(userId);
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
      onExpenseDeleted(); // add this
    } catch (err) {
      alert("Failed to delete expense.");
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

  const handleEditGroup = async () => {
    if (!editGroupName.trim()) {
      alert("Group name is required");
      return;
    }

    setEditGroupLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editGroupName.trim(),
          description: editGroupDescription.trim(),
          requester_id: userId,
        }),
      });
      if (!res.ok) throw new Error("Failed to update group");
      const data = await res.json();
      setGroup(data);
      setShowEditGroupModal(false);
    } catch (err) {
      alert("Failed to update group.");
    } finally {
      setEditGroupLoading(false);
    }
  };

  if (loading) return <main className="group-details page-offset"><div className="container">Loading...</div></main>;
  if (!group) return <main className="group-details page-offset"><div className="container">Group not found.</div></main>;

  // calculate stats from real expenses
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const youPaid = expenses.filter(e => e.paid_by === userId).reduce((sum, e) => sum + e.amount, 0);
  const memberCount = group.group_members?.length || 1;
  const yourShare = totalSpend / memberCount;
  const netBalance = youPaid - yourShare;
  const youAreOwed = netBalance > 0 ? netBalance : 0;
  const youOwe = netBalance < 0 ? Math.abs(netBalance) : 0;

  const memberToDeleteObj = group.group_members?.find((m) => m.user_id === memberToDelete);

  // for each member, calculate: what they paid - their equal share
  const balanceMap: Record<string, number> = {};

  group.group_members?.forEach((m) => {
    if (m.user_id === userId) return; // skip yourself

    const theyPaid = expenses
      .filter(e => e.paid_by === m.user_id)
      .reduce((sum, e) => sum + e.amount, 0);

    const theirShare = totalSpend / memberCount;
    const theirNet = theyPaid - theirShare;

    // if their net is negative, they owe you
    // if their net is positive, you owe them
    balanceMap[m.user_id] = -theirNet;
  });

  const submitSettleUp = async () => {
    if (!wallet) {
      alert("Wallet not available. Please refresh and try again.");
      return;
    }
    if (!settleUpAddress || !settleUpAmount) {
      alert("Please enter a valid address and amount.");
      return;
    }

    try {
      setIsSubmitting(true);

      const blockfrostApiKey = import.meta.env.VITE_BLOCKFROST_API_KEY;
      if (!blockfrostApiKey) {
        alert("Blockfrost API Key is missing in environment variables.");
        return;
      }

      const blockfrostProvider = new BlockfrostProvider(blockfrostApiKey);
      const amountInLovelace = Math.floor(parseFloat(settleUpAmount) * 1000000).toString();

      const txBuilder = new MeshTxBuilder({
        fetcher: blockfrostProvider,
        verbose: true,
      });

      const utxos = await wallet.getUtxosMesh();
      const changeAddress = await wallet.getChangeAddressBech32();

      const unsignedTx = await txBuilder
        .txOut(settleUpAddress, [{ unit: "lovelace", quantity: amountInLovelace }])
        .changeAddress(changeAddress)
        .selectUtxosFrom(utxos)
        .complete();

      const signedTx = await wallet.signTxReturnFullTx(unsignedTx, false);
      const txHash = await wallet.submitTx(signedTx);

      alert(`Transaction successful!\nHash: ${txHash}`);
      setShowSettleUpModal(false);
      setSettleUpAddress("");
      setSettleUpAmount("");
    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Transaction failed. See console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <button className="btn btn-secondary" onClick={() => setShowEditGroupModal(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
                  Edit Group
                </button>
                <button className="btn btn-secondary" onClick={() => setShowSettleUpModal(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>payments</span>
                  Settle Up
                </button>
                <button className="btn btn-dark" onClick={() => setShowExpenseModal(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                  Add Expense
                </button>
              </div>
            </div>
            
            {/* Summary Stats */}
            <div className="gd-stats">
              <div className="gd-stat-card gd-stat-default">
                <span className="text-label-sm gd-stat-label gd-stat-label-default">Total Group Spend</span>
                <span className="text-data-display gd-stat-value-default">
                  ADA {totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="gd-stat-card gd-stat-purple">
                <span className="text-label-sm gd-stat-label gd-stat-label-purple">You Paid</span>
                <span className="text-data-display gd-stat-value-purple">
                  ADA {youPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="gd-stat-card gd-stat-error">
                <span className="text-label-sm gd-stat-label gd-stat-label-error">
                  {netBalance >= 0 ? "You Are Owed" : "You Owe"}
                </span>
                <span className="text-data-display gd-stat-value-error">
                  ADA {(netBalance >= 0 ? youAreOwed : youOwe).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
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
                <div className="card gd-desc-card">
                  <h2 className="text-headline-sm">Group Description</h2>
                  <p className="text-body-md" style={{ color: "var(--color-zinc-500)", marginTop: 8 }}>
                    {group.description || "No description yet."}
                  </p>
                </div>
                <div className="card gd-members-card">
                  <div className="gd-members-header">
                    <h2 className="text-headline-sm">Members</h2>
                  </div>

                  <div className="gd-member-list">
                    {group.group_members?.map((m, i) => {
                      const balance = balanceMap[m.user_id] || 0;
                      const isYou = m.user_id === userId;
                      return (
                        <div
                          key={m.user_id ?? i}
                          className={`gd-member-row ${isYou ? "gd-member-you" : ""}`}
                          style={{ position: "relative" }}
                          onMouseEnter={(e) => {
                            if (!isYou) {
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
                                {isYou ? "You" : m.stake_address?.slice(0, 12) + "..."}
                              </p>
                              <p style={{ fontSize: 10, color: "var(--color-zinc-400)", marginTop: 4 }}>
                                {m.user_id === group.created_by ? "Creator" : "Member"}
                              </p>
                              {/* per-member balance */}
                              {!isYou && (
                                <p style={{
                                  fontSize: 11,
                                  marginTop: 4,
                                  color: balance > 0 ? "var(--color-tertiary)" : balance < 0 ? "var(--color-error)" : "var(--color-zinc-400)"
                                }}>
                                  {balance > 0
                                    ? `Owes you ADA ${balance.toFixed(2)}`
                                    : balance < 0
                                    ? `You owe ADA ${Math.abs(balance).toFixed(2)}`
                                    : "Settled ✓"}
                                </p>
                              )}
                            </div>
                          </div>
                          {!isYou && (
                            <button
                              className="gd-member-del-btn"
                              onClick={() => { setMemberToDelete(m.user_id); setShowDeleteMemberModal(true); }}
                              style={{ opacity: 0, transition: "opacity 0.15s", background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--color-error)" }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_remove</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
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
                <label className="modal-label">Short Description</label>
                <textarea
                  className="modal-input"
                  placeholder="Add a quick note for this expense..."
                  rows={3}
                />
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
              <div className="modal-field">
                <label className="modal-label">Email</label>
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
              <button className="btn btn-dark" onClick={async () => {
                if (!newMemberEmail.trim()) return;
                try {
                  const res = await fetch(`/api/groups/${groupId}/invite`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: newMemberEmail.trim(),
                      invited_by: userId,
                    }),
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    alert(err.detail);
                    return;
                  }
                  alert("Invite sent!");
                  setNewMemberEmail("");
                  setShowAddMemberModal(false);
                } catch (err) {
                  alert("Failed to send invite.");
                }
              }}>
                Send Invite
              </button>
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

      {/* Settle Up Modal */}
      {showSettleUpModal && (
        <div className="modal-backdrop" onClick={() => setShowSettleUpModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-headline-sm">Settle Up via Cardano</h2>
              <button className="modal-close-btn" onClick={() => setShowSettleUpModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="modal-body">
              <p className="text-body-md" style={{ marginBottom: "16px", color: "var(--color-zinc-500)" }}>
                Send testnet ADA (tADA) directly to a member's wallet address using your connected wallet.
              </p>
              <div className="modal-field">
                <label className="modal-label">Recipient Testnet Address</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="addr_test1..."
                  value={settleUpAddress}
                  onChange={(e) => setSettleUpAddress(e.target.value)}
                />
              </div>

              <div className="modal-field">
                <label className="modal-label">Amount (ADA)</label>
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  step="0.000001"
                  placeholder="e.g. 5.5"
                  value={settleUpAmount}
                  onChange={(e) => setSettleUpAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSettleUpModal(false)} disabled={isSubmitting}>
                Cancel
              </button>
              <button className="btn btn-dark" onClick={submitSettleUp} disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Sign & Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditGroupModal && (
        <div className="modal-backdrop" onClick={() => setShowEditGroupModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-headline-sm">Edit Group</h2>
              <button className="modal-close-btn" onClick={() => setShowEditGroupModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Group Name</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Group name"
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Description</label>
                <textarea
                  className="modal-input"
                  placeholder="Add a short description..."
                  rows={3}
                  value={editGroupDescription}
                  onChange={(e) => setEditGroupDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditGroupModal(false)} disabled={editGroupLoading}>
                Cancel
              </button>
              <button className="btn btn-dark" onClick={handleEditGroup} disabled={editGroupLoading}>
                {editGroupLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupDetails;
