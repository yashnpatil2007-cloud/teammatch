const dns = require('dns');
const mongoose = require('mongoose');

dns.setDefaultResultOrder('ipv4first');

const state = { connected: false, error: null };

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri || process.env.USE_MONGO !== 'true') {
    console.log('Datastore: local file store (set USE_MONGO=true + MONGO_URI to use MongoDB)');
    return;
  }
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000, family: 4 });
      state.connected = true;
      state.error = null;
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      state.error = err.message;
      console.warn(`MongoDB attempt ${attempt} failed: ${err.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  console.warn('MongoDB unavailable, using local file store (data will not persist in production)');
};

module.exports = connectDB;
module.exports.state = state;
