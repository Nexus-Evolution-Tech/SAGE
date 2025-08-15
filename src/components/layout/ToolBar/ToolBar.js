import React from "react";
import styles from "./ToolBar.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faB,
  faBell,
  faCircleInfo,
  faUser,
  faCaretDown
} from "@fortawesome/free-solid-svg-icons";

const ToolBar = () => {
  return (
    <div className={styles.container}>
      <div className={styles.toolButtons}>
        <a className={styles.toolLink} title="Redireciona para a página da documentação">
          <FontAwesomeIcon icon={faCircleInfo} className={styles.icon} />
        </a>
        <a className={styles.toolLink} title="Abre um modal com as notificações">
          <FontAwesomeIcon icon={faBell} className={styles.icon} />
        </a>
        <a className={styles.toolLinkUser}>
          <FontAwesomeIcon icon={faUser} className={styles.iconUser} />
          <FontAwesomeIcon icon={faCaretDown} className={styles.icon} />
        </a>
      </div>
    </div>
  );
};

export default ToolBar;
