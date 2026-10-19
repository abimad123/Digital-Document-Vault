const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword } = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');
const User = require('../models/User'); 
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const PlanRequest = require('../models/PlanRequest');

router.post('/register', register); 
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);
router.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    database: connected ? mongoose.connection.name : null
  });
});

router.post('/verify-email', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Identity not found in vault records.' });
    }
    
    res.status(200).json({ success: true, message: 'Identity verified. Proceed to reset.' });
  } catch (error) {
    console.error("Verify Email Error:", error);
    res.status(500).json({ success: false, message: 'Server error during verification.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

   
    await User.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({ success: true, message: 'Cryptographic key reset successfully.' });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: 'Server error during password reset.' });
  }
});

router.get('/plan-request', auth, async (req, res) => {
  try {
    const request = await PlanRequest.findOne({ user: req.user.id, status: 'pending' }).sort({ createdAt: -1 });
    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not load upgrade request.' });
  }
});

router.post('/plan-request', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!['Professional', 'Enterprise'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Choose a valid upgrade plan.' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Account not found.' });
    if (user.tier === 'Enterprise' || user.tier === plan || (user.tier === 'Professional' && plan !== 'Enterprise')) {
      return res.status(400).json({ success: false, message: 'Choose a plan above your current plan.' });
    }
    const existing = await PlanRequest.findOne({ user: user.id, status: 'pending' });
    if (existing) return res.status(409).json({ success: false, message: 'You already have an upgrade request pending.' });
    const request = await PlanRequest.create({ user: user.id, plan });
    res.status(201).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not submit upgrade request.' });
  }
});

router.put('/upgrade-plan', auth, (req, res) => {
  res.status(501).json({ success: false, message: 'Online upgrades are unavailable. Submit an upgrade request instead.' });
});

module.exports = router;
