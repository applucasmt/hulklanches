import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@hulk.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('✅ BOTÃO CLICADO!');
    console.log('📧 Email:', email);
    console.log('🔑 Senha:', password);
    
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('✅ Resposta recebida:', response.data);
      
      if (onLogin) {
        console.log('🔄 Chamando onLogin...');
        onLogin(response.data.token, response.data.user);
      } else {
        console.error('❌ onLogin não está definido!');
      }
    } catch (err) {
      console.error('❌ Erro:', err);
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const goToCliente = () => {
    navigate('/cliente');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">🍔 Hulk Lanches</h1>
          <p className="text-gray-600 mt-2">Sistema de Atendimento</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="admin@hulk.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="123456"
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Botão Área do Cliente */}
        <div className="mt-4">
          <button
            onClick={goToCliente}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            👀 Área do Cliente
          </button>
          <p className="text-center text-xs text-gray-500 mt-2">
            Acesse o cardápio digital sem fazer login
          </p>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Credenciais:</p>
          <p className="font-mono text-xs">admin@hulk.com / 123456 (Admin)</p>
          <p className="font-mono text-xs">funcionario@hulk.com / 123456 (Funcionário)</p>
          <p className="font-mono text-xs">producao@hulk.com / 123456 (Produção)</p>
        </div>
      </div>
    </div>
  );
}

export default Login;