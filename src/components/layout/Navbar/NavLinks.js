import { faPerson, faWifi, faBuilding, faGear, faHome } from "@fortawesome/free-solid-svg-icons";

const navLinks = [
  { to: "/Inicio", label: "Home", icon: faHome },
  { to: "/", label: "Monitoramento", icon: faWifi },
  { to: "/departamentos", label: "Departamentos", icon: faBuilding },
  // Links para testar o scroll
  { to: "/dispositivos", label: "Dispositivos", icon: faBuilding },
  { to: "/dispositivos", label: "Dispositivos", icon: faBuilding },
  { to: "/dispositivos", label: "Dispositivos", icon: faBuilding },
  { to: "/dispositivos", label: "Dispositivos", icon: faBuilding },
  { to: "/dispositivos", label: "Dispositivos", icon: faBuilding },
  { to: "/dispositivos", label: "Dispositivos", icon: faBuilding },
  { to: "/dispositivos", label: "Dispositivos", icon: faBuilding },
  { to: "/dispositivos", label: "Dispositivos", icon: faBuilding },
  { to: "/dispositivos", label: "Dispositivos", icon: faBuilding },
  { to: "/dispositivos", label: "Dispositivos", icon: faBuilding },
  { to: "/dispositivos", label: "Dispositivos", icon: faBuilding },
  { to: "/dispositivos", label: "Dispositivos", icon: faBuilding },
];

export const settingsLink = { to: "/settings", icon: faGear };

export default navLinks;
