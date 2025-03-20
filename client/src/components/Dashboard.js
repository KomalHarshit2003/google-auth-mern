import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/auth/user', {
          headers: {
            'x-auth-token': token
          }
        });
        setUserData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  if (loading) {
    return <div className="dashboard-container loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="page-title">Dashboard</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {userData && (
        <div className="user-info">
          <h2>Welcome!</h2>
          <p>Email: {userData.email}</p>
          <p>Account created: {new Date(userData.createdAt).toLocaleDateString()}</p>
        </div>
      )}
      
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    </div>
  );
};

export default Dashboard;