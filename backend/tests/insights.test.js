const test = require('node:test');
const assert = require('node:assert/strict');
const routes = require('../routes/insightsRoutes');
const File = require('../models/File');
const StorageSnapshot = require('../models/StorageSnapshot');

const handler = (path, method) => routes.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack.at(-1).handle;
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } });

test('storage snapshot uses the authenticated owner and real byte sizes', async () => {
  const originalFind = File.find;
  const originalUpdate = StorageSnapshot.updateOne;
  let filter, update;
  File.find = () => ({ select: () => ({ lean: async () => [{ sizeBytes: 2048 }, { fileSize: '2.00 MB' }] }) });
  StorageSnapshot.updateOne = async (f, u) => { filter = f; update = u; };
  try {
    const res = response();
    await handler('/snapshot', 'post')({ user: { id: 'owner' } }, res);
    assert.equal(res.data.success, true);
    assert.equal(filter.user, 'owner');
    assert.equal(update.$set.usedBytes, 2048 + 2 * 1024 * 1024);
  } finally { File.find = originalFind; StorageSnapshot.updateOne = originalUpdate; }
});

test('confirmed category update remains owner scoped', async () => {
  const originalUpdate = File.findOneAndUpdate;
  let filter;
  File.findOneAndUpdate = async (f, u) => { filter = f; return { _id: f._id, category: u.$set.category }; };
  try {
    const id = '507f1f77bcf86cd799439011';
    const res = response();
    await handler('/files/:id/category', 'put')({ params: { id }, user: { id: 'owner' }, body: { category: 'Academic' } }, res);
    assert.equal(res.data.success, true);
    assert.equal(filter.user, 'owner');
    assert.equal(filter.isFolder, false);
    const invalid = response();
    await handler('/files/:id/category', 'put')({ params: { id }, user: { id: 'owner' }, body: { category: 'Secret' } }, invalid);
    assert.equal(invalid.code, 400);
  } finally { File.findOneAndUpdate = originalUpdate; }
});
