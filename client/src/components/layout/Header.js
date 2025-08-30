import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
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
              <div className="logo-container">
                <img 
                  src="http://localhost:5001/logo/logo.png" 
                  alt="Christ Church of India" 
                  className="header-logo"
                />
              </div>
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
                  {t('navigation.header.nav_home')}
                </Link>
              </li>
              
              <li className="nav-item">
                <Link 
                  to="/events" 
                  className={`nav-link ${isActive('/events') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  {t('navigation.header.nav_events')}
                </Link>
              </li>
              
              <li className="nav-item">
                <Link 
                  to="/people" 
                  className={`nav-link ${isActive('/people') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  {t('navigation.header.nav_people')}
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
                        {t('navigation.header.nav_admin')}
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
                    {user.role === 'admin' && 'Admin'}
                    {user.role === 'editor' && 'Editor'}
                    {user.role === 'pending' && t('navigation.header.user_role_pending')}
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
                      <span>{t('common.profile')}</span>
                    </Link>

                    {isAdmin && (
                      <Link to="/admin" className="dropdown-item">
                        <span>{t('common.admin')}</span>
                      </Link>
                    )}
                    <button onClick={handleLogout} className="dropdown-item">
                      <span>{t('common.logout')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline">
                  {t('common.login')}
                </Link>
                <Link to="/register" className="btn btn-primary">
                  {t('common.register')}
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
