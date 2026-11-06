import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestCategory } from './categorySuggestion.js';

test('clear filename hints produce a category suggestion', () => {
  assert.equal(suggestCategory('semester_assignment.pdf'), 'Academic');
  assert.equal(suggestCategory('tax_receipt_2026.pdf'), 'Finance');
  assert.equal(suggestCategory('family_photo.jpg'), 'Personal');
});

test('ambiguous names stay uncategorized', () => {
  assert.equal(suggestCategory('Print.pdf'), '');
  assert.equal(suggestCategory('invoice_lecture.pdf'), '');
});
