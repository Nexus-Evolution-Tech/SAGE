import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";

import logo from "../../../img/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import navLinks, { settingsLink, userLink } from "./NavLinks.js";

function Navbar() {
  const navRef = useRef(null);

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
        <NavLink
          to={settingsLink.to}
          className={({ isActive }) =>
            isActive
              ? `${styles.bottomLink} ${styles.activeBottom}`
              : styles.bottomLink
          }
        >
          <FontAwesomeIcon icon={settingsLink.icon} className={styles.icon} />
        </NavLink>
        <NavLink
          to={userLink.to}
          className={({ isActive }) =>
            isActive
              ? `${styles.bottomLink} ${styles.activeBottom}`
              : styles.bottomLink
          }
        >
          <FontAwesomeIcon icon={userLink.icon} className={styles.icon} />
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
