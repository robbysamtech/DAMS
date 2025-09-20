import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMinistryDropdownOpen, setIsMinistryDropdownOpen] = useState(false);
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

  const toggleMinistryDropdown = () => {
    setIsMinistryDropdownOpen(!isMinistryDropdownOpen);
  };

  const closeMinistryDropdown = () => {
    setIsMinistryDropdownOpen(false);
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
              
              <li className="nav-item dropdown">
                <button 
                  className={`nav-link dropdown-toggle ${isMinistryDropdownOpen ? 'active' : ''}`}
                  onClick={toggleMinistryDropdown}
                  onBlur={() => setTimeout(closeMinistryDropdown, 200)}
                >
                  Ministry
                  <span className="dropdown-arrow">▼</span>
                </button>
                <ul className={`dropdown-menu ${isMinistryDropdownOpen ? 'show' : ''}`}>
                  <li className="dropdown-item">
                    <Link 
                      to="/easter-ministry" 
                      className={`dropdown-link ${isActive('/easter-ministry') ? 'active' : ''}`}
                      onClick={() => {
                        closeMobileMenu();
                        closeMinistryDropdown();
                      }}
                    >
                      Easter Ministry
                    </Link>
                  </li>
                  <li className="dropdown-item">
                    <Link 
                      to="/youth-ministry" 
                      className={`dropdown-link ${isActive('/youth-ministry') ? 'active' : ''}`}
                      onClick={() => {
                        closeMobileMenu();
                        closeMinistryDropdown();
                      }}
                    >
                      Youth Ministry
                    </Link>
                  </li>
                  <li className="dropdown-item">
                    <Link 
                      to="/worship-ministry" 
                      className={`dropdown-link ${isActive('/worship-ministry') ? 'active' : ''}`}
                      onClick={() => {
                        closeMobileMenu();
                        closeMinistryDropdown();
                      }}
                    >
                      Worship Ministry
                    </Link>
                  </li>
                  <li className="dropdown-item">
                    <Link 
                      to="/children-ministry" 
                      className={`dropdown-link ${isActive('/children-ministry') ? 'active' : ''}`}
                      onClick={() => {
                        closeMobileMenu();
                        closeMinistryDropdown();
                      }}
                    >
                      Children Ministry
                    </Link>
                  </li>
                  <li className="dropdown-item">
                    <Link 
                      to="/mens-ministry" 
                      className={`dropdown-link ${isActive('/mens-ministry') ? 'active' : ''}`}
                      onClick={() => {
                        closeMobileMenu();
                        closeMinistryDropdown();
                      }}
                    >
                      Men's Ministry
                    </Link>
                  </li>
                  <li className="dropdown-item">
                    <Link 
                      to="/womens-ministry" 
                      className={`dropdown-link ${isActive('/womens-ministry') ? 'active' : ''}`}
                      onClick={() => {
                        closeMobileMenu();
                        closeMinistryDropdown();
                      }}
                    >
                      Women's Ministry
                    </Link>
                  </li>
                  <li className="dropdown-item">
                    <Link 
                      to="/choir-ministry" 
                      className={`dropdown-link ${isActive('/choir-ministry') ? 'active' : ''}`}
                      onClick={() => {
                        closeMobileMenu();
                        closeMinistryDropdown();
                      }}
                    >
                      Choir Ministry
                    </Link>
                  </li>
                  <li className="dropdown-item">
                    <Link 
                      to="/bible-study" 
                      className={`dropdown-link ${isActive('/bible-study') ? 'active' : ''}`}
                      onClick={() => {
                        closeMobileMenu();
                        closeMinistryDropdown();
                      }}
                    >
                      Bible Study
                    </Link>
                  </li>
                  <li className="dropdown-item">
                    <Link 
                      to="/gospel-ministry" 
                      className={`dropdown-link ${isActive('/gospel-ministry') ? 'active' : ''}`}
                      onClick={() => {
                        closeMobileMenu();
                        closeMinistryDropdown();
                      }}
                    >
                      Gospel Ministry
                    </Link>
                  </li>
                  <li className="dropdown-item">
                    <Link 
                      to="/easter-committee" 
                      className={`dropdown-link ${isActive('/easter-committee') ? 'active' : ''}`}
                      onClick={() => {
                        closeMobileMenu();
                        closeMinistryDropdown();
                      }}
                    >
                      Easter Committee
                    </Link>
                  </li>
                  <li className="dropdown-item">
                    <Link 
                      to="/harvest-committee" 
                      className={`dropdown-link ${isActive('/harvest-committee') ? 'active' : ''}`}
                      onClick={() => {
                        closeMobileMenu();
                        closeMinistryDropdown();
                      }}
                    >
                      Harvest Committee
                    </Link>
                  </li>
                </ul>
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
                    {user.role === 'superadmin' && 'Super Admin'}
                    {user.role === 'admin' && 'Admin'}
                    {user.role === 'editor' && 'Editor'}
                    {user.role === 'pending' && t('navigation.header.user_role_pending')}
                  </span>
                </div>
                
                <div className="user-dropdown">
                  <button className="user-dropdown-toggle">
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  
                  <div className="user-dropdown-menu">
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
              // Auth buttons removed for guest users - only accessible via direct URLs
              <div className="guest-placeholder">
                {/* Empty div to maintain layout spacing */}
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
