import React, { useEffect, useState } from "react";
import "./NotificationModal.css";
import NotificationChatItem from "../components/NotificationChatItem";

interface NotificationModalProps {
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<"all" | "invites" | "payments">("all");

  const [notifications, setNotifications] = useState([
    {
      id: "invite-1",
      type: "invite" as const,
      unread: true,
      time: "2h ago",
      message: (
        <span>
          <strong>Alex Web3</strong> invited you to{" "}
          <strong className="notification-modal-highlight">“Summer Trip 2024”</strong>
        </span>
      ),
      actions: (
        <>
          <button className="notification-modal-pill is-primary">Accept</button>
          <button className="notification-modal-pill">Decline</button>
        </>
      ),
    },
    {
      id: "payment-1",
      type: "payment" as const,
      unread: true,
      time: "5h ago",
      message: (
        <span>
          Reminder: You have a pending balance of{" "}
          <strong className="notification-modal-highlight">45.50 ADA</strong> in{" "}
          <strong>Roommates</strong> group.
        </span>
      ),
      footer: (
        <button className="notification-modal-link">
          Settle Now
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      ),
    },
    {
      id: "invite-2",
      type: "invite" as const,
      unread: false,
      time: "Yesterday",
      message: (
        <span>
          <strong>Jordan</strong> invited you to <strong>Dinner</strong>
        </span>
      ),
      footer: <span className="notification-modal-status">Accepted</span>,
    },
    {
      id: "payment-2",
      type: "payment" as const,
      unread: true,
      time: "1d ago",
      message: (
        <span>
          Payment due: <strong className="notification-modal-highlight">12.00 ADA</strong> for{" "}
          <strong>Weekend Groceries</strong>.
        </span>
      ),
      footer: (
        <button className="notification-modal-link">
          Pay Now
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      ),
    },
    {
      id: "invite-3",
      type: "invite" as const,
      unread: false,
      time: "2d ago",
      message: (
        <span>
          <strong>Maya</strong> invited you to <strong>Beach House</strong>
        </span>
      ),
      footer: <span className="notification-modal-status">Declined</span>,
    },
    {
      id: "payment-3",
      type: "payment" as const,
      unread: false,
      time: "3d ago",
      message: (
        <span>
          You settled <strong className="notification-modal-highlight">8.75 ADA</strong> in{" "}
          <strong>Apartment</strong>.
        </span>
      ),
      footer: <span className="notification-modal-status">Completed</span>,
    },
    {
      id: "invite-4",
      type: "invite" as const,
      unread: true,
      time: "4d ago",
      message: (
        <span>
          <strong>Chris</strong> invited you to <strong>Road Trip</strong>
        </span>
      ),
      actions: (
        <>
          <button className="notification-modal-pill is-primary">Accept</button>
          <button className="notification-modal-pill">Decline</button>
        </>
      ),
    },
    {
      id: "payment-4",
      type: "payment" as const,
      unread: true,
      time: "5d ago",
      message: (
        <span>
          Reminder: <strong className="notification-modal-highlight">22.40 ADA</strong> pending for{" "}
          <strong>Utilities</strong>.
        </span>
      ),
      footer: (
        <button className="notification-modal-link">
          Settle Now
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      ),
    },
    {
      id: "invite-5",
      type: "invite" as const,
      unread: false,
      time: "6d ago",
      message: (
        <span>
          <strong>Priya</strong> invited you to <strong>Office Lunch</strong>
        </span>
      ),
      footer: <span className="notification-modal-status">Accepted</span>,
    },
    {
      id: "payment-5",
      type: "payment" as const,
      unread: false,
      time: "1w ago",
      message: (
        <span>
          Payment received: <strong className="notification-modal-highlight">15.00 ADA</strong> from{" "}
          <strong>Sam</strong>.
        </span>
      ),
      footer: <span className="notification-modal-status">Received</span>,
    },
  ]);

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "all") return true;
    if (activeTab === "invites") return item.type === "invite";
    return item.type === "payment";
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
          <button
            className="notification-modal-mark"
            onClick={() => setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })))}
          >
            <span className="material-symbols-outlined">done_all</span>
            Mark all as read
          </button>
        </div>

        <div className="notification-modal-tabs">
          <button
            className={`notification-modal-tab ${activeTab === "all" ? "is-active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All
          </button>
          <button
            className={`notification-modal-tab ${activeTab === "invites" ? "is-active" : ""}`}
            onClick={() => setActiveTab("invites")}
          >
            Invites
          </button>
          <button
            className={`notification-modal-tab ${activeTab === "payments" ? "is-active" : ""}`}
            onClick={() => setActiveTab("payments")}
          >
            Payments
          </button>
        </div>

        <div className="notification-modal-scroll">
          {filteredNotifications.map((item) => (
            <NotificationChatItem
              key={item.id}
              unread={item.unread}
              time={item.time}
              message={item.message}
              actions={item.actions}
              footer={item.footer}
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
