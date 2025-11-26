import React from 'react';
import styles from './SessionExpiredModal.module.css';

const SessionExpiredModal = ({ message, onClose }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Sessão Expirada</h2>
        </div>
        <p className={styles.modalMessage}>{message}</p>
        <button onClick={onClose} className={styles.modalButton}>
          Ir para Login
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredModal;