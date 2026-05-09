import React from "react";

interface NotificationChatItemProps {
  message: React.ReactNode;
  time: string;
  unread?: boolean;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

const NotificationChatItem: React.FC<NotificationChatItemProps> = ({
  message,
  time,
  unread = false,
  actions,
  footer,
}) => {
  return (
    <div className={`notification-chat ${unread ? "is-unread" : ""}`}>
      <div className="notification-chat-body">
        <div className="notification-chat-row">
          <div className="notification-chat-message">{message}</div>
          <div className="notification-chat-meta">
            <span className="notification-chat-time">{time}</span>
            {unread && <span className="notification-chat-dot" />}
          </div>
        </div>
        {actions && <div className="notification-chat-actions">{actions}</div>}
        {footer && <div className="notification-chat-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default NotificationChatItem;
