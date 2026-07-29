import styles from "./Cadastro.module.css";
import { Link } from "react-router-dom";
import logo from "../../../img/logo.png";

function Login() {
  return (
    <div className={styles.container}>
      <img src={logo} className={styles.logo} alt="Logo" />
      <div className={styles.cardTitle}>Cadastro</div>
      <div className={styles.cardContainer}>
        <div className={styles.cardItems}>
          <div className={styles.inputs}>
            <form className={styles.inputs1}>
              <p className={styles.placeholder}>Crie seu login:</p>
              <input
                type="text"
                placeholder="Username"
                className={styles.input}
              ></input>
              <p className={styles.placeholder}>Crie seu login:</p>
              <input
                type="text"
                placeholder="Password"
                className={styles.input}
              ></input>
              <p className={styles.placeholder}>Crie seu login:</p>
              <input
                type="text"
                placeholder="Password"
                className={styles.input}
              ></input>
              <p className={styles.placeholder}>Crie seu login:</p>
              <input
                type="text"
                placeholder="Password"
                className={styles.input}
              ></input>
              <p className={styles.placeholder}>Crie seu login:</p>
              <input
                type="text"
                placeholder="Password"
                className={styles.input}
              ></input>
              <p className={styles.placeholder}>Crie seu login:</p>
              <input
                type="text"
                placeholder="Password"
                className={styles.input}
              ></input>
            </form>
            <form className={styles.inputs2}>
              <p className={styles.placeholder}>Crie seu login:</p>
              <input
                type="text"
                placeholder="Username"
                className={styles.input}
              ></input>
              <input
                type="text"
                placeholder="Password"
                className={styles.input}
              ></input>
              <input
                type="text"
                placeholder="Password"
                className={styles.input}
              ></input>
            </form>
          </div>

          <Link className={styles.btn} to="/">
            CADASTRAR
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
