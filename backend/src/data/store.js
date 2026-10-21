const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const seed = require('./seed');

const DB_FILE = path.join(__dirname, 'db.json');
const STATE_ID = 'teammatch_state';

const collections = ['users', 'problems', 'teams', 'reviews', 'quizzes'];

const db = { users: [], problems: [], teams: [], reviews: [], quizzes: [] };
const state = { mode: 'file' };

const uid = () => crypto.randomBytes(12).toString('hex');
const now = () => new Date().toISOString();

function seedDb() {
  return {
    users: JSON.parse(JSON.stringify(seed.seedUsers)),
    problems: JSON.parse(JSON.stringify(seed.seedProblems)),
    teams: JSON.parse(JSON.stringify(seed.seedTeams)),
    reviews: JSON.parse(JSON.stringify(seed.seedReviews)),
    quizzes: JSON.parse(JSON.stringify(seed.seedQuizzes)),
  };
}

function applySeed() {
  const fresh = seedDb();
  collections.forEach((c) => { db[c] = fresh[c]; });
}

const StateModel = () => {
  const schema = new mongoose.Schema(
    { _id: String, users: Array, problems: Array, teams: Array, reviews: Array, quizzes: Array },
    { versionKey: false, strict: false, minimize: false }
  );
  return mongoose.models.TeamMatchState || mongoose.model('TeamMatchState', schema, STATE_ID);
};

async function loadFromMongo() {
  const Model = StateModel();
  const doc = await Model.findByIdAndUpdate(
    'state',
    { $setOnInsert: seedDb() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
  collections.forEach((c) => { db[c] = Array.isArray(doc[c]) ? doc[c] : []; });
}

function loadFromFile() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      collections.forEach((c) => { if (Array.isArray(raw[c])) db[c] = raw[c]; });
      return;
    }
  } catch (e) {
    console.warn('Could not read local datastore, reseeding:', e.message);
  }
  applySeed();
  persist();
}

async function initStore() {
  const wantMongo = process.env.USE_MONGO === 'true' && !!process.env.MONGO_URI;
  if (wantMongo && mongoose.connection.readyState === 1) {
    try {
      await loadFromMongo();
      state.mode = 'mongo';
      console.log('Datastore: MongoDB (persistent)');
      return;
    } catch (e) {
      console.warn('MongoDB load failed, falling back to file store:', e.message);
    }
  }
  loadFromFile();
  state.mode = 'file';
  console.log('Datastore: local file (db.json)');
}

let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    persist();
  }, 120);
}

async function persist() {
  if (state.mode === 'mongo') {
    try {
      await StateModel().updateOne(
        { _id: 'state' },
        { $set: { users: db.users, problems: db.problems, teams: db.teams, reviews: db.reviews, quizzes: db.quizzes } },
        { upsert: true }
      );
    } catch (e) {
      console.error('Failed to persist to MongoDB:', e.message);
    }
    return;
  }
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Failed to persist datastore:', e.message);
  }
}

function reset() {
  applySeed();
  persist();
}

module.exports = { db, save, uid, now, reset, initStore, storeMode: () => state.mode, DB_FILE };
