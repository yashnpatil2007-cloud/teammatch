const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const seed = require('./seed');

const {
  User,
  Team,
  ProblemStatement,
  Quiz,
  Review,
  Certificate,
  AssessmentResult,
  Task,
  Message,
  Submission,
  Notification,
  AuditLog,
  Competition,
  PlatformSetting,
} = require('../models');

const DB_FILE = path.join(__dirname, 'db.json');

const collections = [
  'users',
  'problems',
  'teams',
  'reviews',
  'quizzes',
  'certificates',
  'assessments',
  'tasks',
  'messages',
  'submissions',
  'notifications',
  'auditLogs',
  'competitions',
  'settings',
  'reports',
];

const db = {
  users: [],
  problems: [],
  teams: [],
  reviews: [],
  quizzes: [],
  certificates: [],
  assessments: [],
  tasks: [],
  messages: [],
  submissions: [],
  notifications: [],
  auditLogs: [],
  competitions: [],
  settings: [],
  reports: [],
};

const state = { mode: 'file' };

const uid = () => crypto.randomBytes(12).toString('hex');
const now = () => new Date().toISOString();

function seedDb() {
  const users = JSON.parse(JSON.stringify(seed.seedUsers));
  const problems = JSON.parse(JSON.stringify(seed.seedProblems));
  const teams = JSON.parse(JSON.stringify(seed.seedTeams));
  const reviews = JSON.parse(JSON.stringify(seed.seedReviews));
  const quizzes = JSON.parse(JSON.stringify(seed.seedQuizzes));

  const certificates = [];
  users.forEach((u) => {
    (u.certificates || []).forEach((c) => {
      certificates.push({ ...c, userId: u._id });
    });
  });

  return {
    users,
    problems,
    teams,
    reviews,
    quizzes,
    certificates,
    assessments: [],
    tasks: [],
    messages: [],
    submissions: [],
    notifications: [],
    auditLogs: [],
    competitions: [],
    settings: [],
    reports: [],
  };
}

function applySeed() {
  const fresh = seedDb();
  collections.forEach((c) => {
    db[c] = fresh[c] || [];
  });
}

async function loadFromMongo() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('MongoDB collections empty, seeding native collections...');
    const fresh = seedDb();
    if (fresh.users.length) await User.insertMany(fresh.users);
    if (fresh.problems.length) await ProblemStatement.insertMany(fresh.problems);
    if (fresh.teams.length) await Team.insertMany(fresh.teams);
    if (fresh.quizzes.length) await Quiz.insertMany(fresh.quizzes);
    if (fresh.reviews.length) await Review.insertMany(fresh.reviews);
    if (fresh.certificates.length) await Certificate.insertMany(fresh.certificates);
  }

  const [uList, pList, tList, qList, rList, cList, aList, tskList, msgList, subList, notifList, auditList, compList, setList] =
    await Promise.all([
      User.find().lean(),
      ProblemStatement.find().lean(),
      Team.find().lean(),
      Quiz.find().lean(),
      Review.find().lean(),
      Certificate.find().lean(),
      AssessmentResult.find().lean(),
      Task.find().lean(),
      Message.find().lean(),
      Submission.find().lean(),
      Notification.find().lean(),
      AuditLog.find().lean(),
      Competition.find().lean(),
      PlatformSetting.find().lean(),
    ]);

  db.users = uList || [];
  db.problems = pList || [];
  db.teams = tList || [];
  db.quizzes = qList || [];
  db.reviews = rList || [];
  db.certificates = cList || [];
  db.assessments = aList || [];
  db.tasks = tskList || [];
  db.messages = msgList || [];
  db.submissions = subList || [];
  db.notifications = notifList || [];
  db.auditLogs = auditList || [];
  db.competitions = compList || [];
  db.settings = setList || [];
  ensureSchemaMigration();
}

/**
 * Idempotent non-destructive migration ensuring existing problems, teams, submissions,
 * organizers, and platform settings cleanly map to the 4-role Competition architecture.
 */
function ensureSchemaMigration() {
  let changed = false;
  if (!Array.isArray(db.competitions)) { db.competitions = []; changed = true; }
  if (!Array.isArray(db.settings)) { db.settings = []; changed = true; }
  if (!Array.isArray(db.reports)) { db.reports = []; changed = true; }

  if (db.settings.length === 0) {
    db.settings.push({
      _id: 'platform-default',
      platformName: 'TeamMatch',
      allowMemberRegistration: true,
      allowLeaderRegistration: true,
      allowOrganizerRegistration: false,
      requireAdminApprovalForCompetitions: false,
      maxTeamsPerStudent: 3,
      maintenanceMode: false,
      updatedBy: 'system',
      updatedAt: now(),
    });
    changed = true;
  }

  const organizers = (db.users || []).filter((u) => u.role === 'organizer');
  const primaryOrgId = organizers[0]?._id || 'u-organizer';

  if (db.competitions.length === 0) {
    db.competitions.push({
      _id: 'comp-default',
      title: 'TeamMatch National Innovation Challenge 2026',
      description: 'Flagship inter-collegiate hackathon and project challenge across AI/ML, Web3, FinTech, HealthTech, EdTech, and IoT tracks.',
      bannerUrl: '',
      rules: 'Teams must collaborate within TeamMatch workspaces, submit original code via GitHub, and include a live demo or presentation.',
      eligibility: 'Open to verified university students and builders',
      category: 'National Hackathon',
      registrationStart: new Date(Date.now() - 14 * 86400000).toISOString(),
      registrationEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      endDate: new Date(Date.now() + 45 * 86400000).toISOString(),
      teamSizeMin: 2,
      teamSizeMax: 5,
      status: 'ongoing',
      organizer: primaryOrgId,
      assignedOrganizers: organizers.map((o) => o._id),
      judges: organizers.map((o) => ({ userId: o._id, name: o.name, email: o.email, assignedAt: now() })),
      resultsPublished: false,
      winners: [],
      createdBy: primaryOrgId,
      createdAt: now(),
      updatedAt: now(),
    });
    changed = true;
  }

  const defaultCompId = db.competitions[0]?._id || 'comp-default';
  const problemCompMap = new Map();

  (db.problems || []).forEach((p) => {
    if (!p.competitionId) {
      p.competitionId = defaultCompId;
      changed = true;
    }
    if (!p.organizer) {
      p.organizer = primaryOrgId;
      changed = true;
    }
    problemCompMap.set(p._id, p.competitionId);
  });

  (db.teams || []).forEach((t) => {
    const inferredComp = problemCompMap.get(t.problem) || defaultCompId;
    if (!t.competitionId) {
      t.competitionId = inferredComp;
      changed = true;
    }
  });

  (db.submissions || []).forEach((s) => {
    const inferredComp = problemCompMap.get(s.problem) || defaultCompId;
    if (!s.competitionId) {
      s.competitionId = inferredComp;
      changed = true;
    }
  });

  // Ensure each organizer user tracks competitions they own or are assigned to
  organizers.forEach((org) => {
    const assigned = db.competitions
      .filter((c) => c.organizer === org._id || (c.assignedOrganizers || []).includes(org._id))
      .map((c) => c._id);
    if (!Array.isArray(org.assignedCompetitions)) {
      org.assignedCompetitions = assigned;
      changed = true;
    } else {
      const merged = Array.from(new Set([...org.assignedCompetitions, ...assigned]));
      if (merged.length !== org.assignedCompetitions.length) {
        org.assignedCompetitions = merged;
        changed = true;
      }
    }
  });

  return changed;
}

function loadFromFile() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      collections.forEach((c) => {
        if (Array.isArray(raw[c])) db[c] = raw[c];
      });

      // Synchronize flat certificates list if not present in db.json
      if (!Array.isArray(raw.certificates) || raw.certificates.length === 0) {
        db.certificates = [];
        db.users.forEach((u) => {
          (u.certificates || []).forEach((c) => {
            db.certificates.push({ ...c, userId: u._id });
          });
        });
      }
      if (ensureSchemaMigration()) {
        persist();
      }
      return;
    }
  } catch (e) {
    console.warn('Could not read local datastore, reseeding:', e.message);
  }
  applySeed();
  ensureSchemaMigration();
  persist();
}

async function initStore() {
  const wantMongo = process.env.USE_MONGO === 'true' && !!process.env.MONGO_URI;
  if (wantMongo && mongoose.connection.readyState === 1) {
    try {
      await loadFromMongo();
      state.mode = 'mongo';
      console.log('Datastore: Native MongoDB collections (persistent)');
      return;
    } catch (e) {
      console.warn('Native MongoDB load failed, falling back to local file store:', e.message);
    }
  }
  loadFromFile();
  state.mode = 'file';
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  PRODUCTION WARNING: Running with local file store in production. Containers on Render have ephemeral filesystems — data will NOT persist across restarts without MongoDB Atlas (USE_MONGO=true).');
  } else {
    console.log('Datastore: local file (db.json)');
  }
}

// Ensure store is populated immediately on module load
loadFromFile();

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
      // Sync to native MongoDB collections individually
      const syncOps = [
        db.users.length &&
          User.bulkWrite(
            db.users.map((u) => ({
              updateOne: { filter: { _id: u._id }, update: { $set: u }, upsert: true },
            }))
          ),
        db.problems.length &&
          ProblemStatement.bulkWrite(
            db.problems.map((p) => ({
              updateOne: { filter: { _id: p._id }, update: { $set: p }, upsert: true },
            }))
          ),
        db.teams.length &&
          Team.bulkWrite(
            db.teams.map((t) => ({
              updateOne: { filter: { _id: t._id }, update: { $set: t }, upsert: true },
            }))
          ),
        db.quizzes.length &&
          Quiz.bulkWrite(
            db.quizzes.map((q) => ({
              updateOne: { filter: { _id: q._id }, update: { $set: q }, upsert: true },
            }))
          ),
        db.reviews.length &&
          Review.bulkWrite(
            db.reviews.map((r) => ({
              updateOne: { filter: { _id: r._id }, update: { $set: r }, upsert: true },
            }))
          ),
        db.certificates.length &&
          Certificate.bulkWrite(
            db.certificates.map((c) => ({
              updateOne: { filter: { _id: c._id }, update: { $set: c }, upsert: true },
            }))
          ),
        db.assessments.length &&
          AssessmentResult.bulkWrite(
            db.assessments.map((a) => ({
              updateOne: { filter: { _id: a._id }, update: { $set: a }, upsert: true },
            }))
          ),
        db.tasks.length &&
          Task.bulkWrite(
            db.tasks.map((t) => ({
              updateOne: { filter: { _id: t._id }, update: { $set: t }, upsert: true },
            }))
          ),
        db.messages.length &&
          Message.bulkWrite(
            db.messages.map((m) => ({
              updateOne: { filter: { _id: m._id }, update: { $set: m }, upsert: true },
            }))
          ),
        db.submissions.length &&
          Submission.bulkWrite(
            db.submissions.map((s) => ({
              updateOne: { filter: { _id: s._id }, update: { $set: s }, upsert: true },
            }))
          ),
        db.notifications.length &&
          Notification.bulkWrite(
            db.notifications.map((n) => ({
              updateOne: { filter: { _id: n._id }, update: { $set: n }, upsert: true },
            }))
          ),
        db.auditLogs.length &&
          AuditLog.bulkWrite(
            db.auditLogs.map((a) => ({
              updateOne: { filter: { _id: a._id }, update: { $set: a }, upsert: true },
            }))
          ),
        db.competitions.length &&
          Competition.bulkWrite(
            db.competitions.map((c) => ({
              updateOne: { filter: { _id: c._id }, update: { $set: c }, upsert: true },
            }))
          ),
        db.settings.length &&
          PlatformSetting.bulkWrite(
            db.settings.map((s) => ({
              updateOne: { filter: { _id: s._id }, update: { $set: s }, upsert: true },
            }))
          ),
      ].filter(Boolean);

      await Promise.all(syncOps);
    } catch (e) {
      console.error('Failed to persist to native MongoDB collections:', e.message);
    }
  }

  // Always keep db.json updated as local file persistence / backup
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Failed to persist local datastore:', e.message);
  }
}

function reset() {
  applySeed();
  persist();
}

module.exports = {
  db,
  save,
  uid,
  now,
  reset,
  initStore,
  ensureSchemaMigration,
  storeMode: () => state.mode,
  DB_FILE,
  collections,
};
