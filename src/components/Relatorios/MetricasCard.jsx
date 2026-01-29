import React from 'react';
import styles from './MetricasCard.module.css';
export default function MetricasCard({ label, value, color }) {
  return (
    <div className={styles.card} style={{ borderLeftColor: color }}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
