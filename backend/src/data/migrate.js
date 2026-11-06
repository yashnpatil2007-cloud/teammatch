const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

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
} = require('../models');

const DB_FILE = path.join(__dirname, 'db.json');

async function migrateData(options = {}) {
  const uri = options.uri || process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is required to run migration.');
  }

  if (!fs.existsSync(DB_FILE)) {
    throw new Error(`Data file not found at ${DB_FILE}`);
  }

  console.log('🔄 Reading source data from:', DB_FILE);
  const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

  const users = Array.isArray(raw.users) ? raw.users : [];
  const problems = Array.isArray(raw.problems) ? raw.problems : [];
  const teams = Array.isArray(raw.teams) ? raw.teams : [];
  const quizzes = Array.isArray(raw.quizzes) ? raw.quizzes : [];
  const reviews = Array.isArray(raw.reviews) ? raw.reviews : [];
  const assessments = Array.isArray(raw.assessments) ? raw.assessments : [];
  const tasks = Array.isArray(raw.tasks) ? raw.tasks : [];
  const messages = Array.isArray(raw.messages) ? raw.messages : [];
  const submissions = Array.isArray(raw.submissions) ? raw.submissions : [];
  const notifications = Array.isArray(raw.notifications) ? raw.notifications : [];

  console.log(`Source data counts: Users=${users.length}, Problems=${problems.length}, Teams=${teams.length}, Quizzes=${quizzes.length}, Reviews=${reviews.length}, Assessments=${assessments.length}, Tasks=${tasks.length}, Messages=${messages.length}, Submissions=${submissions.length}, Notifications=${notifications.length}`);

  console.log('🔄 Connecting to MongoDB for migration...');
  const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(` Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);

  const results = {
    users: { source: users.length, migrated: 0 },
    problems: { source: problems.length, migrated: 0 },
    teams: { source: teams.length, migrated: 0 },
    quizzes: { source: quizzes.length, migrated: 0 },
    reviews: { source: reviews.length, migrated: 0 },
    certificates: { source: 0, migrated: 0 },
    assessments: { source: assessments.length, migrated: 0 },
    tasks: { source: tasks.length, migrated: 0 },
    messages: { source: messages.length, migrated: 0 },
    submissions: { source: submissions.length, migrated: 0 },
    notifications: { source: notifications.length, migrated: 0 },
  };

  // 1. Migrate Users
  if (users.length > 0) {
    const ops = users.map((u) => ({
      updateOne: {
        filter: { _id: u._id },
        update: { $set: u },
        upsert: true,
      },
    }));
    const res = await User.bulkWrite(ops);
    results.users.migrated = await User.countDocuments();
    console.log(` Users migrated: ${results.users.migrated} (Upserted/Modified: ${res.upsertedCount + res.modifiedCount})`);
  }

  // 2. Migrate Problems
  if (problems.length > 0) {
    const ops = problems.map((p) => ({
      updateOne: {
        filter: { _id: p._id },
        update: { $set: p },
        upsert: true,
      },
    }));
    await ProblemStatement.bulkWrite(ops);
    results.problems.migrated = await ProblemStatement.countDocuments();
    console.log(` Problem Statements migrated: ${results.problems.migrated}`);
  }

  // 3. Migrate Teams
  if (teams.length > 0) {
    const ops = teams.map((t) => ({
      updateOne: {
        filter: { _id: t._id },
        update: { $set: t },
        upsert: true,
      },
    }));
    await Team.bulkWrite(ops);
    results.teams.migrated = await Team.countDocuments();
    console.log(` Teams migrated: ${results.teams.migrated}`);
  }

  // 4. Migrate Quizzes
  if (quizzes.length > 0) {
    const ops = quizzes.map((q) => ({
      updateOne: {
        filter: { _id: q._id },
        update: { $set: q },
        upsert: true,
      },
    }));
    await Quiz.bulkWrite(ops);
    results.quizzes.migrated = await Quiz.countDocuments();
    console.log(` Quizzes migrated: ${results.quizzes.migrated}`);
  }

  // 5. Migrate Reviews
  if (reviews.length > 0) {
    const ops = reviews.map((r) => ({
      updateOne: {
        filter: { _id: r._id },
        update: { $set: r },
        upsert: true,
      },
    }));
    await Review.bulkWrite(ops);
    results.reviews.migrated = await Review.countDocuments();
    console.log(` Reviews migrated: ${results.reviews.migrated}`);
  }

  // 6. Migrate Certificates from Users into dedicated collection
  const allCerts = [];
  users.forEach((u) => {
    (u.certificates || []).forEach((c) => {
      allCerts.push({
        _id: c._id || `c-${Math.random().toString(36).substring(2, 9)}`,
        userId: u._id,
        title: c.title || 'Certificate',
        issuer: c.issuer || 'Self-uploaded',
        issueDate: c.issueDate || null,
        credentialId: c.credentialId || '',
        verificationUrl: c.verificationUrl || '',
        fileUrl: c.fileUrl || c.url || '',
        fileName: c.fileName || '',
        fileSize: c.fileSize || 0,
        skill: c.skill || '',
        status: c.status || 'pending',
        rejectionReason: c.rejectionReason || '',
        submittedAt: c.submittedAt || c.uploadedAt || new Date(),
      });
    });
  });

  results.certificates.source = allCerts.length;
  if (allCerts.length > 0) {
    const ops = allCerts.map((c) => ({
      updateOne: {
        filter: { _id: c._id },
        update: { $set: c },
        upsert: true,
      },
    }));
    await Certificate.bulkWrite(ops);
    results.certificates.migrated = await Certificate.countDocuments();
    console.log(` Certificates migrated: ${results.certificates.migrated}`);
  }

  // 7. Migrate Assessments
  if (assessments.length > 0) {
    const ops = assessments.map((a) => ({
      updateOne: { filter: { _id: a._id }, update: { $set: a }, upsert: true },
    }));
    await AssessmentResult.bulkWrite(ops);
    results.assessments.migrated = await AssessmentResult.countDocuments();
    console.log(` Assessments migrated: ${results.assessments.migrated}`);
  }

  // 8. Migrate Tasks
  if (tasks.length > 0) {
    const ops = tasks.map((t) => ({
      updateOne: { filter: { _id: t._id }, update: { $set: t }, upsert: true },
    }));
    await Task.bulkWrite(ops);
    results.tasks.migrated = await Task.countDocuments();
    console.log(` Tasks migrated: ${results.tasks.migrated}`);
  }

  // 9. Migrate Messages
  if (messages.length > 0) {
    const ops = messages.map((m) => ({
      updateOne: { filter: { _id: m._id }, update: { $set: m }, upsert: true },
    }));
    await Message.bulkWrite(ops);
    results.messages.migrated = await Message.countDocuments();
    console.log(` Messages migrated: ${results.messages.migrated}`);
  }

  // 10. Migrate Submissions
  if (submissions.length > 0) {
    const ops = submissions.map((s) => ({
      updateOne: { filter: { _id: s._id }, update: { $set: s }, upsert: true },
    }));
    await Submission.bulkWrite(ops);
    results.submissions.migrated = await Submission.countDocuments();
    console.log(` Submissions migrated: ${results.submissions.migrated}`);
  }

  // 11. Migrate Notifications
  if (notifications.length > 0) {
    const ops = notifications.map((n) => ({
      updateOne: { filter: { _id: n._id }, update: { $set: n }, upsert: true },
    }));
    await Notification.bulkWrite(ops);
    results.notifications.migrated = await Notification.countDocuments();
    console.log(` Notifications migrated: ${results.notifications.migrated}`);
  }

  // Verification checks
  console.log('\n--- VERIFICATION CHECKS ---');
  const userCheck = (await User.countDocuments()) >= users.length;
  const problemCheck = (await ProblemStatement.countDocuments()) >= problems.length;
  const teamCheck = (await Team.countDocuments()) >= teams.length;
  const quizCheck = (await Quiz.countDocuments()) >= quizzes.length;
  const reviewCheck = (await Review.countDocuments()) >= reviews.length;

  const demoUser = await User.findOne({ email: 'admin@demo.com' }).lean();
  const demoCheck = !!demoUser;

  const allPassed = userCheck && problemCheck && teamCheck && quizCheck && reviewCheck && demoCheck;

  console.log(`  Users check (>= ${users.length}): ${userCheck ? 'PASS' : 'FAIL'}`);
  console.log(`  Problems check (>= ${problems.length}): ${problemCheck ? 'PASS' : 'FAIL'}`);
  console.log(`  Teams check (>= ${teams.length}): ${teamCheck ? 'PASS' : 'FAIL'}`);
  console.log(`  Quizzes check (>= ${quizzes.length}): ${quizCheck ? 'PASS' : 'FAIL'}`);
  console.log(`  Reviews check (>= ${reviews.length}): ${reviewCheck ? 'PASS' : 'FAIL'}`);
  console.log(`  Demo admin account check: ${demoCheck ? 'PASS' : 'FAIL'}`);
  console.log(`  Overall Migration Verification: ${allPassed ? 'ALL PASSED' : 'FAILED'}`);

  return { results, allPassed };
}

if (require.main === module) {
  migrateData()
    .then(({ results, allPassed }) => {
      console.log('\nMigration complete. Summary:', results);
      process.exit(allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Migration failed:', err.message);
      process.exit(1);
    });
}

module.exports = { migrateData };

