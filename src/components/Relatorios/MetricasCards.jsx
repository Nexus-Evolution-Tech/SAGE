import React from 'react';
import styles from './MetricasCards.module.css';

export default function MetricasCards({ metricas }) {
  if (!metricas) {
    return (
      <div className={styles.cards}>
        <div style={{ color: '#999', textAlign: 'center', width: '100%' }}>Carregando métricas...</div>
      </div>
    );
  }

  const cards = [
    { label: 'Total', valor: metricas.total || 0, cor: '#2196F3' },
    { label: 'No Horário', valor: metricas.no_horario || 0, cor: '#4CAF50' },
    { label: 'Atrasados', valor: metricas.atrasados || 0, cor: '#FFC107' },
    { label: 'Faltantes', valor: metricas.faltantes || 0, cor: '#F44336' }
  ];

  return (
    <div className={styles.cards}>
      {cards.map((card, i) => (
        <div key={i} className={styles.card} style={{ borderLeftColor: card.cor }}>
          <div className={styles.label}>{card.label}</div>
          <div className={styles.valor}>{card.valor}</div>
        </div>
      ))}
    </div>
  );
}
