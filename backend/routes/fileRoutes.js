const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const File = require('../models/File');
const Activity = require('../models/Activity');
const { upload, cloudinary } = require('../config/cloudinaryConfig');
const logActivity = require('../utils/activityLogger');

const owned = (req, id) => File.findOne({ _id: id, user: req.user.id });
const validId = (id) => mongoose.isValidObjectId(id);

async function validParent(req, parentId) {
  if (parentId === 'root') return true;
  if (!validId(parentId)) return false;
  return Boolean(await File.findOne({
    _id: parentId, user: req.user.id, isFolder: true, trashedAt: null
  }));
}

async function treeFor(req, root) {
  const all = [root];
  const seen = new Set([String(root._id)]);
  let frontier = [String(root._id)];
  while (frontier.length) {
    const children = await File.find({ user: req.user.id, parentId: { $in: frontier } });
    frontier = [];
    for (const child of children) {
      const id = String(child._id);
      if (seen.has(id)) continue;
      seen.add(id);
      all.push(child);
      if (child.isFolder) frontier.push(id);
    }
  }
  return all;
}

router.get('/all', auth, async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id }).sort({ updatedAt: -1, createdAt: -1 });
    res.json({ success: true, files });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not load files.' });
  }
});

router.get('/search', auth, async (req, res) => {
  try {
    const query = String(req.query.query || '').trim().slice(0, 100);
    if (!query) return res.json({ success: true, results: [] });
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const results = await File.find({
      user: req.user.id, trashedAt: null,
      fileName: { $regex: escaped, $options: 'i' }
    }).limit(30);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed.' });
  }
});

router.get('/logs', auth, async (req, res) => {
  try {
    const logs = await Activity.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(30);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not load activity.' });
  }
});

router.post('/create-folder', auth, async (req, res) => {
  try {
    const fileName = String(req.body.fileName || '').trim();
    const parentId = req.body.parentId || 'root';
    if (!fileName || fileName.length > 120) return res.status(400).json({ success: false, message: 'Enter a folder name of up to 120 characters.' });
    if (!(await validParent(req, parentId))) return res.status(400).json({ success: false, message: 'Choose a valid destination folder.' });
    const folder = await File.create({ user: req.user.id, fileName, isFolder: true, parentId, fileUrl: '', publicId: '' });
    await logActivity(req.user.id, 'CREATE_FOLDER', `Created folder: ${fileName}`);
    res.status(201).json({ success: true, folder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Folder creation failed.' });
  }
});

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Choose a file to upload.' });
    const parentId = req.body.parentId || 'root';
    if (!(await validParent(req, parentId))) {
      const resource_type = req.file.mimetype?.startsWith('image/') ? 'image' : 'raw';
      await cloudinary.uploader.destroy(req.file.filename, { resource_type });
      return res.status(400).json({ success: false, message: 'Choose a valid destination folder.' });
    }
    const file = await File.create({
      user: req.user.id, fileName: req.file.originalname,
      fileUrl: req.file.path, publicId: req.file.filename,
      fileType: req.file.mimetype,
      fileSize: (req.file.size / 1024 / 1024).toFixed(2) + ' MB',
      sizeBytes: req.file.size, parentId, isFolder: false
    });
    await logActivity(req.user.id, 'UPLOAD', `Uploaded file: ${file.fileName}`);
    res.status(201).json({ success: true, file });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed.' });
  }
});

router.put('/rename/:id', auth, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid item.' });
    const fileName = String(req.body.fileName || '').trim();
    if (!fileName || fileName.length > 255) return res.status(400).json({ success: false, message: 'Enter a name of up to 255 characters.' });
    const file = await owned(req, req.params.id);
    if (!file || file.trashedAt) return res.status(404).json({ success: false, message: 'Item not found.' });
    file.fileName = fileName;
    file.updatedAt = new Date();
    await file.save();
    await logActivity(req.user.id, 'RENAME', `Renamed item: ${fileName}`);
    res.json({ success: true, file });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Rename failed.' });
  }
});

router.patch('/star/:id', auth, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid item.' });
    const file = await owned(req, req.params.id);
    if (!file || file.trashedAt) return res.status(404).json({ success: false, message: 'Item not found.' });
    file.isStarred = !file.isStarred;
    file.updatedAt = new Date();
    await file.save();
    res.json({ success: true, file });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not update star.' });
  }
});

router.put('/move/:id', auth, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid item.' });
    const targetFolderId = req.body.targetFolderId || 'root';
    const file = await owned(req, req.params.id);
    if (!file || file.trashedAt) return res.status(404).json({ success: false, message: 'Item not found.' });
    if (!(await validParent(req, targetFolderId))) return res.status(400).json({ success: false, message: 'Choose a valid destination folder.' });
    if (file.isFolder && targetFolderId !== 'root') {
      let cursor = targetFolderId;
      const visited = new Set();
      while (cursor !== 'root') {
        if (cursor === String(file._id)) return res.status(400).json({ success: false, message: 'A folder cannot be moved into itself or a child.' });
        if (visited.has(cursor)) return res.status(400).json({ success: false, message: 'Invalid folder hierarchy.' });
        visited.add(cursor);
        const parent = await File.findOne({ _id: cursor, user: req.user.id, isFolder: true, trashedAt: null });
        if (!parent) return res.status(400).json({ success: false, message: 'Invalid destination.' });
        cursor = parent.parentId || 'root';
      }
    }
    file.parentId = targetFolderId;
    file.updatedAt = new Date();
    await file.save();
    await logActivity(req.user.id, 'MOVE', `Moved item: ${file.fileName}`);
    res.json({ success: true, file });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Move failed.' });
  }
});

router.patch('/trash/:id', auth, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid item.' });
    const file = await owned(req, req.params.id);
    if (!file || file.trashedAt) return res.status(404).json({ success: false, message: 'Item not found.' });
    const items = file.isFolder ? await treeFor(req, file) : [file];
    const now = new Date();
    await File.updateMany({ _id: { $in: items.map(item => item._id) }, user: req.user.id }, { $set: { trashedAt: now, updatedAt: now } });
    await logActivity(req.user.id, 'TRASH', `Moved to trash: ${file.fileName}`);
    res.json({ success: true, count: items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not move item to trash.' });
  }
});

router.patch('/restore/:id', auth, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid item.' });
    const file = await owned(req, req.params.id);
    if (!file || !file.trashedAt) return res.status(404).json({ success: false, message: 'Trashed item not found.' });
    if (file.parentId !== 'root' && !(await validParent(req, file.parentId))) {
      return res.status(400).json({ success: false, message: 'Restore the parent folder first.' });
    }
    const items = file.isFolder ? await treeFor(req, file) : [file];
    const now = new Date();
    await File.updateMany({ _id: { $in: items.map(item => item._id) }, user: req.user.id }, { $set: { trashedAt: null, updatedAt: now } });
    await logActivity(req.user.id, 'RESTORE', `Restored item: ${file.fileName}`);
    res.json({ success: true, count: items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Restore failed.' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid item.' });
    const file = await owned(req, req.params.id);
    if (!file || !file.trashedAt) return res.status(404).json({ success: false, message: 'Move the item to trash first.' });
    const items = file.isFolder ? await treeFor(req, file) : [file];
    for (const item of items) {
      if (item.isFolder || !item.publicId) continue;
      const resource_type = item.fileType?.startsWith('image/') ? 'image' : 'raw';
      await cloudinary.uploader.destroy(item.publicId, { resource_type });
    }
    await File.deleteMany({ _id: { $in: items.map(item => item._id) }, user: req.user.id });
    await logActivity(req.user.id, 'DELETE', `Permanently deleted item: ${file.fileName}`);
    res.json({ success: true, count: items.length });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(502).json({ success: false, message: 'Permanent delete failed; the item remains in Trash.' });
  }
});

module.exports = router;
