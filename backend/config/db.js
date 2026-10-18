const mongoose = require('mongoose');

const connectDB = async () => {
  const dbURI = process.env.MONGO_URI_ATLAS || process.env.MONGO_URI_LOCAL;
  if (!dbURI) throw new Error('Set MONGO_URI_ATLAS or MONGO_URI_LOCAL before starting the API.');
  try {
    await mongoose.connect(dbURI);
    console.log(`MongoDB connected to database ${mongoose.connection.name}`);
  } catch (err) {
    throw new Error(`MongoDB connection failed (${err.name}${err.code ? `: ${err.code}` : ''}).`);
  }
};

module.exports = connectDB;
