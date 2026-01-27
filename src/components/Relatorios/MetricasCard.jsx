import React from "react";
import styles from "./MetricasCard.module.css";

export default function MetricasCard({ label, value = 0, helper = "", color = "#0ea5e9" }) {
  return (
    <div className={styles.card} style={{ borderColor: color }}>
      <div className={styles.dot} style={{ background: color }} />
      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        <strong className={styles.value}>{value}</strong>
        {helper && <span className={styles.helper}>{helper}</span>}
      </div>
    </div>
  );
}
