import React from "react";
import styles from "./Inicio.module.css";
import chart from "../../../img/grafico.png";

const Home = () => {
  return (
    <div className={styles.container}>
      <div className={styles.cardsContainer}>
        <div className={styles.topCards}>
          <div className={styles.card}>
            <img src={chart} className={styles.chart} />
          </div>
          <div className={styles.card}>
            <img src={chart} className={styles.chart} />
          </div>
          <div className={styles.card}>
            <img src={chart} className={styles.chart} />
          </div>
        </div>

        <div className={styles.chartContainer}>
          <img src={chart} className={styles.chart} />
        </div>
      </div>
    </div>
  );
};

export default Home;
