import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Cliente from './pages/Cliente';
import Funcionario from './pages/Funcionario';
import Producao from './pages/Producao';
import Admin from './pages/Admin';
import { api } from './services/api';

function AppContent() {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
      api.defaults.headers.Authorization = `Bearer ${token}`;
    }
  }, [token]);

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    api.defaults.headers.Authorization = `Bearer ${token}`;
    
    let redirectPath = '/login';
    switch(user.role) {
      case 'admin': redirectPath = '/admin'; break;
      case 'funcionario': redirectPath = '/funcionario'; break;
      case 'producao': redirectPath = '/producao'; break;
      default: redirectPath = '/cliente';
    }
    navigate(redirectPath);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.Authorization;
    navigate('/login');
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!token || !user) {
      return <Navigate to="/login" />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/cliente" element={<Cliente />} />
      <Route path="/funcionario" element={
        <ProtectedRoute allowedRoles={['funcionario', 'admin']}>
          <Funcionario onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      <Route path="/producao" element={
        <ProtectedRoute allowedRoles={['producao', 'admin']}>
          <Producao onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Admin onLogout={handleLogout} />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
