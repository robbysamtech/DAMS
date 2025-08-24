import React from 'react';
import './Loading.css';

const Loading = ({ size = 'medium', text = 'Loading...', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-content">
          <div className={`loading-spinner loading-spinner-${size}`}></div>
          {text && <p className="loading-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="loading-container">
      <div className={`loading-spinner loading-spinner-${size}`}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default Loading;
