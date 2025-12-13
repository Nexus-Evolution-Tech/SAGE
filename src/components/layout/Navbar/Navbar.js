import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";

import logo from "../../../img/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import navLinks, { userLink } from "./NavLinks.js";

function Navbar() {
  const navRef = useRef(null);
  const navigate = useNavigate(); 

  const [showUserModal, setShowUserModal] = useState(false);
  const userIconRef = useRef(null); 
  const userModalRef = useRef(null); 

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        navRef.current?.classList.add(styles.scrolled);
      } else {
        navRef.current?.classList.remove(styles.scrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        userModalRef.current &&
        !userModalRef.current.contains(event.target) &&
        userIconRef.current &&
        !userIconRef.current.contains(event.target)
      ) {
        setShowUserModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userModalRef, userIconRef]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <nav className={styles.navbar} ref={navRef}>
      <NavLink to="/" className={styles.logoLink}>
        <img src={logo} alt="Logo" className={styles.logo} />
      </NavLink>

      <div className={styles.mainNav}>
        <div className={styles.navTitleContainer}>
          <div className={styles.navTitle}>Páginas</div>
          <hr className={styles.divider} />
        </div>

        <ul className={styles.list}>
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  isActive ? styles.active : styles.inactive
                }
              >
                <FontAwesomeIcon icon={link.icon} className={styles.icon} />
                <span className={styles.linkLabel}>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.bottomNav}>
  

        <div className={styles.userMenuContainer}>
          <button
            ref={userIconRef}
            onClick={() => setShowUserModal(!showUserModal)}
            className={`${styles.bottomLink} ${
              showUserModal ? styles.activeBottom : ""
            }`}
          >
            <FontAwesomeIcon icon={userLink.icon} />
          </button>

          {showUserModal && (
            <div ref={userModalRef} className={styles.userModal}>
              {/* <button
                className={styles.modalButton}
                onClick={() => {
                  navigate("/redefinir-senha");
                  setShowUserModal(false);
                }}
              >
                Redefinir Senha
              </button> */}
              <button
                className={styles.modalButton}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;