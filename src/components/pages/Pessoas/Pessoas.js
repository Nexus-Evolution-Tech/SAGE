import styles from "./Pessoas.module.css";
import aluno from "../../../img/Pessoas/aluno.svg";
import prof from "../../../img/Pessoas/professores.svg";
import adm from "../../../img/Pessoas/adm.svg";
import visitor from "../../../img/Pessoas/visitor.svg";
import third from "../../../img/Pessoas/third.svg";

function Pessoas() {
  return (
    <div className={styles.container}>
      <div className={styles.titleContainer}>
        <h1 className={styles.title}>Pessoas</h1>
      </div>
      <div className={styles.cards}>

      <a href="/" style={{textDecoration: 'none'}}>
        <div className={styles.card}>
          <div className={styles.cardContainer}>
            <img src={aluno} alt="user" className={styles.userImage} />
          </div>
          <div className={styles.user}>
            <p>Alunos</p>
          </div>
        </div>
        </a>

        <a href="/" style={{textDecoration: 'none'}}>
        <div className={styles.card}>
          <div className={styles.cardContainer}>
            <img src={prof} alt="user" className={styles.userImage} style={{width: '130px'}} />
          </div>
          <div className={styles.user}>
            <p>Professores</p>
          </div>
        </div>
    </a>

        <a href="/" style={{textDecoration: 'none'}}>
        <div className={styles.card}>
          <div className={styles.cardContainer}>
            <img src={adm} alt="user" className={styles.userImage} />
          </div>
          <div className={styles.user}>
            <p>Administração</p>
          </div>
        </div>
        </a>
        </div>



        <div className={styles.cards}>
        <a href="/" style={{textDecoration: 'none'}}>
          <div className={styles.card}>
            <div className={styles.cardContainer}>
              <img src={visitor} alt="user" className={styles.userImage} />
            </div>
            <div className={styles.user}>
              <p>Visitantes</p>
            </div>
            </div>
        </a>
        
          
        <a href="/" style={{textDecoration: 'none'}}>
          <div className={styles.card}>
            <div className={styles.cardContainer}>
              <img src={third} alt="user" className={styles.userImage} />
            </div>
            <div className={styles.user}>
              <p>Terceirizados</p>
            </div>
          </div>
          </a>
        </div>
      </div>    
  );
}

export default Pessoas;
