import test from 'node:test';
import assert from 'node:assert/strict';
import { clearSession, getValidToken, setSession, tokenExpiry } from './session.js';

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.get(key) || null,
  setItem: (key, value) => values.set(key, value),
  removeItem: key => values.delete(key)
};
globalThis.window = { dispatchEvent() {} };
globalThis.Event = class { constructor(type) { this.type = type; } };
const token = exp => `header.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.signature`;

test('expired and malformed tokens are removed before a route is shown', () => {
  localStorage.setItem('vaultToken', token(Math.floor(Date.now() / 1000) - 60));
  assert.equal(getValidToken(), null);
  assert.equal(localStorage.getItem('vaultToken'), null);
  localStorage.setItem('vaultToken', 'bad-token');
  assert.equal(getValidToken(), null);
  assert.equal(localStorage.getItem('vaultToken'), null);
});

test('valid token stays available until logout', () => {
  const valid = token(Math.floor(Date.now() / 1000) + 3600);
  assert.ok(tokenExpiry(valid) > Date.now());
  assert.equal(setSession(valid), true);
  assert.equal(getValidToken(), valid);
  clearSession();
  assert.equal(getValidToken(), null);
});
