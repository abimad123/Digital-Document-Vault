const test = require('node:test');
const assert = require('node:assert/strict');
const routes = require('../routes/authRoutes');
const User = require('../models/User');
const PlanRequest = require('../models/PlanRequest');

const handler = (path, method) => routes.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack.at(-1).handle;
const response = () => ({
  code: 200,
  status(code) { this.code = code; return this; },
  json(data) { this.data = data; return this; }
});

test('legacy upgrade route cannot grant storage without approval', async () => {
  const res = response();
  await handler('/upgrade-plan', 'put')({ user: { id: 'owner' }, body: { plan: 'Enterprise' } }, res);
  assert.equal(res.code, 501);
  assert.equal(res.data.success, false);
});

test('upgrade requests validate plan and store a pending record without changing tier', async () => {
  const findUser = User.findById;
  const findRequest = PlanRequest.findOne;
  const createRequest = PlanRequest.create;
  const user = { id: 'owner', tier: 'Personal' };
  let created;
  User.findById = async () => user;
  PlanRequest.findOne = async () => null;
  PlanRequest.create = async values => { created = values; return { ...values, status: 'pending' }; };
  try {
    const invalid = response();
    await handler('/plan-request', 'post')({ user: { id: 'owner' }, body: { plan: 'Personal' } }, invalid);
    assert.equal(invalid.code, 400);
    const valid = response();
    await handler('/plan-request', 'post')({ user: { id: 'owner' }, body: { plan: 'Professional' } }, valid);
    assert.equal(valid.code, 201);
    assert.deepEqual(created, { user: 'owner', plan: 'Professional' });
    assert.equal(user.tier, 'Personal');
  } finally {
    User.findById = findUser;
    PlanRequest.findOne = findRequest;
    PlanRequest.create = createRequest;
  }
});
