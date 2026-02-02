import React from "react";
import styles from "./SystemStatusBadge.module.css";

/**
 * Badge padronizado para indicar status do sistema (online/offline/loading).
 * Usado em: Home, Monitoramento, Relatórios, Início, Dispositivos.
 *
 * @param {Object} props
 * @param {'online'|'offline'|'loading'} props.status - Estado do sistema
 * @param {string} [props.label] - Texto customizado (ex: "API online", "Conectado", "Sistema online")
 * @param {number} [props.countOnline] - Se informado, mostra "X online / Y offline" (para Dispositivos)
 * @param {number} [props.countOffline] - Usado junto com countOnline
 * @param {string} [props.title] - Tooltip/title do elemento
 */
function SystemStatusBadge({
  status,
  label,
  countOnline,
  countOffline,
  title,
}) {
  /* Só mostra "X online / Y offline" quando countOnline e countOffline forem passados (ex: tela Dispositivos) */
  const hasCount = countOnline !== undefined && countOffline !== undefined;

  const resolvedStatus = hasCount
    ? Number(countOnline) > 0
      ? "online"
      : "offline"
    : status || "offline";

  const resolvedLabel = hasCount
    ? `${Number(countOnline)} online / ${Number(countOffline)} offline`
    : label ||
      (resolvedStatus === "online" && "Sistema online") ||
      (resolvedStatus === "offline" && "Sistema offline") ||
      (resolvedStatus === "loading" && "Verificando...") ||
      "Sistema offline";

  return (
    <span
      className={`${styles.badge} ${styles[resolvedStatus]}`}
      title={title || (resolvedStatus === "online" ? "Sistema respondendo" : "Sistema indisponível")}
      role="status"
      aria-live="polite"
    >
      <span className={styles.dot} />
      {resolvedLabel}
    </span>
  );
}

export default SystemStatusBadge;
