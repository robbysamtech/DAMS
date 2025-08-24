import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/data');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post('/api/submit', formData);
      setSubmitStatus({ type: 'success', message: response.data.message });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setSubmitStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'An error occurred' 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderHome = () => (
    <div className="hero-section">
      <h1>Welcome to DAMS Web Application</h1>
      <p className="hero-subtitle">
        A modern full-stack web application built with React and Node.js
      </p>
      <div className="hero-features">
        <div className="feature-card">
          <h3>🚀 Fast & Responsive</h3>
          <p>Built with modern web technologies for optimal performance</p>
        </div>
        <div className="feature-card">
          <h3>🔧 Full-Stack</h3>
          <p>Complete backend API with Express.js and React frontend</p>
        </div>
        <div className="feature-card">
          <h3>📱 Mobile-First</h3>
          <p>Responsive design that works on all devices</p>
        </div>
      </div>
    </div>
  );

  const renderData = () => (
    <div>
      <h2>Sample Data</h2>
      <p className="mb-4">This data is fetched from the backend API:</p>
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="grid grid-3">
          {data.map(item => (
            <div key={item.id} className="card">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <small>ID: {item.id}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderContact = () => (
    <div>
      <h2>Contact Form</h2>
      <p className="mb-4">Send us a message using the form below:</p>
      
      {submitStatus && (
        <div className={`alert alert-${submitStatus.type}`}>
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-group">
          <label htmlFor="name" className="form-label">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="message" className="form-label">Message</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            className="form-input"
            rows="4"
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHome();
      case 'data':
        return renderData();
      case 'contact':
        return renderContact();
      default:
        return renderHome();
    }
  };

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <nav className="nav">
            <div className="nav-brand">
              <h2>DAMS Web App</h2>
            </div>
            <ul className="nav-menu">
              <li>
                <button 
                  className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
                  onClick={() => setActiveTab('home')}
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${activeTab === 'data' ? 'active' : ''}`}
                  onClick={() => setActiveTab('data')}
                >
                  Data
                </button>
              </li>
              <li>
                <button 
                  className={`nav-link ${activeTab === 'contact' ? 'active' : ''}`}
                  onClick={() => setActiveTab('contact')}
                >
                  Contact
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {renderContent()}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 DAMS Web Application. Built with React and Node.js.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
