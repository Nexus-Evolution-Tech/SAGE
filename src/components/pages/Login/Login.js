import styles from "./Login.module.css";
import {Link} from 'react-router-dom';
import LinkButton from "../../layout/LinkButton/LinkButton";
import { width } from "@fortawesome/free-solid-svg-icons/fa0";
import logo from '../../../img/logo.png';


function Login() {
  return (
    <div className={styles.container}>
      <img src={logo} className={styles.logo}/>
      <div className={styles.cardTitle}>Login</div>
      <div className={styles.cardContainer}>
        <form className={styles.inputs}>
            <input type="text" placeholder="Username" className={styles.input}></input>
            <input type="text" placeholder="Password" className={styles.input}></input>
        </form>
        <Link className={styles.btn} to='/'>
            ENTRAR
        </Link>
      </div>
    </div>
  );
}

export default Login;
