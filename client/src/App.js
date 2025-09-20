import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// i18n
import './i18n';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Header from './components/layout/Header';
import Loading from './components/common/Loading';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

import Events from './pages/Events';
import People from './pages/People';
import EasterMinistry from './pages/EasterMinistry';
import EditHomePage from './pages/EditHomePage';

import AdminDashboard from './pages/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/events" replace />;
  }
  
  return children;
};

// Main App Component
const AppContent = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }

  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={user ? <Navigate to="/events" replace /> : <Login />} />
            <Route path="/requestaccount" element={user ? <Navigate to="/events" replace /> : <Register />} />

            <Route path="/events" element={<Events />} />
            <Route path="/people" element={<People />} />
            <Route path="/easter-ministry" element={<EasterMinistry />} />
            <Route path="/edit-home-page" element={<ProtectedRoute allowedRoles={['editor', 'admin', 'superadmin']}><EditHomePage /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

// Root App Component with Context
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
