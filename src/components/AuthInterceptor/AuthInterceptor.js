import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionExpiredModal from '../SessionExpiredModal/SessionExpiredModal';
import { useNotifications } from '../../contexts/NotificationContext';

const AuthInterceptor = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const handleAuthExpired = (event) => {
      const msg = event.detail?.message || 'Sua sessão expirou. Faça login novamente.';
      setMessage(msg);
      addNotification({
        title: 'Sessão expirada',
        message: msg,
        type: 'warning',
      });
      setIsModalOpen(true);
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    const handlePasswordChangeRequired = () => navigate('/trocar-senha', { replace: true });
    window.addEventListener('auth-troca-senha', handlePasswordChangeRequired);

    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
      window.removeEventListener('auth-troca-senha', handlePasswordChangeRequired);
    };
  }, [addNotification, navigate]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    

    navigate('/', { replace: true });
  };

  return isModalOpen 
    ? <SessionExpiredModal message={message} onClose={handleCloseModal} /> 
    : null;
};

export default AuthInterceptor;
