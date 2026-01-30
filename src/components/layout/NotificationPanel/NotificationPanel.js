import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTrash,
  faCheckDouble,
  faBell,
  faCircleInfo,
  faExclamationTriangle,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useNotifications } from "../../../contexts/NotificationContext";
import styles from "./NotificationPanel.module.css";

const typeIcons = {
  info: faCircleInfo,
  warning: faExclamationTriangle,
  success: faCheck,
  error: faExclamationTriangle,
};

function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays} dia(s) atrás`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function NotificationItem({ notification }) {
  const { markAsRead, deleteNotification } = useNotifications();
  const icon = typeIcons[notification.type] || faInfoCircle;

  return (
    <div
      className={`${styles.item} ${notification.read ? styles.read : ""}`}
      data-id={notification.id}
    >
      <div className={styles.itemIcon}>
        <FontAwesomeIcon icon={icon} className={styles[notification.type]} />
      </div>
      <div className={styles.itemContent}>
        <div className={styles.itemTitle}>{notification.title}</div>
        {notification.message && (
          <div className={styles.itemMessage}>{notification.message}</div>
        )}
        <div className={styles.itemTime}>{formatDate(notification.createdAt)}</div>
      </div>
      <div className={styles.itemActions}>
        {!notification.read && (
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => markAsRead(notification.id)}
            title="Marcar como lida"
          >
            <FontAwesomeIcon icon={faCheck} />
          </button>
        )}
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => deleteNotification(notification.id)}
          title="Excluir"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );
}

export default function NotificationPanel({ onClose, panelRef }) {
  const {
    notifications,
    unreadCount,
    markAllAsRead,
  } = useNotifications();

  return (
    <div ref={panelRef} className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Notificações</h3>
        {unreadCount > 0 && (
          <button
            type="button"
            className={styles.markAllBtn}
            onClick={markAllAsRead}
          >
            <FontAwesomeIcon icon={faCheckDouble} />
            Marcar todas como lidas
          </button>
        )}
      </div>
      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>
            <FontAwesomeIcon icon={faBell} className={styles.emptyIcon} />
            <p>Nenhuma notificação</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))
        )}
      </div>
    </div>
  );
}
