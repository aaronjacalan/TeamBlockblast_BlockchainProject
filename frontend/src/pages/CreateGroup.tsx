import React, { useState } from "react";
import "./CreateGroup.css";
import { groupMembers } from "../data";

type Page = "landing" | "login" | "dashboard" | "groups" | "group-details" | "create-group" | "settings";

interface CreateGroupProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreateGroup: React.FC<CreateGroupProps> = ({ onClose, onCreated }) => {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [members, setMembers] = useState(groupMembers);
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);

  // Add member modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Delete member modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  const handleAddMember = () => {
    if (!newName.trim()) return;
    setMembers((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: newName.trim(),
        email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, "")}@example.com`,
        isOwner: false,
        avatar: null,
      },
    ]);
    setNewName("");
    setNewEmail("");
    setShowAddModal(false);
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

  const handleCreate = () => {
    onCreated();
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
                  <div className="cg-photo-upload">
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: "var(--color-zinc-400)" }}>
                      add_a_photo
                    </span>
                  </div>
                  <div className="cg-name-field">
                    <label className="cg-label">GROUP NAME</label>
                    <input
                      className="cg-name-input"
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
                    className="cg-desc-input"
                    placeholder="Add a quick note for your group..."
                    value={groupDescription}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="cg-cta">
                  <button className="cg-create-btn" onClick={handleCreate}>
                    Create Group
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

      {/* ── Add Member Modal ─────────────────── */}
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
                <label className="modal-label">Full Name</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="e.g. Juan Dela Cruz"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Email (optional)</label>
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

      {/* ── Delete Member Modal ───────────────── */}
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
