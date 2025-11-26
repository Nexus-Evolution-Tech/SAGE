import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionExpiredModal from '../SessionExpiredModal/SessionExpiredModal';

const AuthInterceptor = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthExpired = (event) => {
      setMessage(event.detail.message || 'Sua sessão expirou.');
      setIsModalOpen(true);
    };

    window.addEventListener('auth-expired', handleAuthExpired);

    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []); 

  const handleCloseModal = () => {
    setIsModalOpen(false);
    

    navigate('/', { replace: true });
  };

  return isModalOpen 
    ? <SessionExpiredModal message={message} onClose={handleCloseModal} /> 
    : null;
};

export default AuthInterceptor;