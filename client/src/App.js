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
import EditEasterMinistry from './pages/EditEasterMinistry';
import YouthMinistry from './pages/YouthMinistry';
import EditYouthMinistry from './pages/EditYouthMinistry';
import WorshipMinistry from './pages/WorshipMinistry';
import EditWorshipMinistry from './pages/EditWorshipMinistry';
import ChildrenMinistry from './pages/ChildrenMinistry';
import EditChildrenMinistry from './pages/EditChildrenMinistry';
import MensMinistry from './pages/MensMinistry';
import EditMensMinistry from './pages/EditMensMinistry';
import WomensMinistry from './pages/WomensMinistry';
import EditWomensMinistry from './pages/EditWomensMinistry';
import ChoirMinistry from './pages/ChoirMinistry';
import EditChoirMinistry from './pages/EditChoirMinistry';
import BibleStudy from './pages/BibleStudy';
import EditBibleStudy from './pages/EditBibleStudy';
import GospelMinistry from './pages/GospelMinistry';
import EditGospelMinistry from './pages/EditGospelMinistry';
import EasterCommittee from './pages/EasterCommittee';
import EditEasterCommittee from './pages/EditEasterCommittee';
import HarvestCommittee from './pages/HarvestCommittee';
import EditHarvestCommittee from './pages/EditHarvestCommittee';
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
            <Route path="/edit-easter-ministry" element={<EditEasterMinistry />} />
            <Route path="/youth-ministry" element={<YouthMinistry />} />
            <Route path="/edit-youth-ministry" element={<EditYouthMinistry />} />
            <Route path="/worship-ministry" element={<WorshipMinistry />} />
            <Route path="/edit-worship-ministry" element={<EditWorshipMinistry />} />
            <Route path="/children-ministry" element={<ChildrenMinistry />} />
            <Route path="/edit-children-ministry" element={<EditChildrenMinistry />} />
            <Route path="/mens-ministry" element={<MensMinistry />} />
            <Route path="/edit-mens-ministry" element={<EditMensMinistry />} />
            <Route path="/womens-ministry" element={<WomensMinistry />} />
            <Route path="/edit-womens-ministry" element={<EditWomensMinistry />} />
            <Route path="/choir-ministry" element={<ChoirMinistry />} />
            <Route path="/edit-choir-ministry" element={<EditChoirMinistry />} />
            <Route path="/bible-study" element={<BibleStudy />} />
            <Route path="/edit-bible-study" element={<EditBibleStudy />} />
            <Route path="/gospel-ministry" element={<GospelMinistry />} />
            <Route path="/edit-gospel-ministry" element={<EditGospelMinistry />} />
            <Route path="/easter-committee" element={<EasterCommittee />} />
            <Route path="/edit-easter-committee" element={<EditEasterCommittee />} />
            <Route path="/harvest-committee" element={<HarvestCommittee />} />
            <Route path="/edit-harvest-committee" element={<EditHarvestCommittee />} />
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
