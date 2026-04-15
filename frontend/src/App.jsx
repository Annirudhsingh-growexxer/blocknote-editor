import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SharedView from './pages/SharedView';

import { jwtDecode } from 'jwt-decode';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('accessToken');
  
  if (!token) return <Navigate to="/login" />;

  try {
    const decoded = jwtDecode(token);
    const isExpired = decoded.exp * 1000 < Date.now();
    if (isExpired) {
      localStorage.removeItem('accessToken');
      return <Navigate to="/login" />;
    }
  } catch (e) {
    localStorage.removeItem('accessToken');
    return <Navigate to="/login" />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/share/:token" element={<SharedView />} />
      </Routes>
    </Router>
  );
}

export default App;
