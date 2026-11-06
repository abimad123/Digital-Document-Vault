const test = require('node:test');
const assert = require('node:assert/strict');
const { predictCategory } = require('../utils/categoryModel');

test('exported forest follows filename features and returns class confidence', () => {
  const model = { classes: ['Academic', 'Finance'], features: ['word=invoice'], trees: [{
    left: [1, -1, -1], right: [2, -1, -1], feature: [0, -2, -2],
    threshold: [0.5, -2, -2], value: [[1, 1], [1, 0], [0, 1]]
  }] };
  assert.deepEqual(predictCategory(model, 'invoice_2026.pdf', 'application/pdf'), { category: 'Finance', confidence: 1 });
  assert.deepEqual(predictCategory(model, 'lecture.pdf', 'application/pdf'), { category: 'Academic', confidence: 1 });
});
