import { faHome, faWifi, faBuilding, faUser, faGlobe, faFileLines, faChartSimple } from "@fortawesome/free-solid-svg-icons";

const navLinks = [
  { to: "/inicio", label: "Home", icon: faHome },
  { to: "/monitoramento", label: "Monitoramento", icon: faWifi, adminOnly: true },
  { to: "/departamentos", label: "Departamentos", icon: faBuilding, match: ["/pessoas", "/formulario", "/adicionar", "/tabelas", "/turmas"] },
  { to: "/dispositivos", label: "Dispositivos", icon: faGlobe, adminOnly: true },
  { to: "/horarios", label: "Horários", icon: faFileLines, match: ["/aulas"] },
  { to: "/relatorios", label: "Relatórios", icon: faChartSimple },
  { to: "/dados", label: "Dados Escolares", icon: faChartSimple },
];

export const userLink = { to: "/profile", icon: faUser };

export function getVisibleNavLinks(papel) {
  return navLinks.filter((link) => !link.adminOnly || papel === "ADMINISTRADOR");
}

export default navLinks;
