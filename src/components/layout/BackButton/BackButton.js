import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import styles from "./BackButton.module.css";

function BackButton({ fallback }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (fallback) {
      navigate(fallback);
    } else {
      navigate(-1);
    }
  };

  return (
    <button type="button" className={styles.backButton} onClick={handleClick}>
      <FontAwesomeIcon icon={faArrowLeft} className={styles.icon} />
      <span>Voltar</span>
    </button>
  );
}

export default BackButton;
