const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, required: true },
  usedBytes: { type: Number, required: true, min: 0 },
  fileCount: { type: Number, required: true, min: 0 },
  capturedAt: { type: Date, default: Date.now }
});
schema.index({ user: 1, day: 1 }, { unique: true });
module.exports = mongoose.model('StorageSnapshot', schema, 'storage_snapshots');
