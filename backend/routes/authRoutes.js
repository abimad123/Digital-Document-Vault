const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController'); 

// --- IDENTITY PROTOCOLS ---
router.post('/register', register); 
router.post('/login', login);
router.get('/health', (req, res) => res.send("Vault Node Online"));

module.exports = router;