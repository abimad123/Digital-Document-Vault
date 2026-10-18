const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String }, // Optional for folders
  publicId: { type: String }, // Optional for folders
  fileType: { type: String },
  fileSize: { type: String },
  sizeBytes: { type: Number, min: 0 }, // Exact size for MongoDB analytics; fileSize supports older records.
  isFolder: { type: Boolean, default: false }, // CRITICAL for your new UI logic
  parentId: { type: String, default: 'root' }, // Used for moving items into folders
  isStarred: { type: Boolean, default: false },
  trashedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', FileSchema);
