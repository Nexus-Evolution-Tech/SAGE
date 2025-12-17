// src/components/common/CacheDebugger.js
// COMPONENTE DE DEBUG - Remover em produção

import { useCache } from '../../contexts/CacheContext';
import styles from './CacheDebugger.module.css';

function CacheDebugger() {
  const { cache, clearAllCache, invalidateCacheByResource } = useCache();

  // Conta quantos recursos estão em cache
  const cacheKeys = Object.keys(cache);
  const cacheCount = cacheKeys.length;

  // Agrupa por tipo de recurso
  const cacheByType = cacheKeys.reduce((acc, key) => {
    const tipo = key.split(':')[0];
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {});

  // Calcula idade do cache
  const getCacheAge = (timestamp) => {
    if (!timestamp) return 'N/A';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className={styles.debugger}>
      <div className={styles.header}>
        <h3>🔍 Cache Debugger</h3>
        <button onClick={clearAllCache} className={styles.btnClear}>
          Limpar Tudo
        </button>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.label}>Total em Cache:</span>
          <span className={styles.value}>{cacheCount}</span>
        </div>
      </div>

      <div className={styles.breakdown}>
        <h4>Por Tipo de Recurso:</h4>
        {Object.entries(cacheByType).map(([tipo, count]) => (
          <div key={tipo} className={styles.typeRow}>
            <span className={styles.typeName}>{tipo}</span>
            <span className={styles.typeCount}>{count} itens</span>
            <button
              onClick={() => invalidateCacheByResource(tipo)}
              className={styles.btnInvalidate}
            >
              Limpar
            </button>
          </div>
        ))}
      </div>

      <div className={styles.details}>
        <h4>Detalhes do Cache:</h4>
        <div className={styles.cacheList}>
          {cacheKeys.map((key) => (
            <div key={key} className={styles.cacheItem}>
              <div className={styles.cacheKey}>{key}</div>
              <div className={styles.cacheInfo}>
                <span className={styles.age}>
                  Idade: {getCacheAge(cache[key]?.timestamp)}
                </span>
                <span className={styles.status}>
                  {cache[key]?.loading ? '⏳ Loading' : '✅ Pronto'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CacheDebugger;
