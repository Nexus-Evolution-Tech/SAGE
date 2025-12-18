import React from 'react';
import styles from './SkeletonLoader.module.css';


function SkeletonLoader({ type = 'list', count = 5, height = 'auto' }) {
  if (type === 'list') {
    return (
      <div className={styles.skeletonContainer}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.skeletonItem}>
            <div className={styles.skeletonLine} style={{ width: '100%', marginBottom: '12px' }} />
            <div className={styles.skeletonLine} style={{ width: '95%', marginBottom: '12px' }} />
            <div className={styles.skeletonLine} style={{ width: '90%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={styles.skeletonCardGrid}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonCardImage} />
            <div className={styles.skeletonCardContent}>
              <div className={styles.skeletonLine} style={{ width: '80%', marginBottom: '12px' }} />
              <div className={styles.skeletonLine} style={{ width: '70%', marginBottom: '12px' }} />
              <div className={styles.skeletonLine} style={{ width: '60%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={styles.skeletonTable}>
        {/* Header do table */}
        <div className={styles.skeletonTableHeader}>
          <div className={styles.skeletonLine} style={{ width: '20%' }} />
          <div className={styles.skeletonLine} style={{ width: '20%' }} />
          <div className={styles.skeletonLine} style={{ width: '20%' }} />
        </div>

        {/* Rows do table */}
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.skeletonTableRow}>
            <div className={styles.skeletonLine} style={{ width: '20%' }} />
            <div className={styles.skeletonLine} style={{ width: '20%' }} />
            <div className={styles.skeletonLine} style={{ width: '20%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'feed') {
    return (
      <div className={styles.skeletonContainer}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={styles.skeletonFeed}>
            <div className={styles.skeletonFeedHeader}>
              <div className={styles.skeletonAvatar} />
              <div style={{ flex: 1 }}>
                <div className={styles.skeletonLine} style={{ width: '60%', marginBottom: '8px' }} />
                <div className={styles.skeletonLine} style={{ width: '40%', height: '12px' }} />
              </div>
            </div>
            <div className={styles.skeletonFeedImage} style={{ marginTop: '16px', marginBottom: '16px' }} />
            <div className={styles.skeletonLine} style={{ width: '100%', marginBottom: '12px' }} />
            <div className={styles.skeletonLine} style={{ width: '85%' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.skeletonContainer}>
      <div className={styles.skeletonItem}>
        <div className={styles.skeletonLine} />
      </div>
    </div>
  );
}

export default SkeletonLoader;
