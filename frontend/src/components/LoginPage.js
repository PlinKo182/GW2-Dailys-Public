import React, { useState, useEffect } from 'react';
import { fetchProgress } from '../services/api';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

function LoginPage() {
  console.log('LoginPage renderizado');
  const navigate = useNavigate();
  const { addProfile } = useStore();

  useEffect(() => {
    console.log('LoginPage montado');
    return () => console.log('LoginPage desmontado');
  }, []);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    console.log('Formulário submetido com nome:', userName);

    if (!userName.trim()) {
      setError('Digite um nome válido.');
      setLoading(false);
      return;
    }

    try {
      console.log('Verificando nome no backend...');
      const data = await fetchProgress(userName.trim());
      console.log('Resposta do backend:', data);

      if (data && Object.keys(data).length > 0) {
        console.log('Nome já existe');
        setError('Nome já existe, escolha outro.');
      } else {
        console.log('Nome disponível, criando perfil...');
        addProfile(userName.trim());
        console.log('Perfil criado, navegando para dashboard...');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Erro durante o processo:', err);
      setError('Erro ao verificar nome.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-6 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">GW2 Daily Tracker</h1>
          <p className="text-muted-foreground">Escolha seu nome de usuário para começar</p>
          <p className="text-xs text-muted-foreground mt-2">Debug: {loading ? 'Carregando' : 'Pronto'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium mb-2">
              Nome de Usuário
            </label>
            <input
              id="userName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Digite um nome único"
              disabled={loading}
              maxLength={32}
              className="w-full p-2 rounded border bg-background focus:ring-2 focus:ring-primary"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            onClick={() => console.log('Botão clicado')}
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-sm text-center text-muted-foreground">
          <p>Este nome será usado para salvar seu progresso</p>
          <p>Escolha um nome que você lembre facilmente</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;