const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { updateProfile, changePassword } = require('../controllers/authController');

function response() {
  return {
    code: 200,
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; }
  };
}

test('profile update trims a name and returns only safe account fields', async () => {
  const originalFind = User.findById;
  const originalActivity = Activity.create;
  const user = {
    id: '507f1f77bcf86cd799439011', name: 'Old name', email: 'user@example.com',
    tier: 'Personal', isVerified: true, createdAt: new Date('2025-01-01'),
    password: 'private', billing: { cardNumber: 'private' }, save: async () => {}
  };
  User.findById = async id => { assert.equal(id, user.id); return user; };
  Activity.create = async () => ({});
  try {
    const res = response();
    await updateProfile({ user: { id: user.id }, body: { name: '  New   name  ' } }, res);
    assert.equal(res.code, 200);
    assert.equal(user.name, 'New name');
    assert.equal(res.data.user.name, 'New name');
    assert.equal(res.data.user.password, undefined);
    assert.equal(res.data.user.billing, undefined);
  } finally {
    User.findById = originalFind;
    Activity.create = originalActivity;
  }
});

test('profile and password updates reject invalid input before database access', async () => {
  const originalFind = User.findById;
  User.findById = () => { throw new Error('Database should not be queried'); };
  try {
    const profileRes = response();
    await updateProfile({ user: { id: 'owner' }, body: { name: 'A' } }, profileRes);
    assert.equal(profileRes.code, 400);
    const passwordRes = response();
    await changePassword({ user: { id: 'owner' }, body: { currentPassword: 'current', newPassword: 'short' } }, passwordRes);
    assert.equal(passwordRes.code, 400);
  } finally { User.findById = originalFind; }
});
