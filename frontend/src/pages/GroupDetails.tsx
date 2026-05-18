import React, { useState, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
import { BlockfrostProvider, MeshTxBuilder } from "@meshsdk/core";
import "./GroupDetails.css";

interface Member {
  id?: string;
  user_id: string;
  name?: string;
  email?: string;
  stake_address?: string;
  payment_address?: string;
  joined_at?: string;
  users?: {
    id?: string;
    stake_address?: string;
    payment_address?: string;
    display_name?: string;
    email?: string;
  };
}

const shortAddr = (addr?: string, len = 12) =>
  addr ? `${addr.slice(0, len)}…` : "";

const shortHash = (hash?: string) =>
  hash ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : "";

const isPayableAddress = (addr?: string): addr is string =>
  !!addr && (addr.startsWith("addr_") || addr.startsWith("addr1"));

const memberAddress = (m: Member): string => {
  const candidates = [
    m.users?.payment_address,
    m.payment_address,
    m.users?.stake_address,
    m.stake_address,
  ];
  return candidates.find(isPayableAddress) || "";
};

const memberDisplay = (m: Member): string =>
  m.users?.display_name ||
  m.users?.email ||
  shortAddr(m.users?.payment_address || m.users?.stake_address || m.stake_address) ||
  (m.user_id ? m.user_id.slice(0, 8) : "Unknown");

const explorerTxUrl = (hash: string) =>
  `https://preview.cardanoscan.io/transaction/${hash}`;

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
  //onExpenseDeleted: () => void;
  //onMemberRemoved: () => void;
}

const GroupDetails: React.FC<GroupDetailsProps> = ({ groupId, userId, onExpenseAdded}) => {
  const { wallet } = useWallet();
  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredExpense, setHoveredExpense] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"expenses" | "transactions">("expenses");
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Settle Up Modal
  const [showSettleUpModal, setShowSettleUpModal] = useState(false);
  const [settleUpAddress, setSettleUpAddress] = useState("");
  const [settleUpAmount, setSettleUpAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settleUpMemberId, setSettleUpMemberId] = useState("");
  const [settlements, setSettlements] = useState<any[]>([]);

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
    fetchSettlements();
  }, [groupId]);

  useEffect(() => {
    if (group) {
      setEditGroupName(group.name || "");
      setEditGroupDescription(group.description || "");
    }
  }, [group]);

  const fetchSettlements = async () => {
      try {
        const res = await fetch(`/api/expenses/settlements?group_id=${groupId}`);
        if (!res.ok) throw new Error("Failed to fetch settlements");
        const data = await res.json();
        setSettlements(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setSettlements([]);
      }
    };

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

  // const handleDeleteExpense = async (expenseId: string) => {
  //   try {
  //     await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
  //     setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  //     onExpenseDeleted(); // add this
  //   } catch (err) {
  //     alert("Failed to delete expense.");
  //   }
  // };

  // const handleRemoveMember = async () => {
  //   if (!memberToDelete) return;
  //   try {
  //     await fetch(`/api/groups/${groupId}/members/${memberToDelete}?requester_id=${userId}`, {
  //       method: "DELETE",
  //     });
  //     await fetchGroup();
  //     onMemberRemoved(); // add this
  //   } catch (err) {
  //     alert("Failed to remove member.");
  //   } finally {
  //     setMemberToDelete(null);
  //     setShowDeleteMemberModal(false);
  //   }
  // };

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
  //const yourShare = totalSpend / memberCount;

  //const memberToDeleteObj = group.group_members?.find((m) => m.user_id === memberToDelete);

  const balanceMap: Record<string, number> = {};

  group.group_members?.forEach((m) => {
    if (m.user_id === userId) return;

    let balance = 0;

    expenses.forEach((exp) => {
      const splits = exp.expense_splits || [];

      if (exp.paid_by === userId) {
        // you paid — find their unsettled split
        const theirSplit = splits.find(s => s.user_id === m.user_id && !s.is_settled);
        if (theirSplit) balance += theirSplit.amount_owed;
      } else if (exp.paid_by === m.user_id) {
        // they paid — find your unsettled split
        const yourSplit = splits.find(s => s.user_id === userId && !s.is_settled);
        if (yourSplit) balance -= yourSplit.amount_owed;
      }
    });

    balanceMap[m.user_id] = balance;
  });

  // sum up balanceMap to get overall you owe / you are owed
  const youAreOwed = Object.values(balanceMap).filter(v => v > 0).reduce((sum, v) => sum + v, 0);
  const youOwe = Object.values(balanceMap).filter(v => v < 0).reduce((sum, v) => sum + Math.abs(v), 0);
  const netBalance = youAreOwed - youOwe;

  const memberById = (uid: string) =>
    group.group_members?.find((m) => m.user_id === uid);

  const payerLabel = (uid: string) => {
    if (uid === userId) return "You";
    const m = memberById(uid);
    return m ? memberDisplay(m) : uid.slice(0, 8);
  };

  const owedMembers = (group.group_members ?? []).filter(
    (m) => m.user_id !== userId && (balanceMap[m.user_id] ?? 0) < 0,
  );

  const closeSettleUp = () => {
    setShowSettleUpModal(false);
    setSettleUpMemberId("");
    setSettleUpAddress("");
    setSettleUpAmount("");
  };

  const selectSettleMember = (m: Member) => {
    const balance = balanceMap[m.user_id] ?? 0;
    setSettleUpMemberId(m.user_id);
    setSettleUpAddress(memberAddress(m));
    setSettleUpAmount(Math.abs(balance).toFixed(2));
  };

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash((c) => (c === hash ? null : c)), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

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

      // POST: mark splits as settled in the database
      const settleRes = await fetch("/api/expenses/settle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: groupId,
          from_user_id: userId,
          to_user_id: settleUpMemberId,
          tx_hash: txHash,
        }),
      });
      console.log("settle status:", settleRes.status);
      const settleData = await settleRes.json();
      console.log("settle response:", settleData);

      await fetchExpenses();
      await fetchSettlements();
      onExpenseAdded();

      alert(`Transaction successful!\nHash: ${txHash}`);
      setShowSettleUpModal(false);
      setSettleUpMemberId("");
      setSettleUpAddress("");
      setSettleUpAmount("");
      setSettleUpMemberId("");
    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Transaction failed. See console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMemberLabel = (uid: string): string => {
    if (uid === userId) return "You";
    const member = group?.group_members.find(m => m.user_id === uid);
    if (!member) return uid;
    return member.name || member.email || (member.stake_address?.slice(0, 12) + "...") || uid;
  };

  return (
    <>
      <main className="group-details page-offset">
        <div className="container">
          <div className="gd-inner">
            {/* Group Header */}
            <div className="gd-header">
              <div className="gd-header-left">
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
                <button className="btn btn-secondary" onClick={() => {
                    setShowSettleUpModal(true);
                  }}>
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
              {/* Expense / Transaction tabs */}
              <section className="gd-expenses">
                <div
                  role="tablist"
                  style={{
                    display: "flex",
                    gap: 0,
                    borderBottom: "1px solid var(--color-zinc-200)",
                    marginBottom: 16,
                  }}
                >
                  {([
                    ["expenses", "Expense History"],
                    ["transactions", "Transaction History"],
                  ] as const).map(([key, label]) => {
                    const isActive = activeTab === key;
                    return (
                      <button
                        key={key}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveTab(key)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "10px 20px",
                          fontSize: 14,
                          fontWeight: 600,
                          color: isActive ? "var(--color-primary)" : "var(--color-zinc-400)",
                          borderBottom: isActive
                            ? "2px solid var(--color-primary)"
                            : "2px solid transparent",
                          marginBottom: -1,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {activeTab === "expenses" && (
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
                              Paid by <strong style={{ color: "#000" }}>{payerLabel(exp.paid_by)}</strong>
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "transactions" && (
                  <div className="gd-expense-list">
                    {settlements.length === 0 && (
                      <p style={{ color: "var(--color-zinc-400)", fontSize: 14 }}>No transactions yet.</p>
                    )}
                    {settlements.map((s) => (
                    <div key={s.id} className="gd-expense-row card card-p">
                      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <div className="gd-expense-icon" style={{ background: "var(--color-tertiary-light, #f0fdf4)" }}>
                          <span className="material-symbols-outlined" style={{ color: "var(--color-tertiary)" }}>
                            check_circle
                          </span>
                        </div>
                        <div>
                          <p className="text-headline-sm" style={{ fontSize: 15 }}>
                            {s.from_user_id === userId ? "You" : s.from_user?.display_name || s.from_user?.email || "Someone"}
                            {" → "}
                            {s.to_user_id === userId ? "You" : s.to_user?.display_name || s.to_user?.email || "Someone"}
                          </p>
                          <p className="text-label-sm" style={{ color: "var(--color-zinc-500)", marginTop: 3 }}>
                            Paid by <strong style={{ color: "#000" }}>
                              {s.from_user === userId ? "You" : s.from_user_data?.display_name || s.from_user_data?.email || "Someone"}
                            </strong>
                          </p>
                          {/* hash on the left */}
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                            <code style={{
                              fontSize: 11,
                              fontFamily: "ui-monospace, monospace",
                              background: "var(--color-zinc-100)",
                              padding: "2px 6px",
                              borderRadius: 4,
                              color: "var(--color-zinc-700)",
                            }}>
                              {shortHash(s.tx_hash)}
                            </code>
                            <button
                              onClick={() => copyHash(s.tx_hash)}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "inline-flex", alignItems: "center", color: copiedHash === s.tx_hash ? "var(--color-tertiary)" : "var(--color-zinc-500)" }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                                {copiedHash === s.tx_hash ? "check" : "content_copy"}
                              </span>
                            </button>
                            <a
                              href={explorerTxUrl(s.tx_hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", color: "var(--color-zinc-500)" }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <p className="text-headline-sm" style={{ fontSize: 15, color: "var(--color-tertiary)" }}>
                          ADA {s.amount.toFixed(2)}
                        </p>
                        <p className="text-label-sm" style={{ color: "var(--color-zinc-400)", marginTop: 2 }}>
                          {new Date(s.initiated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
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
                                {isYou ? "You" : memberDisplay(m)}
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
                          {/* {!isYou && (
                            <button
                              className="gd-member-del-btn"
                              onClick={() => { setMemberToDelete(m.user_id); setShowDeleteMemberModal(true); }}
                              style={{ opacity: 0, transition: "opacity 0.15s", background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--color-error)" }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_remove</span>
                            </button>
                          )} */}
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
                      {getMemberLabel(m.user_id)}
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

      {/* Delete Member Modal
      {showDeleteMemberModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteMemberModal(false)}>
          <div className="modal-box modal-box-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-headline-sm">Remove Member</h2>
              <button className="modal-close-btn" onClick={() => setShowDeleteMemberModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        </div>
      )} */}

      {/* Settle Up Modal */}
      {showSettleUpModal && (
        <div className="modal-backdrop" onClick={closeSettleUp}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-headline-sm">Settle Up via Cardano</h2>
              <button className="modal-close-btn" onClick={closeSettleUp}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="modal-body">
              <p className="text-body-md" style={{ marginBottom: 16, color: "var(--color-zinc-500)" }}>
                Tap a member you owe — the recipient address and amount are filled in for you.
              </p>

              {owedMembers.length === 0 ? (
                <div style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  borderRadius: 10,
                  background: "var(--color-tertiary-light)",
                  color: "var(--color-tertiary)",
                  fontSize: 14,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 28, display: "block", marginBottom: 6 }}>
                    check_circle
                  </span>
                  You don't owe anyone in this group.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {owedMembers.map((m) => {
                    const amount = Math.abs(balanceMap[m.user_id] ?? 0);
                    const addr = memberAddress(m);
                    const isSelected = settleUpMemberId === m.user_id;
                    return (
                      <button
                        key={m.user_id}
                        type="button"
                        onClick={() => selectSettleMember(m)}
                        disabled={!addr}
                        style={{
                          textAlign: "left",
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: 10,
                          border: isSelected
                            ? "2px solid var(--color-primary)"
                            : "1px solid var(--color-zinc-200)",
                          background: isSelected ? "var(--color-primary-light, #f5f3ff)" : "#fff",
                          cursor: addr ? "pointer" : "not-allowed",
                          opacity: addr ? 1 : 0.5,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                          <div className="cg-member-avatar-placeholder">
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person</span>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p className="text-label-md" style={{ lineHeight: 1.2 }}>
                              {memberDisplay(m)}
                            </p>
                            <p style={{ fontSize: 11, color: "var(--color-zinc-400)", marginTop: 4, fontFamily: "ui-monospace, monospace" }}>
                              {addr ? shortAddr(addr, 16) : "No wallet address on file"}
                            </p>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <p className="text-headline-sm" style={{ fontSize: 14, color: "var(--color-error)" }}>
                            ADA {amount.toFixed(2)}
                          </p>
                          <p style={{ fontSize: 10, color: "var(--color-zinc-400)", marginTop: 2 }}>
                            You owe
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {settleUpMemberId && settleUpAddress && (
                <div style={{
                  marginTop: 16,
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: "var(--color-zinc-50, #fafafa)",
                  border: "1px solid var(--color-zinc-200)",
                  fontSize: 13,
                  color: "var(--color-zinc-700)",
                }}>
                  <p style={{ marginBottom: 4 }}>
                    Paying <strong>{payerLabel(settleUpMemberId)}</strong> <strong>{settleUpAmount} ADA</strong>
                  </p>
                  <p style={{ fontSize: 11, fontFamily: "ui-monospace, monospace", color: "var(--color-zinc-500)", wordBreak: "break-all" }}>
                    → {settleUpAddress}
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeSettleUp} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                className="btn btn-dark"
                onClick={submitSettleUp}
                disabled={isSubmitting || !settleUpMemberId || !settleUpAddress || !settleUpAmount}
              >
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