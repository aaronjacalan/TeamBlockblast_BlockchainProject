import React, { useRef, useState } from "react";
import "./CreateGroup.css";
import { groupMembers } from "../data";

interface CreateGroupProps {
  onClose: () => void;
  onCreated: () => void;
  userId: string;
}

const CreateGroup: React.FC<CreateGroupProps> = ({ onClose, onCreated, userId }) => {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [members, setMembers] = useState(groupMembers);
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);  // added
  const [hasPaid, setHasPaid] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);
  const [paymentError, setPaymentError] = useState(false);
  const nameErrorTimer = useRef<number | null>(null);
  const descriptionErrorTimer = useRef<number | null>(null);
  const paymentErrorTimer = useRef<number | null>(null);

  // Add member modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Delete member modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  const handleAddMember = async () => {
    if (!newEmail.trim()) return;
    try {
      const res = await fetch(`http://localhost:8000/api/auth/profile/by-email?email=${encodeURIComponent(newEmail.trim())}`);
      let displayName = newEmail.trim(); // fallback to email
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
      setNewEmail("");
      setShowAddModal(false);
    } catch (err) {
      // if lookup fails, just use email
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
    if (value.length <= 100) {
      setGroupDescription(value);
      return;
    }
    setGroupDescription(value.slice(0, 100));
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
    if (!hasPaid) {
      setPaymentError(true);
      if (paymentErrorTimer.current) window.clearTimeout(paymentErrorTimer.current);
      paymentErrorTimer.current = window.setTimeout(() => setPaymentError(false), 5000);
      return;
    }

    setLoading(true);
    try {
        console.log("Creating group with:", {
          name: groupName.trim(),
          description: groupDescription,
          created_by: userId,
        });
      const res = await fetch("/api/groups/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: groupName.trim(),
          description: groupDescription,
          image_url: "",
          created_by: userId,
        }),
      });

      if (!res.ok) throw new Error("Failed to create group");

      onCreated();
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}> 
        <div className="modal-box cg-modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2 className="text-headline-sm">Start a new group</h2>
              <p className="text-body-md" style={{ color: "var(--color-secondary)", marginTop: 4 }}>
                Organize shared expenses with friends and settle balances easily.
              </p>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="modal-body cg-modal-body">
            <div className="cg-modal-grid">
              <div className="card cg-card">
                {/* Group Identity */}
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
                    onClick={() => {
                      setHasPaid(true);
                      setPaymentError(false);
                    }}
                    disabled={hasPaid}
                  >
                    {hasPaid ? "Paid 1 ADA" : "Pay 1 ADA"}
                  </button>
                  <button className="cg-create-btn" onClick={handleCreate} disabled={loading || !hasPaid}>
                    {loading ? "Creating..." : "Create Group"}
                  </button>
                </div>

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
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: 13, padding: "6px 12px" }}
                      onClick={() => setShowAddModal(true)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person_add</span>
                      Add Member
                    </button>
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
