import React, { useRef, useState, useEffect } from "react";
import "./CreateGroup.css";
import { useWallet } from "@meshsdk/react";
import { MeshTxBuilder } from "@meshsdk/core";
import { BackendProxyFetcher } from "../utils/customFetcher";

interface CreateGroupProps {
  onClose: () => void;
  onCreated: (groupId?: string) => void;
  userId: string;
  onShowToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

const sha256 = async (message: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const CreateGroup: React.FC<CreateGroupProps> = ({ onClose, onCreated, userId, onShowToast }) => {
  const { wallet, connected } = useWallet();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [members, setMembers] = useState([
    {
      id: userId,
      name: "You (Owner)",
      email: "",
      isOwner: true,
      avatar: null,
    },
  ]);
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [nameError, setNameError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);
  const [paymentError, setPaymentError] = useState(false);
  const nameErrorTimer = useRef<number | null>(null);
  const descriptionErrorTimer = useRef<number | null>(null);
  const paymentErrorTimer = useRef<number | null>(null);

  const [verificationPhase, setVerificationPhase] = useState<"idle" | "paying" | "verifying" | "success" | "failed">("idle");
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pollingIntervalRef = useRef<number | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Load draft on mount
  useEffect(() => {
    const draftStr = localStorage.getItem(`fairshare_pending_group_fee_${userId}`);
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr);
        if (draft && draft.txHash) {
          setGroupName(draft.groupName || "");
          setGroupDescription(draft.groupDescription || "");
          setTxHash(draft.txHash);
          setHasPaid(true);
          setVerificationStatus("Payment Restored! Click Create Group below to finalize group setup.");
          onShowToast("Restored pending group fee payment from previous session.", "info");
        }
      } catch (e) {
        console.error("Failed to parse group fee draft:", e);
      }
    }
  }, [userId]);

  const startPolling = (groupId: string) => {
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
    }
    setVerificationPhase("verifying");
    setElapsedSeconds(0);
    
    let elapsed = 0;
    pollingIntervalRef.current = window.setInterval(async () => {
      elapsed += 5;
      setElapsedSeconds(elapsed);
      
      try {
        const res = await fetch(`/api/groups/${groupId}`);
        if (res.ok) {
          const groupData = await res.json();
          if (groupData.status === "active") {
            if (pollingIntervalRef.current) {
              window.clearInterval(pollingIntervalRef.current);
            }
            setVerificationPhase("success");
            onShowToast("Cardano payment verified successfully!", "success");
          }
        }
      } catch (err) {
        console.error("Error polling group status:", err);
      }
      
      if (elapsed >= 180) { // 3 minutes timeout
        if (pollingIntervalRef.current) {
          window.clearInterval(pollingIntervalRef.current);
        }
        setVerificationPhase("failed");
        onShowToast("Verification timed out. It might take longer on the network.", "warning");
      }
    }, 5000);
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  const handleAddMember = async () => {
    if (!newEmail.trim()) return;

    const alreadyAdded = members.some((m) => m.email === newEmail.trim());
    if (alreadyAdded) {
      onShowToast("This member has already been added to the list.", "warning");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:8000/api/auth/profile/by-email?email=${encodeURIComponent(newEmail.trim())}`
      );
      let displayName = newEmail.trim();
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) displayName = data.display_name;
      }
      setMembers((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: displayName,
          email: newEmail.trim(),
          isOwner: false,
          avatar: null,
        },
      ]);
    } catch {
      setMembers((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: newEmail.trim(),
          email: newEmail.trim(),
          isOwner: false,
          avatar: null,
        },
      ]);
    } finally {
      setNewEmail("");
      setShowAddModal(false);
    }
  };

  const confirmDelete = (id: string) => {
    setMemberToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteMember = () => {
    if (memberToDelete) {
      setMembers((prev) => prev.filter((m) => m.id !== memberToDelete));
    }
    setMemberToDelete(null);
    setShowDeleteModal(false);
  };

  const memberToDeleteObj = members.find((m) => m.id === memberToDelete);

  const handleDescriptionChange = (value: string) => {
    setGroupDescription(value.slice(0, 100));
  };

  /**
   * Handles real transaction creation for the 1.0 ADA group creation fee.
   * Sends 1.0 ADA (1,000,000 Lovelaces) to the designated FAIRSHARE_ADDRESS.
   * On success, sets hasPaid to true, stores the tx_hash, caches a local draft, and auto-submits creation.
   */
  const handlePayment = async () => {
    if (!connected || !wallet) {
      onShowToast("Wallet not connected. Please log in with a Cardano wallet first.", "warning");
      return;
    }

    const nameMissing = !groupName.trim();
    const descriptionMissing = !groupDescription.trim();

    if (nameMissing) {
      setNameError(true);
      if (nameErrorTimer.current) window.clearTimeout(nameErrorTimer.current);
      nameErrorTimer.current = window.setTimeout(() => setNameError(false), 5000);
    }
    if (descriptionMissing) {
      setDescriptionError(true);
      if (descriptionErrorTimer.current) window.clearTimeout(descriptionErrorTimer.current);
      descriptionErrorTimer.current = window.setTimeout(() => setDescriptionError(false), 5000);
    }

    if (nameMissing || descriptionMissing) {
      onShowToast("Please enter a Group Name and Description before paying.", "warning");
      return;
    }

    setIsPaying(true);
    setVerificationStatus("Initializing Cardano payment...");
    setPaymentError(false);

    try {
      const fairshareAddress = import.meta.env.VITE_FAIRSHARE_ADDRESS;

      if (!fairshareAddress) {
        throw new Error("Configuration error: VITE_FAIRSHARE_ADDRESS is missing in frontend env.");
      }

      setVerificationStatus("Preparing 1.0 ADA fee transaction...");
      const secureFetcher = new BackendProxyFetcher();
      const amountInLovelace = "1000000"; // 1.0 ADA = 1,000,000 Lovelaces

      const txBuilder = new MeshTxBuilder({
        fetcher: secureFetcher as any,
        verbose: true,
      });

      setVerificationStatus("Querying wallet UTXOs...");
      const utxos = await wallet.getUtxosMesh();
      const changeAddress = await wallet.getChangeAddressBech32();

      // Generate secure hashes to preserve privacy on the public blockchain
      const senderHash = await sha256(userId);
      const recipientHash = await sha256(fairshareAddress);
      const groupHash = await sha256(groupName.trim());
      const timestamp = new Date().toISOString();

      setVerificationStatus("Building payment transaction...");
      const unsignedTx = await txBuilder
        .txOut(fairshareAddress, [{ unit: "lovelace", quantity: amountInLovelace }])
        .metadataValue(674, {
          msg: ["FairShare: Group Creation Fee Paid"]
        })
        .metadataValue(1999, {
          action: "Group Creation",
          time: timestamp,
          sender: senderHash,
          recipient: recipientHash,
          group: groupHash
        })
        .changeAddress(changeAddress)
        .selectUtxosFrom(utxos)
        .complete();

      setVerificationStatus("Please sign the 1.0 ADA payment in your wallet...");
      const signedTx = await wallet.signTxReturnFullTx(unsignedTx, false);

      setVerificationStatus("Submitting fee to Cardano network...");
      const submittedTxHash = await wallet.submitTx(signedTx);

      setTxHash(submittedTxHash);
      setHasPaid(true);
      setVerificationStatus("Payment successful! Finalizing group...");

      // Save draft details to localStorage immediately upon payment submission
      localStorage.setItem(`fairshare_pending_group_fee_${userId}`, JSON.stringify({
        groupName: groupName.trim(),
        groupDescription: groupDescription.trim(),
        txHash: submittedTxHash,
      }));

      onShowToast("Transaction submitted successfully! Finalizing group...", "success");

      // Auto-create group immediately in the background
      try {
        setVerificationStatus("Registering group in database...");
        const res = await fetch("/api/groups/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: groupName.trim(),
            description: groupDescription.trim(),
            image_url: "",
            created_by: userId,
            tx_hash: submittedTxHash,
            status: "inactive",
            initial_members: members.filter((m) => !m.isOwner && m.email).map((m) => m.email),
          }),
        });

        if (res.ok) {
          const groupData = await res.json();
          const groupId = groupData?.id;
          setCreatedGroupId(groupId);
          localStorage.removeItem(`fairshare_pending_group_fee_${userId}`);
          onShowToast("Group registered! Now starting payment verification...", "success");
          if (groupId) {
            startPolling(groupId);
          } else {
            onCreated();
          }
        } else {
          setVerificationStatus("Payment successful! Click Create Group below to finish.");
        }
      } catch (postErr) {
        console.error("Auto-group creation failed, user can retry manually:", postErr);
        setVerificationStatus("Payment successful! Click Create Group below to finish.");
      }

    } catch (error: any) {
      console.error("Payment transaction failed:", error);
      setPaymentError(true);
      setVerificationStatus("");
      onShowToast(error?.message || "Transaction failed. Make sure you have enough ADA and try again.", "error");
    } finally {
      setIsPaying(false);
    }
  };

  const handleCreate = async () => {
    const nameMissing = !groupName.trim();
    const descriptionMissing = !groupDescription.trim();

    if (nameMissing) {
      setNameError(true);
      if (nameErrorTimer.current) window.clearTimeout(nameErrorTimer.current);
      nameErrorTimer.current = window.setTimeout(() => setNameError(false), 5000);
    }
    if (descriptionMissing) {
      setDescriptionError(true);
      if (descriptionErrorTimer.current) window.clearTimeout(descriptionErrorTimer.current);
      descriptionErrorTimer.current = window.setTimeout(() => setDescriptionError(false), 5000);
    }
    if (nameMissing || descriptionMissing) return;
    if (!hasPaid || !txHash) {
      setPaymentError(true);
      if (paymentErrorTimer.current) window.clearTimeout(paymentErrorTimer.current);
      paymentErrorTimer.current = window.setTimeout(() => setPaymentError(false), 5000);
      return;
    }

    setLoading(true);
    setVerificationStatus("Submitting group creation to backend...");

    try {
      const res = await fetch("/api/groups/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription.trim(),
          image_url: "",
          created_by: userId,
          tx_hash: txHash,
          status: "inactive",
          initial_members: members.filter((m) => !m.isOwner && m.email).map((m) => m.email),
        }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to create group. Please try again.";
        try {
          const errorData = await res.json();
          if (errorData?.detail) errorMsg = errorData.detail;
        } catch {}
        throw new Error(errorMsg);
      }
      
      const groupData = await res.json();
      const groupId = groupData?.id;
      setCreatedGroupId(groupId);
      onShowToast("Group created successfully! Starting payment verification...", "success");
      
      // Clear draft details from localStorage upon successful group creation
      localStorage.removeItem(`fairshare_pending_group_fee_${userId}`);
      if (groupId) {
        startPolling(groupId);
      } else {
        onCreated();
      }
    } catch (err: any) {
      onShowToast(err?.message || "Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
      setVerificationStatus("");
    }
  };

  return (
    <>
      <div 
        className="modal-backdrop" 
        onClick={() => {
          if (verificationPhase !== "idle" && verificationPhase !== "paying") {
            onCreated();
          } else {
            onClose();
          }
        }}
      >
        <div className="modal-box cg-modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2 className="text-headline-sm">
                {verificationPhase === "verifying" && "Verifying Fee Payment"}
                {verificationPhase === "success" && "Verification Success!"}
                {verificationPhase === "failed" && "Verification Delayed"}
                {(verificationPhase === "idle" || verificationPhase === "paying") && "Start a new group"}
              </h2>
              <p className="text-body-md" style={{ color: "var(--color-secondary)", marginTop: 4 }}>
                {verificationPhase === "verifying" && "Confirming group registration fee on-chain..."}
                {verificationPhase === "success" && "Your group has been successfully activated!"}
                {verificationPhase === "failed" && "The transaction is still processing on Cardano."}
                {(verificationPhase === "idle" || verificationPhase === "paying") && "Organize shared expenses with friends and settle balances easily."}
              </p>
            </div>
            <button 
              className="modal-close-btn" 
              onClick={() => {
                if (verificationPhase !== "idle" && verificationPhase !== "paying") {
                  onCreated();
                } else {
                  onClose();
                }
              }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="modal-body cg-modal-body">
            {verificationPhase !== "idle" && verificationPhase !== "paying" ? (
              <div className="cg-verification-container">
                {verificationPhase === "verifying" && (
                  <div className="cg-verification-state verifying">
                    <div className="cg-pulse-loader">
                      <div className="cg-pulse-ring"></div>
                      <div className="cg-pulse-ring-outer"></div>
                      <span className="material-symbols-outlined cg-pulse-icon">hourglass_empty</span>
                    </div>
                    <h3 className="text-headline-sm" style={{ marginTop: 24, textAlign: 'center' }}>Verifying Cardano Payment</h3>
                    <p className="text-body-md cg-verification-subtitle" style={{ textAlign: 'center', maxWidth: 440, margin: '8px auto 24px auto', color: 'var(--color-zinc-400)' }}>
                      Waiting for on-chain block confirmation... This usually takes 20-40 seconds.
                    </p>
                    
                    <div className="cg-verification-details">
                      <div className="cg-detail-row">
                        <span>Transaction Hash</span>
                        <a 
                          href={`https://preview.cardanoscan.io/transaction/${txHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="cg-tx-link"
                        >
                          {txHash.slice(0, 10)}...{txHash.slice(-8)}
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                        </a>
                      </div>
                      <div className="cg-detail-row">
                        <span>Time Elapsed</span>
                        <span className="cg-timer-val">{elapsedSeconds}s</span>
                      </div>
                      <div className="cg-detail-row">
                        <span>Status</span>
                        <span className="cg-status-badge pending">
                          <span className="material-symbols-outlined spinner-icon" style={{ fontSize: 14, animation: "spin 1.5s linear infinite" }}>sync</span>
                          Polling Status
                        </span>
                      </div>
                    </div>

                    <div className="cg-verification-actions">
                      <button 
                        className="btn btn-secondary cg-minimize-btn"
                        onClick={() => onCreated()}
                      >
                        Minimize & Finish in Background
                      </button>
                    </div>
                  </div>
                )}

                {verificationPhase === "success" && (
                  <div className="cg-verification-state success">
                    <div className="cg-success-checkmark">
                      <span className="material-symbols-outlined cg-success-icon" style={{ fontSize: 64, color: "var(--color-success)" }}>check_circle</span>
                    </div>
                    <h3 className="text-headline-sm" style={{ marginTop: 24, textAlign: 'center', color: "var(--color-success)" }}>Group Verified!</h3>
                    <p className="text-body-md cg-verification-subtitle" style={{ textAlign: 'center', maxWidth: 440, margin: '8px auto 24px auto', color: 'var(--color-zinc-400)' }}>
                      Your payment of 1.0 ADA has been confirmed on the Cardano blockchain.
                    </p>

                    <div className="cg-verification-details">
                      <div className="cg-detail-row">
                        <span>Group Name</span>
                        <strong style={{ fontWeight: 600 }}>{groupName}</strong>
                      </div>
                      <div className="cg-detail-row">
                        <span>Tx Hash</span>
                        <a 
                          href={`https://preview.cardanoscan.io/transaction/${txHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="cg-tx-link"
                        >
                          {txHash.slice(0, 10)}...{txHash.slice(-8)}
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                        </a>
                      </div>
                      <div className="cg-detail-row">
                        <span>On-Chain Status</span>
                        <span className="cg-status-badge active-status">Active</span>
                      </div>
                    </div>

                    <div className="cg-verification-actions">
                      <button 
                        className="btn btn-dark cg-go-btn"
                        onClick={() => {
                          if (createdGroupId) {
                            onCreated(createdGroupId);
                          } else {
                            onCreated();
                          }
                        }}
                      >
                        Go to Group
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                      </button>
                    </div>
                  </div>
                )}

                {verificationPhase === "failed" && (
                  <div className="cg-verification-state failed">
                    <div className="cg-failed-cross">
                      <span className="material-symbols-outlined cg-failed-icon" style={{ fontSize: 64, color: "var(--color-warning)" }}>warning</span>
                    </div>
                    <h3 className="text-headline-sm" style={{ marginTop: 24, textAlign: 'center', color: "var(--color-warning)" }}>Verification Delay</h3>
                    <p className="text-body-md cg-verification-subtitle" style={{ textAlign: 'center', maxWidth: 440, margin: '8px auto 24px auto', color: 'var(--color-zinc-400)' }}>
                      Cardano block confirmation is taking longer than expected. Do not worry, your group will activate as soon as the tx settles!
                    </p>

                    <div className="cg-verification-details">
                      <div className="cg-detail-row">
                        <span>Group Name</span>
                        <strong style={{ fontWeight: 600 }}>{groupName}</strong>
                      </div>
                      <div className="cg-detail-row">
                        <span>Tx Hash</span>
                        <a 
                          href={`https://preview.cardanoscan.io/transaction/${txHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="cg-tx-link"
                        >
                          {txHash.slice(0, 10)}...{txHash.slice(-8)}
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>open_in_new</span>
                        </a>
                      </div>
                      <div className="cg-detail-row">
                        <span>Fallback</span>
                        <span>Auto-activating in background...</span>
                      </div>
                    </div>

                    <div className="cg-verification-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                      <button 
                        className="btn btn-secondary cg-retry-btn"
                        onClick={() => {
                          if (createdGroupId) {
                            startPolling(createdGroupId);
                          }
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>sync</span>
                        Keep Retrying
                      </button>
                      <button 
                        className="btn btn-dark cg-dashboard-btn"
                        onClick={() => onCreated()}
                      >
                        Go to Dashboard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Payment Restored Banner */}
                {hasPaid && localStorage.getItem(`fairshare_pending_group_fee_${userId}`) && (
                  <div className="cg-restored-banner" style={{
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    borderRadius: 12,
                    padding: "16px 20px",
                    marginBottom: 20,
                    color: "#d97706",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.04)"
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: '"FILL" 1' }}>paid</span>
                    <div>
                      <strong style={{ fontWeight: 600, display: "block", marginBottom: 2 }}>Payment Restored</strong>
                      <span>We found a paid 1.0 ADA group creation fee (tx: {txHash.slice(0, 16)}...). You can complete your group now without paying again!</span>
                    </div>
                  </div>
                )}

                <div className="cg-modal-grid">
                  <div className="card cg-card">
                    <div className="cg-identity">
                      <div className="cg-name-field">
                        <label className="cg-label">GROUP NAME</label>
                        <input
                          className={`cg-name-input${nameError ? " cg-error" : ""}`}
                          type="text"
                          placeholder="e.g. Summer Trip 2024"
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="cg-desc-block">
                      <div className="cg-desc-header">
                        <label className="cg-label">SHORT DESCRIPTION</label>
                        <span className="cg-desc-count">
                          {Math.max(0, 100 - groupDescription.length)} characters left
                        </span>
                      </div>
                      <textarea
                        className={`cg-desc-input${descriptionError ? " cg-error" : ""}`}
                        placeholder="Add a quick note for your group..."
                        value={groupDescription}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="cg-cta">
                      <button
                        className={`cg-pay-btn${hasPaid ? " paid" : ""}${paymentError ? " cg-error" : ""}`}
                        onClick={handlePayment}
                        disabled={hasPaid || isPaying || loading}
                      >
                        {isPaying ? "Paying..." : hasPaid ? "Paid 1.0 ADA" : "Pay 1.0 ADA"}
                      </button>
                      <button className="cg-create-btn" onClick={handleCreate} disabled={loading || isPaying || !hasPaid}>
                        {loading ? "Verifying..." : "Create Group"}
                      </button>
                    </div>


                    {/* Cardano Transaction & Verification Status Indicator */}
                    {verificationStatus && (
                      <div className="cg-status-message" style={{
                        marginTop: 12,
                        padding: "10px 14px",
                        borderRadius: 8,
                        background: "var(--color-zinc-100, #f4f4f5)",
                        border: "1px solid var(--color-zinc-200, #e4e4e7)",
                        color: "var(--color-zinc-700, #3f3f46)",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}>
                        <span className="material-symbols-outlined spinner-icon" style={{
                          fontSize: 16,
                          color: "var(--color-primary)",
                          animation: "spin 1.5s linear infinite",
                          display: "inline-block"
                        }}>sync</span>
                        <span>{verificationStatus}</span>
                      </div>
                    )}

                    <div className="cg-info-alert">
                      <span className="material-symbols-outlined" style={{ color: "var(--color-tertiary)", marginTop: 2, flexShrink: 0 }}>
                        info
                      </span>
                      <div>
                        <p className="text-label-md">Split smarter with FairShare</p>
                        <p className="text-body-md" style={{ color: "var(--color-on-surface-variant)", marginTop: 4 }}>
                          All group expenses are tracked locally. Invite members by name and email to keep everyone in sync.
                        </p>
                      </div>
                    </div>
                  </div>

              <div className="cg-side">
                <div className="cg-side-card">
                  <div className="cg-side-header">
                    <label className="cg-label" style={{ marginBottom: 0 }}>MEMBERS</label>
                  </div>

                      <div className="cg-member-list">
                        {members.map((m) => (
                          <div
                            key={m.id}
                            className="cg-member-row card"
                            onMouseEnter={() => setHoveredMember(m.id)}
                            onMouseLeave={() => setHoveredMember(null)}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                              {m.avatar ? (
                                <img src={m.avatar} alt={m.name} className="cg-member-avatar" />
                              ) : (
                                <div className="cg-member-avatar-placeholder">
                                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                                    {m.isOwner ? "person" : "person_add"}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-label-md">{m.name}</p>
                                <p className="text-label-sm" style={{ color: "var(--color-zinc-400)", marginTop: 2 }}>
                                  {m.email}
                                </p>
                              </div>
                            </div>

                            {m.isOwner ? (
                              <span className="cg-creator-badge">Creator</span>
                            ) : (
                              <button
                                className="cg-delete-btn"
                                style={{ opacity: hoveredMember === m.id ? 1 : 0 }}
                                onClick={() => confirmDelete(m.id)}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_remove</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-headline-sm">Add Member</h2>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
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
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-dark" onClick={handleAddMember}>Add Member</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Member Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box modal-box-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-headline-sm">Remove Member</h2>
              <button className="modal-close-btn" onClick={() => setShowDeleteModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-error-container)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--color-error)", fontSize: 22 }}>person_remove</span>
                </div>
                <p className="text-body-md">
                  Remove <strong>{memberToDeleteObj?.name}</strong> from this group?
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
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

export default CreateGroup;