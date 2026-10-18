const test = require('node:test');
const assert = require('node:assert/strict');
const File = require('../models/File');
const Activity = require('../models/Activity');
const { cloudinary } = require('../config/cloudinaryConfig');

Activity.create = async () => ({});
const router = require('../routes/fileRoutes');

const IDS = {
  owner: '507f1f77bcf86cd799439011',
  file: '507f1f77bcf86cd799439012',
  folder: '507f1f77bcf86cd799439013',
  child: '507f1f77bcf86cd799439014'
};

function action(path, method) {
  const layer = router.stack.find(item => item.route?.path === path && item.route.methods[method]);
  assert.ok(layer, `Missing ${method.toUpperCase()} ${path}`);
  return layer.route.stack.at(-1).handle;
}

async function invoke(handler, params = {}, body = {}, query = {}, extra = {}) {
  const req = { user: { id: IDS.owner }, params, body, query, ...extra };
  const res = {
    code: 200,
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; }
  };
  await handler(req, res);
  return res;
}

test('upload rejects an invalid parent and removes the already uploaded cloud asset', async () => {
  const originalFindOne = File.findOne;
  const originalDestroy = cloudinary.uploader.destroy;
  let destroyed;
  File.findOne = async () => null;
  cloudinary.uploader.destroy = async (id, options) => { destroyed = { id, options }; };
  try {
    const res = await invoke(action('/upload', 'post'), {}, { parentId: IDS.child }, {}, {
      file: { filename: 'vault_docs/test', mimetype: 'image/png' }
    });
    assert.equal(res.code, 400);
    assert.equal(destroyed.id, 'vault_docs/test');
    assert.equal(destroyed.options.resource_type, 'image');
  } finally {
    File.findOne = originalFindOne;
    cloudinary.uploader.destroy = originalDestroy;
  }
});

test('search escapes regular-expression characters and stays owner scoped', async () => {
  const original = File.find;
  let filter;
  File.find = query => { filter = query; return { limit: async () => [] }; };
  try {
    const res = await invoke(action('/search', 'get'), {}, {}, { query: 'a.b[1]' });
    assert.equal(res.code, 200);
    assert.equal(filter.user, IDS.owner);
    assert.equal(filter.fileName.$regex, 'a\\.b\\[1\\]');
    assert.equal(filter.trashedAt, null);
  } finally { File.find = original; }
});

test('rename saves a file owned by the current user', async () => {
  const original = File.findOne;
  const file = { _id: IDS.file, user: IDS.owner, fileName: 'old.pdf', trashedAt: null, save: async () => {} };
  File.findOne = async query => {
    assert.equal(query.user, IDS.owner);
    return file;
  };
  try {
    const res = await invoke(action('/rename/:id', 'put'), { id: IDS.file }, { fileName: 'new.pdf' });
    assert.equal(res.code, 200);
    assert.equal(file.fileName, 'new.pdf');
    assert.equal(res.data.file.fileName, 'new.pdf');
  } finally { File.findOne = original; }
});

test('move rejects putting a folder inside its child', async () => {
  const original = File.findOne;
  const source = { _id: IDS.folder, user: IDS.owner, isFolder: true, trashedAt: null };
  const child = { _id: IDS.child, user: IDS.owner, isFolder: true, trashedAt: null, parentId: IDS.folder };
  File.findOne = async query => String(query._id) === IDS.folder ? source : child;
  try {
    const res = await invoke(action('/move/:id', 'put'), { id: IDS.folder }, { targetFolderId: IDS.child });
    assert.equal(res.code, 400);
    assert.match(res.data.message, /cannot be moved/i);
  } finally { File.findOne = original; }
});

test('trash marks a folder and its descendants together', async () => {
  const originalFindOne = File.findOne;
  const originalFind = File.find;
  const originalUpdate = File.updateMany;
  const folder = { _id: IDS.folder, user: IDS.owner, isFolder: true, trashedAt: null, fileName: 'Docs' };
  const child = { _id: IDS.file, user: IDS.owner, isFolder: false, parentId: IDS.folder };
  let update;
  File.findOne = async () => folder;
  File.find = async query => query.parentId.$in.includes(IDS.folder) ? [child] : [];
  File.updateMany = async (filter, change) => { update = { filter, change }; return { modifiedCount: 2 }; };
  try {
    const res = await invoke(action('/trash/:id', 'patch'), { id: IDS.folder });
    assert.equal(res.code, 200);
    assert.equal(res.data.count, 2);
    assert.equal(update.filter.user, IDS.owner);
    assert.equal(update.filter._id.$in.length, 2);
    assert.ok(update.change.$set.trashedAt instanceof Date);
  } finally {
    File.findOne = originalFindOne;
    File.find = originalFind;
    File.updateMany = originalUpdate;
  }
});
