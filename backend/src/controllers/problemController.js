const { db, save, uid, now } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');
const { analyzeProblem } = require('../services/aiAnalyzer');

const populateOrganizer = (p) => {
  if (!p) return p;
  const org = db.users.find((u) => u._id === p.organizer);
  return {
    ...p,
    organizer: org ? { _id: org._id, name: org.name, email: org.email, avatar: org.avatar } : p.organizer,
  };
};

const getAll = asyncHandler(async (req, res) => {
  const { category, difficulty, q } = req.query;
  let list = [...db.problems];
  if (category) list = list.filter((p) => p.category === category);
  if (difficulty) list = list.filter((p) => p.difficulty === difficulty);
  if (q) {
    const term = String(q).toLowerCase();
    list = list.filter((p) => p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
  }
  list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json(list.map(populateOrganizer));
});

const getOne = asyncHandler(async (req, res) => {
  const p = db.problems.find((x) => x._id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Problem statement not found' });
  res.json(populateOrganizer(p));
});

const create = asyncHandler(async (req, res) => {
  const { title, description, category, prize, teamSize, deadline } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: 'title and description are required' });
  }
  const ai = analyzeProblem(title, description);
  const problem = {
    _id: 'p-' + uid().slice(0, 10),
    title,
    description,
    category: category || 'Open',
    difficulty: ai.difficulty,
    difficultyScore: ai.difficultyScore,
    requiredSkills: ai.requiredSkills,
    requiredRoles: ai.requiredRoles,
    teamSize: teamSize || ai.teamRequirement,
    prize: prize || '₹1L',
    deadline: deadline || null,
    organizer: req.user._id,
    registeredCount: 0,
    status: 'published',
    createdAt: now(),
  };
  db.problems.push(problem);
  save();
  res.status(201).json(populateOrganizer(problem));
});

const update = asyncHandler(async (req, res) => {
  const p = db.problems.find((x) => x._id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Problem statement not found' });
  const fields = ['title', 'description', 'category', 'prize', 'teamSize', 'deadline', 'status', 'difficulty'];
  fields.forEach((f) => { if (req.body[f] !== undefined) p[f] = req.body[f]; });
  p.updatedAt = now();
  save();
  res.json(populateOrganizer(p));
});

const remove = asyncHandler(async (req, res) => {
  const idx = db.problems.findIndex((x) => x._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Problem statement not found' });
  db.problems.splice(idx, 1);
  save();
  res.json({ message: 'Problem statement removed' });
});

const analyze = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: 'title and description are required' });
  }
  res.json(analyzeProblem(title, description));
});

module.exports = { getAll, getOne, create, update, remove, analyze };
