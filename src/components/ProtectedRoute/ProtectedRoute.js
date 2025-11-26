import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Função simples para verificar se o token existe
const useAuth = () => {
  const token = localStorage.getItem('token');
  return token ? true : false;
};

const ProtectedRoute = () => {
  const isAuth = useAuth();

  // Se o usuário estiver autenticado, renderiza a rota filha (o <Outlet />)
  // Se não, redireciona para a página de login (que no seu App.js é "/")
  // O "replace" é crucial aqui também!
  return isAuth ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;