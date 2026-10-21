const mongoose = require('mongoose');

const state = { connected: false };

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || process.env.USE_MONGO !== 'true') {
    console.log('Datastore: local file store (set USE_MONGO=true + MONGO_URI to use MongoDB)');
    return;
  }
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    state.connected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn('MongoDB unavailable, using local file store:', err.message);
  }
};

module.exports = connectDB;
module.exports.state = state;
