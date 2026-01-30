import React, { useState, useRef, useEffect } from "react";
import styles from "./ToolBar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { useNotifications } from "../../../contexts/NotificationContext";
import NotificationPanel from "../NotificationPanel/NotificationPanel";

const ToolBar = () => {
  const [showPanel, setShowPanel] = useState(false);
  const iconRef = useRef(null);
  const panelRef = useRef(null);
  const { unreadCount, hasNewPulse } = useNotifications();

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        iconRef.current &&
        !iconRef.current.contains(event.target) &&
        panelRef.current &&
        !panelRef.current.contains(event.target)
      ) {
        setShowPanel(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.toolButtons}>
        <div className={styles.notificationWrap}>
          <button
            ref={iconRef}
            type="button"
            className={styles.toolLink}
            title="Notificações"
            onClick={() => setShowPanel((prev) => !prev)}
          >
            <FontAwesomeIcon icon={faBell} className={styles.icon} />
            {unreadCount > 0 && (
              <span
                className={`${styles.badge} ${hasNewPulse ? styles.badgePulse : ""}`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          {showPanel && (
            <NotificationPanel
              onClose={() => setShowPanel(false)}
              panelRef={panelRef}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolBar;
