import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">DAMS</h3>
            <p className="footer-description">
              Digital Asset Management System for ministry organizations.
              Streamline your ministry operations with our comprehensive platform.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/events">Events</Link></li>
              <li><Link to="/people">People</Link></li>
              <li><Link to="/ministry-sections">Ministry Sections</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links">
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/profile">Profile</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-heading">Support</h4>
            <ul className="footer-links">
              <li><a href="#help">Help Center</a></li>
              <li><a href="#contact">Contact Us</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; {currentYear} DAMS. All rights reserved.</p>
          </div>
          <div className="footer-version">
            <p>Version 1.0.0</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
