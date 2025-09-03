import React, { useState } from "react";
import styles from "./Areas.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import catraca from "../../../img/entrada.png";

function Areas() {
  const [showModal, setShowModal] = useState(false);

  const toggleModal = () => setShowModal((prev) => !prev);

  return (
    <>
      <div className={styles.container}>
        <h1>Áreas</h1>

        <div className={styles.contentContainer}>
          <div className={styles.cardsRow}>
            <div className={styles.cardContainer}>
              <div className={styles.photoContainer}>
                <h3>Entrada</h3>
                <img src={catraca} />
              </div>
              <div className={styles.buttonContainer}>
                {" "}
                <button className={styles.iconButton} onClick={toggleModal}>
                  <FontAwesomeIcon
                    icon={faCirclePlus}
                    className={styles.icon}
                  />
                  Adicionar área
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.container}>
        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.titleModalContainer}>
                <h2 className={styles.titleModal}></h2>
                <h2 className={styles.titleModal}>Inserir Nome</h2>
                <button className={styles.backButton} onClick={toggleModal}>
                  <FontAwesomeIcon icon={faXmark} className={styles.icon} />
                </button>
              </div>

              <div className={styles.contentContainer}>
                <div className={styles.pictureContainer}>
                  <img src={catraca} className={styles.modalImage} />

                  <label htmlFor="fileInput" className={styles.uploadButton}>
                    Escolher imagem
                  </label>
                  <input
                    id="fileInput"
                    type="file"
                    className={styles.fileInput}
                  />
                </div>

                <div className={styles.reatedContainer}>
                  <h4>Dispositivos Associados</h4>
                  <div className={styles.relatedDevices}>
                    Nenhum dispositivo associado
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Areas;
