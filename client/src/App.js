import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// i18n
import './i18n';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Loading from './components/common/Loading';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

import Events from './pages/Events';
import People from './pages/People';
import EditCarousel from './pages/EditCarousel';

import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';

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

// Conditional Footer Component
const ConditionalFooter = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isEventsPage = location.pathname === '/events';
  
  if (isHomePage || isEventsPage) {
    return null; // Don't show footer on home page or events page
  }
  
  return <Footer />;
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
            <Route path="/register" element={user ? <Navigate to="/events" replace /> : <Register />} />

            <Route path="/events" element={<Events />} />
            <Route path="/people" element={<People />} />
            <Route path="/edit-carousel" element={<ProtectedRoute allowedRoles={['editor', 'admin']}><EditCarousel /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Routes>
        </main>
        <ConditionalFooter />
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
