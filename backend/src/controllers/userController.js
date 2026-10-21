const { db, save, uid, now } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');
const { publicUser } = require('../middleware/auth');

const badgeFor = (score) => {
  if (score >= 90) return 'Platinum';
  if (score >= 75) return 'Gold';
  if (score >= 60) return 'Silver';
  return 'Bronze';
};

const publicList = (users) => users.map(publicUser);

const getLeaderboard = asyncHandler(async (req, res) => {
  const metric = req.query.metric || 'reliability';
  const list = [...db.users].filter((u) => u.role !== 'admin');
  if (metric === 'rating') list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
  else list.sort((a, b) => (b.reliabilityScore || 0) - (a.reliabilityScore || 0));
  res.json(publicList(list).slice(0, 50));
});

const listUsers = asyncHandler(async (req, res) => {
  const { role, q } = req.query;
  let list = [...db.users];
  if (role) list = list.filter((u) => u.role === role);
  if (q) {
    const term = String(q).toLowerCase();
    list = list.filter((u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
  }
  res.json(publicList(list));
});

const getProfile = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const reviews = db.reviews.filter((r) => r.reviewee === user._id);
  res.json({ ...publicUser(user), reviews });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { skills, github, linkedin, bio, avatar } = req.body;
  if (skills !== undefined) user.skills = skills;
  if (github !== undefined) user.github = github;
  if (linkedin !== undefined) user.linkedin = linkedin;
  if (bio !== undefined) user.bio = bio;
  if (avatar !== undefined) user.avatar = avatar;
  user.updatedAt = now();
  save();
  res.json(publicUser(user));
});

const quizSubmit = asyncHandler(async (req, res) => {
  const { skill, level, score } = req.body;
  if (skill === undefined || score === undefined) {
    return res.status(400).json({ message: 'skill and score are required' });
  }
  const badge = badgeFor(Number(score));
  const verified = Number(score) >= 60;
  const user = db.users.find((u) => u._id === req.user._id);

  if (user) {
    user.quizScores = user.quizScores || [];
    user.quizScores.push({ _id: uid(), skill, level: Number(level) || 1, score: Number(score), badge, takenAt: now() });
    const existing = (user.skills || []).find((s) => s.name.toLowerCase() === String(skill).toLowerCase());
    if (verified) {
      const estLevel = Math.max(1, Math.min(10, Math.round(Number(score) / 10)));
      if (existing) {
        existing.level = Math.max(existing.level, estLevel);
        existing.verifiedScore = Number(score);
        existing.badge = badge;
      } else {
        user.skills = user.skills || [];
        user.skills.push({ name: skill, level: estLevel, verifiedScore: Number(score), badge });
      }
      user.reliabilityScore = Math.min(100, (user.reliabilityScore || 75) + 2);
    }
    save();
  }

  res.json({ skill, level, score: Number(score), badge, verified });
});

const quizHistory = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  res.json((user && user.quizScores) || []);
});

const adminUpdateUser = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const allowedRoles = ['member', 'leader', 'organizer', 'admin'];
  const { role, isVerified, reliabilityScore, name, bio } = req.body;
  if (role !== undefined) {
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });
    if (user._id === req.user._id && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }
    user.role = role;
  }
  if (isVerified !== undefined) user.isVerified = !!isVerified;
  if (reliabilityScore !== undefined) user.reliabilityScore = Math.max(0, Math.min(100, Number(reliabilityScore)));
  if (name !== undefined && String(name).trim()) user.name = String(name).trim();
  if (bio !== undefined) user.bio = bio;
  user.updatedAt = now();
  save();
  res.json(publicUser(user));
});

const removeUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id) return res.status(400).json({ message: 'You cannot delete your own account' });
  const idx = db.users.findIndex((u) => u._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });
  db.users.splice(idx, 1);
  save();
  res.json({ message: 'User removed' });
});

const addCertificate = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { title, issuer, url, skill } = req.body;
  if (!title || !String(title).trim()) return res.status(400).json({ message: 'Certificate title is required' });
  user.certificates = user.certificates || [];
  const cert = {
    _id: uid(),
    title: String(title).trim(),
    issuer: (issuer && String(issuer).trim()) || 'Self-uploaded',
    url: (url && String(url).trim()) || '',
    skill: (skill && String(skill).trim().toLowerCase()) || '',
    status: 'pending',
    submittedAt: now(),
  };
  user.certificates.push(cert);
  save();
  res.status(201).json({ certificate: cert, user: publicUser(user) });
});

const pendingCertificates = asyncHandler(async (req, res) => {
  const list = [];
  db.users.forEach((u) => {
    (u.certificates || []).forEach((c) => {
      list.push({ ...c, user: { _id: u._id, name: u.name, email: u.email, avatar: u.avatar } });
    });
  });
  list.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
  res.json(list);
});

const verifyCertificate = asyncHandler(async (req, res) => {
  const { certId } = req.params;
  const action = req.body.action === 'reject' ? 'reject' : 'verify';
  for (const u of db.users) {
    const cert = (u.certificates || []).find((c) => c._id === certId);
    if (cert) {
      cert.status = action === 'reject' ? 'rejected' : 'verified';
      cert.reviewedAt = now();
      if (action === 'verify') {
        u.reliabilityScore = Math.min(100, (u.reliabilityScore || 75) + 3);
        if (cert.skill) {
          u.skills = u.skills || [];
          const existing = u.skills.find((s) => s.name.toLowerCase() === cert.skill);
          if (existing) existing.badge = 'Certified';
          else u.skills.push({ name: cert.skill, level: 7, badge: 'Certified' });
        }
      }
      save();
      return res.json({ certificate: cert, message: `Certificate ${cert.status}` });
    }
  }
  return res.status(404).json({ message: 'Certificate not found' });
});

module.exports = {
  getLeaderboard,
  listUsers,
  getProfile,
  updateProfile,
  quizSubmit,
  quizHistory,
  adminUpdateUser,
  removeUser,
  addCertificate,
  pendingCertificates,
  verifyCertificate,
};
