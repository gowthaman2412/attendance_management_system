import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// process.env.REACT_APP_API_BASE_URL="http://localhost:5000"

console.log("Environment variables",process.env);
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);