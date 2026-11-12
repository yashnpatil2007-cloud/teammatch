const bcrypt = require('bcryptjs');
const { db, save, uid, now } = require('../data/store');
const { generateToken, asyncHandler } = require('../utils/generateToken');

const VALID_ROLES = ['organizer', 'leader', 'member', 'admin'];

const sanitize = (u) => {
  const { password: _password, ...rest } = u;
  return rest;
};

const authPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  reliabilityScore: user.reliabilityScore,
  averageRating: user.averageRating,
  skills: user.skills,
  github: user.github,
  personality: user.personality || null,
  aptitudeScore: user.aptitudeScore || 0,
  aptitudeBadge: user.aptitudeBadge || '',
  token: generateToken(user._id, user.role),
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, github, skills } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields: name, email, password, role' });
  }
  const cleanName = String(name).trim();
  if (cleanName.length < 2) {
    return res.status(400).json({ message: 'Name must be at least 2 characters long' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleanEmail = String(email).trim().toLowerCase();
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const key = cleanEmail;
  if (db.users.find((u) => u.email === key)) {
    return res.status(400).json({ message: 'An account with this email already exists' });
  }

  const hashedPassword = await bcrypt.hash(String(password), 10);
  const user = {
    _id: 'u-' + uid().slice(0, 10),
    name,
    email: key,
    password: hashedPassword,
    role,
    avatar: `https://i.pravatar.cc/100?img=${(db.users.length % 60) + 1}`,
    bio: '',
    github: github || '',
    linkedin: '',
    skills: Array.isArray(skills) ? skills : [],
    certificates: [],
    quizScores: [],
    reliabilityScore: 75,
    totalReviews: 0,
    averageRating: 0,
    isVerified: false,
    createdAt: now(),
  };
  db.users.push(user);
  save();
  res.status(201).json(authPayload(user));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  const user = db.users.find((u) => u.email === String(email).toLowerCase());
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const isMatch = await bcrypt.compare(String(password), user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const status = user.accountStatus || 'active';
  if (status === 'suspended' || status === 'deactivated') {
    return res.status(403).json({
      message: `Your account has been ${status}${user.statusReason ? `: ${user.statusReason}` : '. Please contact an administrator.'}`,
    });
  }
  res.json(authPayload(user));
});

const me = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  res.json(user ? sanitize(user) : req.user);
});

module.exports = { register, login, me };
