import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import axios from 'axios';
axios.defaults.baseURL = 'http://localhost:5001'; 
const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);