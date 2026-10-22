const mongoose = require('mongoose');

const state = { connected: false };

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || process.env.USE_MONGO !== 'true') {
    console.log('Datastore: local file store (set USE_MONGO=true + MONGO_URI to use MongoDB)');
    return;
  }
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
      state.connected = true;
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.warn(`MongoDB attempt ${attempt} failed: ${err.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  console.warn('MongoDB unavailable, using local file store (data will not persist in production)');
};

module.exports = connectDB;
module.exports.state = state;
