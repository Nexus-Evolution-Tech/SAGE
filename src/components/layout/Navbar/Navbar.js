import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import Container from "../Container/Container";
import styles from "./Navbar.module.css";
import logo from "../../../img/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import navLinks, { settingsLink } from "./NavLinks.js";

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
      <Container>
        <NavLink to="/">
          <img src={logo} alt="Logo" />
        </NavLink>
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
                {link.label}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink
              to={settingsLink.to}
              className={({ isActive }) =>
                isActive ? styles.activeGear : styles.inactiveGear
              }
            >
              <FontAwesomeIcon icon={settingsLink.icon} className={styles.iconGear} />
            </NavLink>
          </li>
        </ul>
      </Container>
    </nav>
  );
}

export default Navbar;
