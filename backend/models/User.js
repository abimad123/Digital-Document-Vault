const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Authorized name required'],
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Secure email required'], 
    unique: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: [true, 'Cryptographic key required'],
    minlength: 8,
    select: false 
  },
  tier: { 
    type: String, 
    enum: ['Personal', 'Pro', 'Enterprise'], 
    default: 'Personal'
  },
  
  billing: {
    cardNumber: { type: String, select: false },
    expiry: { type: String, select: false },
    cvc: { type: String, select: false },
    isPaid: { type: Boolean, default: false }
  },

  // --- VERIFICATION PROTOCOL ---
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpire: Date
}, { 
  timestamps: true 
});

module.exports = mongoose.model('User', UserSchema);