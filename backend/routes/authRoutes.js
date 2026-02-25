const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword } = require('../controllers/authController'); 

// 1. Import your auth middleware (you called it 'auth')
const auth = require('../middleware/authMiddleware');

// 2. Import your User model so the database knows how to update the plan
const User = require('../models/User'); 

// --- IDENTITY PROTOCOLS ---
router.post('/register', register); 
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/change-password', auth, changePassword);
router.get('/health', (req, res) => res.send("Vault Node Online"));

// --- UPGRADE PLAN ROUTE ---
// 3. Changed 'protect' to 'auth' to match your middleware import above
router.put('/upgrade-plan', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    
    // Find the user in the database
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update the plan
    user.plan = plan;

    // Increase Storage Limit based on plan (Example: 50GB for Pro, Unlimited for Enterprise)
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