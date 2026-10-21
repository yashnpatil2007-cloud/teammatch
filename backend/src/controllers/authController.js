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
  token: generateToken(user._id, user.role),
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, github, skills } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields: name, email, password, role' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  const key = String(email).toLowerCase();
  if (db.users.find((u) => u.email === key)) {
    return res.status(400).json({ message: 'An account with this email already exists' });
  }

  const user = {
    _id: 'u-' + uid().slice(0, 10),
    name,
    email: key,
    password: bcrypt.hashSync(String(password), 10),
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
  if (!user || !bcrypt.compareSync(String(password), user.password)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json(authPayload(user));
});

const me = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  res.json(user ? sanitize(user) : req.user);
});

module.exports = { register, login, me };
