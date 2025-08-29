import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-brand">
            <Link to="/" className="brand-link">
              <h1 className="brand-title">DAMS</h1>
              <span className="brand-subtitle">Digital Asset Management System</span>
            </Link>
          </div>

          <nav className={`header-nav ${isMobileMenuOpen ? 'nav-open' : ''}`}>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link 
                  to="/" 
                  className={`nav-link ${isActive('/') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Home
                </Link>
              </li>
              
              <li className="nav-item">
                <Link 
                  to="/events" 
                  className={`nav-link ${isActive('/events') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  Events
                </Link>
              </li>
              
              <li className="nav-item">
                <Link 
                  to="/people" 
                  className={`nav-link ${isActive('/people') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  People
                </Link>
              </li>
              


              {user && (
                <>
                  {isAdmin && (
                    <li className="nav-item">
                      <Link 
                        to="/admin" 
                        className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                        onClick={closeMobileMenu}
                      >
                        Admin
                      </Link>
                    </li>
                  )}
                </>
              )}
            </ul>
          </nav>

          <div className="header-actions">
            {user ? (
              <div className="user-menu">
                <div className="user-info">
                  <span className="user-name">{user.firstName} {user.lastName}</span>
                  <span className={`user-role user-role-${user.role}`}>
                    {user.role === 'admin' && '👑 Admin'}
                    {user.role === 'creator' && '✍️ Creator'}
                    {user.role === 'consumer' && '👁️ Consumer'}
                    {user.role === 'pending' && '⏳ Pending'}
                  </span>
                </div>
                
                <div className="user-dropdown">
                  <button className="user-dropdown-toggle">
                    <span className="user-avatar">
                      {user.firstName?.[0]}{user.lastName?.[0] || 'U'}
                    </span>
                  </button>
                  
                  <div className="user-dropdown-menu">
                    <Link to="/profile" className="dropdown-item">
                      <span>👤 Profile</span>
                    </Link>

                    {isAdmin && (
                      <Link to="/admin" className="dropdown-item">
                        <span>⚙️ Admin Panel</span>
                      </Link>
                    )}
                    <button onClick={handleLogout} className="dropdown-item">
                      <span>🚪 Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </div>
            )}
          </div>

          <button 
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
