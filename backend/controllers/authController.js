const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logActivity = require('../utils/activityLogger');

// --- Identity Registration Protocol ---
// This handles creating a new user and authorizing them instantly
exports.register = async (req, res) => {
  try {
    const { name, email, password, tier, cardData } = req.body;

    // Check for existing identity in the vault
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Protocol Error: Identity already exists in the vault.' 
      });
    }

    // Initialize new user with automatic verification enabled
    user = new User({
      name,
      email,
      password,
      tier: tier || 'Personal',
      isVerified: true, // Verification protocol bypassed for instant access
      verificationToken: undefined,
      verificationTokenExpire: undefined
    });

    // Process billing data for Professional/Enterprise tiers
    if (tier !== 'Personal' && cardData) {
      user.billing = {
        cardNumber: cardData.cardNumber,
        expiry: cardData.expiry,
        cvc: cardData.cvc,
        isPaid: true
      };
    } else {
      // Personal tier is free and marked as paid by default
      user.billing = { isPaid: true };
    }

    // Encrypt password using Bcrypt
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);

    // Save the authorized user to the MongoDB vault
    await user.save();

    res.status(201).json({ 
      success: true, 
      msg: 'Identity created and authorized. You may now sign in.' 
    });

  } catch (err) {
    console.error("Registry Error:", err);
    res.status(500).json({ 
      success: false, 
      msg: 'System Error: Registry node failure.' 
    });
  }
};
// --- LOGIN CONTROLLER (Updated) ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Locate identity and include encrypted password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, msg: 'Invalid Credentials.' });
    }

    // Validate password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, msg: 'Invalid Credentials.' });
    }

    // LOG ACTIVITY: Successful Login
    // We pass 'req' so the logger can capture the IP address
    await logActivity(user.id, "LOGIN", "User accessed the Sanctum", req);

    // Generate JWT Access Token valid for 8 hours
    const token = jwt.sign(
      { user: { id: user.id, tier: user.tier } },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ success: true, token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, msg: 'Login node failure.' });
  }
};