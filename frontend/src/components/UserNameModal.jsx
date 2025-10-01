import React, { useState } from 'react';
import { fetchProgress } from '../services/api';

export default function UserNameModal({ onSuccess }) {
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!userName.trim()) {
      setError('Digite um nome válido.');
      setLoading(false);
      return;
    }
    try {
      const data = await fetchProgress(userName.trim());
      if (data && Object.keys(data).length > 0) {
        setError('Nome já existe, escolha outro.');
      } else {
        onSuccess(userName.trim());
      }
    } catch (err) {
      setError('Erro ao verificar nome.');
    }
    setLoading(false);
  };

  return (
    <div className="modal-bg">
      <div className="modal">
        <h2>Escolha seu nome de usuário</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="Digite um nome único"
            disabled={loading}
            maxLength={32}
            autoFocus
          />
          <button type="submit" disabled={loading}>Criar</button>
        </form>
        {error && <div className="error">{error}</div>}
      </div>
      <style>{`
        .modal-bg { position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999; }
        .modal { background:#fff;padding:2rem;border-radius:8px;box-shadow:0 2px 16px #0002;min-width:300px; }
        .modal h2 { margin-bottom:1rem; }
        .modal input { width:100%;padding:0.5rem;margin-bottom:1rem; }
        .modal button { padding:0.5rem 1rem; }
        .error { color:red;margin-top:0.5rem; }
      `}</style>
    </div>
  );
}
