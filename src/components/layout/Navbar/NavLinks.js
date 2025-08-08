import { faPerson, faWifi, faBuilding, faGear } from "@fortawesome/free-solid-svg-icons";

const navLinks = [
  { to: "/", label: "Monitoramento", icon: faWifi },
  { to: "/departamentos", label: "Departamentos", icon: faBuilding },
  { to: "/dispositivos", label: "Dispositivos", icon: faBuilding },
];

export const settingsLink = { to: "/settings", icon: faGear };

export default navLinks;
