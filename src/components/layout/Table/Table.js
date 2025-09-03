import { useNavigate } from "react-router-dom";
import styles from "./Table.module.css";

function TableSection({ title, subtitle, columns, data, tipo, link }) {
  const navigate = useNavigate();

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>{title}</h2>
        {link && (
          <button
            className={styles.verMais}
            onClick={() => navigate(link)}
          >
            Ver mais →
          </button>
        )}
      </div>
      {subtitle && <h4 className={styles.subtitle}>{subtitle}</h4>}

      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col}</th>
            ))}
            <th>Mais</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((col, j) => (
                <td key={j}>{row[col] ?? "-"}</td>
              ))}
              <td>
                <button
                  className={styles.verBtn}
                  onClick={() => navigate(`/formulario/${tipo}/${row.id}`)}
                >
                  Ver informações
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableSection;
