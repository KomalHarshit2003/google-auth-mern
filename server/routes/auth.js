const express = require('express');
const router = express.Router();
const User = require('../models/user');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Check if user exists
router.post('/check-user', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    return res.json({ exists: !!user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Setup Google Authenticator for new user
router.post('/setup', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: `MyApp:${email}`
    });
    
    // Create QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    
    // Create new user
    user = new User({
      email,
      secret: secret.base32,
      verified: false
    });
    
    await user.save();
    
    return res.json({
      success: true,
      secret: secret.base32,
      qrCode
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Verify TOTP and login
router.post('/verify', async (req, res) => {
  try {
    const { email, token, secret } = req.body;
    
    // Find user or create if it's a new signup
    let user = await User.findOne({ email });
    
    if (!user && secret) {
      // New user completing setup
      user = new User({
        email,
        secret,
        verified: true
      });
    } else if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    
    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user.secret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 time step (30 seconds) on either side
    });
    
    if (!verified) {
      return res.status(400).json({ message: 'Invalid authentication code' });
    }
    
    // Mark user as verified if they weren't already
    if (!user.verified) {
      user.verified = true;
      await user.save();
    }
    
    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    return res.json({
      success: true,
      token: jwtToken
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get user data (protected route)
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-secret');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
