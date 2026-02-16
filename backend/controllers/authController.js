const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logActivity = require('../utils/activityLogger');
const File = require('../models/File');

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

exports.getMe = async (req, res) => {
  try {
    const File = require('../models/File');
    
    // 1. Get User
    const user = await User.findById(req.user.id).select('-password');
    
    // 2. Calculate Storage
    const files = await File.find({ user: req.user.id });
    let totalSizeMB = 0;
    files.forEach(file => { totalSizeMB += parseFloat(file.fileSize) || 0; });

    // 3. DETERMINE REAL PLAN [FIXED LOGIC]
    // If 'user.tier' is empty in DB, default to 'personal'
    const tier = user.tier || 'personal'; 
    const planName = tier.toUpperCase() + ' PLAN'; 
    
    // 4. CALCULATE RENEWAL (Join Date + 1 Year)
    // We use the account creation date (user.createdAt) as the start date
    const joinDate = new Date(user.createdAt);
    const renewalDate = new Date(joinDate);
    renewalDate.setFullYear(renewalDate.getFullYear() + 1); // Add 1 year
    
    const formattedRenewal = renewalDate.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    });

    res.json({
      success: true,
      user: {
        ...user._doc,
        plan: planName,          // Will show "PERSONAL PLAN" or "PROFESSIONAL PLAN"
        renewalDate: formattedRenewal 
      },
      stats: {
        fileCount: files.length,
        storageUsed: totalSizeMB.toFixed(2),
        // Set limit: 1GB for Personal, 10GB for Professional
        storageLimit: tier === 'professional' ? 10240 : 1024, 
        storagePercent: Math.min((totalSizeMB / (tier === 'professional' ? 10240 : 1024)) * 100, 100).toFixed(1)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};

// --- CHANGE PASSWORD ---
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // 1. Find User (and get the password field which is usually hidden)
    const user = await User.findById(req.user.id).select('+password');
    
    // 2. Check if Current Password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, msg: 'Current password is incorrect.' });
    }

    // 3. Hash New Password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();

    // 4. Log Activity
    const logActivity = require('../utils/activityLogger');
    await logActivity(req.user.id, "SECURITY_UPDATE", "User changed password");

    res.json({ success: true, msg: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Server Error' });
  }
};