const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword } = require('../controllers/authController'); 

// 1. Import your auth middleware (you called it 'auth')
const auth = require('../middleware/authMiddleware');
const User = require('../models/User'); 

// --- IDENTITY PROTOCOLS ---
router.post('/register', register); 
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/change-password', auth, changePassword);
router.get('/health', (req, res) => res.send("Vault Node Online"));

router.put('/upgrade-plan', auth, async (req, res) => {
  try {
    const { plan } = req.body; // The frontend sends { plan: 'Professional' }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 🚨 THE FIX IS HERE 🚨
    // We must use user.tier because that is what your User.js model uses!
    user.tier = plan; 

    // Increase Storage Limit based on plan
    if (plan === 'Professional') {
      user.storageLimit = 51200; // 50,000 MB
    } else if (plan === 'Enterprise') {
      user.storageLimit = 'Unlimited';
    }

    await user.save();

    res.status(200).json({ 
      success: true, 
      message: `Successfully upgraded to ${plan} plan!` 
    });

  } catch (error) {
    console.error("Upgrade Error:", error);
    res.status(500).json({ success: false, message: 'Server error during upgrade' });
  }
});

module.exports = router;