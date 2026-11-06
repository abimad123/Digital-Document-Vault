const express = require('express');
const mongoose = require('mongoose');
const auth = require('../middleware/authMiddleware');
const File = require('../models/File');
const StorageSnapshot = require('../models/StorageSnapshot');
const { predictCategory } = require('../utils/categoryModel');

const router = express.Router();
router.use(auth);

router.post('/suggest-categories', async (req, res) => {
  try {
    const files = req.body?.files;
    if (!Array.isArray(files) || files.length > 20 || files.some(file => typeof file.name !== 'string' || file.name.length > 255)) {
      return res.status(400).json({ success: false, message: 'Choose up to 20 valid files.' });
    }
    const model = await mongoose.connection.db.collection('ml_category_models').findOne({ task: 'category_suggestion' });
    res.json({ success: true, source: model ? 'trained_model' : 'unavailable',
      suggestions: model ? files.map(file => predictCategory(model, file.name, file.type)) : [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Category suggestions are unavailable.' });
  }
});

router.post('/snapshot', async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id, isFolder: false }).select('sizeBytes fileSize').lean();
    const usedBytes = files.reduce((total, file) => {
      if (Number.isFinite(file.sizeBytes)) return total + file.sizeBytes;
      const value = parseFloat(file.fileSize);
      return total + (Number.isFinite(value) ? value * 1024 * 1024 : 0);
    }, 0);
    const day = new Date().toISOString().slice(0, 10);
    await StorageSnapshot.updateOne({ user: req.user.id, day }, {
      $set: { usedBytes: Math.round(usedBytes), fileCount: files.length, capturedAt: new Date() }
    }, { upsert: true });
    res.json({ success: true, day, usedBytes: Math.round(usedBytes) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not record storage usage.' });
  }
});

router.put('/files/:id/category', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid file.' });
    const category = req.body?.category;
    if (!['Academic', 'Finance', 'Personal', 'Other'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Choose a valid category.' });
    }
    const file = await File.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, isFolder: false, trashedAt: null },
      { $set: { category, updatedAt: new Date() } }, { new: true }
    );
    if (!file) return res.status(404).json({ success: false, message: 'File not found.' });
    res.json({ success: true, file });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not save category.' });
  }
});

router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const [snapshotCount, labeledCount, forecastRun, categoryRun, forecast, suggestions] = await Promise.all([
      StorageSnapshot.countDocuments({ user: req.user.id }),
      File.countDocuments({ user: req.user.id, isFolder: false, category: { $ne: null } }),
      db.collection('ml_model_runs').findOne({ task: 'storage_forecast', source: 'vault' }, { sort: { createdAt: -1 } }),
      db.collection('ml_model_runs').findOne({ task: 'category_suggestion', source: 'vault' }, { sort: { createdAt: -1 } }),
      db.collection('ml_predictions').findOne({ task: 'storage_forecast', user: new mongoose.Types.ObjectId(req.user.id) }),
      db.collection('ml_predictions').find({ task: 'category_suggestion', user: new mongoose.Types.ObjectId(req.user.id) }).limit(100).toArray()
    ]);
    res.json({ success: true, snapshotCount, labeledCount,
      forecast: forecastRun && forecast?.runId === String(forecastRun._id) ? { predictedBytes: forecast.predictedBytes, asOf: forecast.asOf, modelMetrics: forecastRun.metrics } : null,
      suggestions: categoryRun ? suggestions.filter(item => item.runId === String(categoryRun._id)).map(item => ({ fileId: item.fileId, category: item.category, confidence: item.confidence })) : [],
      modelStatus: { forecast: forecastRun ? 'trained' : 'collecting_data', category: categoryRun ? 'trained' : 'collecting_labels' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not load smart insights.' });
  }
});

module.exports = router;
