import React from "react";
import styles from "./BotaoExportar.module.css";

export default function BotaoExportar({ onExport }) {
  return (
    <div className={styles.wrapper}>
      <button className={styles.btn} onClick={() => onExport?.("EXCEL")}>Exportar Excel</button>
      <button className={styles.btnGhost} onClick={() => onExport?.("PDF")}>Exportar PDF</button>
    </div>
  );
}
