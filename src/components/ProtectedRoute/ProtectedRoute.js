import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getSession } from '../../utils/session';

// Função simples para verificar se o token existe
const useAuth = () => {
  const token = localStorage.getItem('token');
  return token ? true : false;
};

const ProtectedRoute = () => {
  const [, refresh] = useState(0);
  const location = useLocation();
  const session = getSession();
  const isAuth = useAuth();

  useEffect(() => {
    const handleAuthChanged = () => refresh((value) => value + 1);
    window.addEventListener('auth-changed', handleAuthChanged);
    return () => window.removeEventListener('auth-changed', handleAuthChanged);
  }, []);

  // Se o usuário estiver autenticado, renderiza a rota filha (o <Outlet />)
  // Se não, redireciona para a página de login (que no seu App.js é "/")
  // O "replace" é crucial aqui também!
  if (!isAuth) return <Navigate to="/" replace />;
  if (session.precisa_trocar_senha && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
