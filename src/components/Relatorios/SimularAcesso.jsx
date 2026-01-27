import React, { useState, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { criarAcesso, getRelatorioTurmas } from '../../services/api';
import styles from './SimularAcesso.module.css';

export default function SimularAcesso({ isOpen, onClose, onSuccess }) {
  const [pessoaId, setPessoaId] = useState('');
  const [status, setStatus] = useState('ENTRADA');
  const [dispositivo, setDispositivo] = useState('1');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Dummy list of people (would come from API in production)
  const pessoas = [
    { id: 1, nome: 'ALEXSANDER SOUSA DE LIMA' },
    { id: 2, nome: 'ANA CLARA GUEDES FELISBINO' },
    { id: 3, nome: 'ARTHUR CHILOTE' },
    { id: 4, nome: 'ARTHUR HENRIQUE SANTOS MACHADO' },
    { id: 5, nome: 'BEATRIZ ISABELA NASS DOS SANTOS' },
    { id: 6, nome: 'BRUNO ROLIM MATHIAS BATISTA DA CRUZ' },
    { id: 7, nome: 'BRYAN PIRES DOS SANTOS' },
    { id: 8, nome: 'CAIO RENAN SILVA BARBOSA' },
    { id: 9, nome: 'CAUÃ DEOCLIDES JESUS DO NASCIMENTO' },
    { id: 10, nome: 'CHRISTIAN EVANGELISTA PALANCIO CEZAR' },
  ];

  const mutation = useMutation({
    mutationFn: async (data) => {
      return await criarAcesso(data);
    },
    onSuccess: (data) => {
      setMessageType('success');
      setMessage(data.message || 'Acesso registrado com sucesso!');
      setPessoaId('');
      setStatus('ENTRADA');
      // Chama o callback de sucesso imediatamente para atualizar os dados
      setTimeout(() => {
        onSuccess?.();
      }, 100);
    },
    onError: (error) => {
      setMessageType('error');
      setMessage(error.message || 'Erro ao registrar acesso');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!pessoaId) {
      setMessageType('error');
      setMessage('Selecione uma pessoa');
      return;
    }

    mutation.mutate({
      pessoa_id: parseInt(pessoaId),
      dispositivo_id: parseInt(dispositivo),
      status,
      permitido: true,
      metodo_auth: 'QR_CODE',
    });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Simular Acesso</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="pessoa">Pessoa:</label>
            <select
              id="pessoa"
              value={pessoaId}
              onChange={(e) => setPessoaId(e.target.value)}
              disabled={mutation.isPending}
            >
              <option value="">-- Selecione uma pessoa --</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={mutation.isPending}
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="dispositivo">Dispositivo:</label>
            <select
              id="dispositivo"
              value={dispositivo}
              onChange={(e) => setDispositivo(e.target.value)}
              disabled={mutation.isPending}
            >
              <option value="1">Catraca 1</option>
              <option value="2">Catraca 2</option>
            </select>
          </div>

          {message && (
            <div className={`${styles.message} ${styles[messageType]}`}>
              {message}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={mutation.isPending || !pessoaId}
            >
              {mutation.isPending ? 'Registrando...' : 'Registrar Acesso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
