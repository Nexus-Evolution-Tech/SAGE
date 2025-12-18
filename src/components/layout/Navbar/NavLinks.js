import { faHome, faWifi, faBuilding, faUser, faClock, faGlobe, faFileLines, faChartSimple } from "@fortawesome/free-solid-svg-icons";

const navLinks = [
  { to: "/inicio", label: "Home", icon: faHome },
  { to: "/monitoramento", label: "Monitoramento", icon: faWifi },
  { to: "/departamentos", label: "Departamentos", icon: faBuilding, match: ["/pessoas", "/formulario", "/adicionar", "/tabelas", "/turmas"] },
  { to: "/dispositivos", label: "Dispositivos", icon: faGlobe },
  { to: "/areas", label: "Áreas", icon: faClock },
  { to: "/horarios", label: "Horários", icon: faFileLines, match: ["/aulas"] },
  { to: "/relatorios", label: "Relatórios", icon: faChartSimple },
];

export const userLink = { to: "/profile", icon: faUser };

export default navLinks;
