import React, { useEffect, useState } from "react";
import "./NotificationModal.css";
import NotificationChatItem from "../components/NotificationChatItem";

interface NotificationModalProps {
  onClose: () => void;
  userId: string;
  onInviteAccepted: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ onClose, userId, onInviteAccepted }) => {
  const [activeTab, setActiveTab] = useState<"all" | "invites" | "payments">("all");
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/notifications?user_id=${userId}`);
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch notifications");
    }
  };

  const handleMarkAllRead = async () => {
    await fetch(`http://localhost:8000/api/notifications/read-all?user_id=${userId}`, {
      method: "PUT",
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleAccept = async (notification: any) => {
    try {
      const { group_id } = notification.metadata;

      // add user to group
      const res = await fetch(`http://localhost:8000/api/groups/${group_id}/join-direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail);
        return;
      }

      // mark notification as read
      await fetch(`http://localhost:8000/api/notifications/${notification.id}/read`, {
        method: "PUT",
      });

      await fetchNotifications();
      onInviteAccepted();
    } catch (err) {
      alert("Failed to accept invite.");
    }
  };

  const handleDecline = async (notification: any) => {
    await fetch(`http://localhost:8000/api/notifications/${notification.id}/read`, {
      method: "PUT",
    });
    await fetchNotifications();
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "invites") return item.type === "group_invite";
    return item.type === "payment_settled";
  });

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <div className="notification-modal-backdrop" onClick={onClose}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-modal-header">
          <h2 className="text-headline-md">Notifications</h2>
          <button className="notification-modal-mark" onClick={handleMarkAllRead}>
            <span className="material-symbols-outlined">done_all</span>
            Mark all as read
          </button>
        </div>

        <div className="notification-modal-tabs">
          {["all", "invites", "payments"].map((tab) => (
            <button
              key={tab}
              className={`notification-modal-tab ${activeTab === tab ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="notification-modal-scroll">
          {filteredNotifications.length === 0 && (
            <p style={{ padding: 24, color: "var(--color-zinc-400)", fontSize: 14 }}>No notifications yet.</p>
          )}
          {filteredNotifications.map((item) => (
            <NotificationChatItem
              key={item.id}
              unread={!item.is_read}
              time={new Date(item.created_at).toLocaleString()}
              message={<span>{item.message}</span>}
              actions={item.type === "group_invite" && !item.is_read ? (
                <>
                  <button className="notification-modal-pill is-primary" onClick={() => handleAccept(item)}>Accept</button>
                  <button className="notification-modal-pill" onClick={() => handleDecline(item)}>Decline</button>
                </>
              ) : undefined}
              footer={item.is_read ? <span className="notification-modal-status">
                {item.type === "group_invite" ? "Responded" : "Seen"}
              </span> : undefined}
            />
          ))}
        </div>

        <div className="notification-modal-footer">
          <button className="notification-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;