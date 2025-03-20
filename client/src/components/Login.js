import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [step, setStep] = useState('email'); // 'email', 'setup', 'verify'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('/api/auth/check-user', { email });
      
      if (response.data.exists) {
        setStep('verify');
      } else {
        // New user, need to set up Google Auth
        const setupResponse = await axios.post('/api/auth/setup', { email });
        setQrCode(setupResponse.data.qrCode);
        setSecret(setupResponse.data.secret);
        setStep('setup');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('/api/auth/verify', { 
        email, 
        token: otpCode,
        secret: secret // Only needed for new users
      });
      
      if (response.data.success) {
        setSuccess('Authentication successful!');
        // Store the JWT token
        localStorage.setItem('token', response.data.token);
        // Redirect or update app state
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code');
    }
  };

  const renderEmailForm = () => (
    <form onSubmit={handleEmailSubmit}>
      <h2>Login with Google Authenticator</h2>
      <div className="form-group">
        <label>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
        />
      </div>
      <button type="submit" className="btn-primary">Continue</button>
    </form>
  );

  const renderSetupForm = () => (
    <div className="setup-container">
      <h2>Set Up Google Authenticator</h2>
      <p>Scan this QR code with your Google Authenticator app:</p>
      <div className="qr-container">
        <img src={qrCode} alt="Google Authenticator QR Code" className="qr-image" />
      </div>
      <p>Or enter this code manually: <strong>{secret}</strong></p>
      <form onSubmit={handleVerify}>
        <div className="form-group">
          <label>Enter the 6-digit code from your app</label>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            pattern="[0-9]{6}"
            required
            placeholder="6-digit code"
          />
        </div>
        <button type="submit" className="btn-primary">Verify & Login</button>
      </form>
    </div>
  );

  const renderVerifyForm = () => (
    <form onSubmit={handleVerify}>
      <h2>Login with Google Authenticator</h2>
      <p>Enter the 6-digit code from your Google Authenticator app for {email}</p>
      <div className="form-group">
        <input
          type="text"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          pattern="[0-9]{6}"
          required
          placeholder="6-digit code"
        />
      </div>
      <button type="submit" className="btn-primary">Verify</button>
    </form>
  );

  return (
    <div className="login-container">
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {step === 'email' && renderEmailForm()}
      {step === 'setup' && renderSetupForm()}
      {step === 'verify' && renderVerifyForm()}
    </div>
  );
};

export default Login;
