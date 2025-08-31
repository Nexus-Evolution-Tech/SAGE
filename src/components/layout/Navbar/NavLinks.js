import { faHome, faWifi, faBuilding, faCog, faUser, faClock, faGlobe, faFileLines, faChartSimple } from "@fortawesome/free-solid-svg-icons";

const navLinks = [
  { to: "/inicio", label: "Home", icon: faHome },
  { to: "/monitoramento", label: "Monitoramento", icon: faWifi },
  { to: "/departamentos", label: "Departamentos", icon: faBuilding },
  { to: "/dispositivos", label: "Dispositivos", icon: faGlobe },
  { to: "/areas", label: "Áreas", icon: faClock },
  { to: "/horarios", label: "Horários", icon: faFileLines },
  { to: "/regras", label: "Regras", icon: faFileLines },
  { to: "/relatorios", label: "Relatórios", icon: faChartSimple },
];

export const settingsLink = { to: "/settings", icon: faCog };
export const userLink = { to: "/profile", icon: faUser };

export default navLinks;
