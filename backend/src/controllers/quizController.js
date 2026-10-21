const { db, save, uid, now } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');

const badgeForLevel = (level) => {
  const l = Number(level) || 1;
  if (l >= 9) return 'Platinum';
  if (l >= 7) return 'Gold';
  if (l >= 5) return 'Silver';
  return 'Bronze';
};

const normalizeQuestions = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) return null;
  const cleaned = questions.map((q) => {
    const options = (q.options || []).map((o) => String(o).trim()).filter(Boolean);
    if (!q.q || options.length < 2) return null;
    let answer = Number(q.answer);
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) answer = 0;
    return { q: String(q.q).trim(), options, answer, level: Number(q.level) || 5 };
  });
  if (cleaned.some((q) => q === null)) return null;
  return cleaned;
};

const listQuizzes = asyncHandler(async (req, res) => {
  res.json(db.quizzes.map((q) => ({ _id: q._id, skill: q.skill, level: q.level, badge: q.badge, total: q.questions.length })));
});

const getById = asyncHandler(async (req, res) => {
  const quiz = db.quizzes.find((q) => q._id === req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  res.json(quiz);
});

const getBySkill = asyncHandler(async (req, res) => {
  const quiz = db.quizzes.find((q) => q.skill.toLowerCase() === String(req.params.skill).toLowerCase());
  if (!quiz) return res.status(404).json({ message: 'Quiz not found for this skill' });
  const questions = quiz.questions.map((q) => ({ q: q.q, options: q.options, level: q.level }));
  res.json({ _id: quiz._id, skill: quiz.skill, badge: quiz.badge, questions });
});

const create = asyncHandler(async (req, res) => {
  const { skill, level, badge, questions } = req.body;
  if (!skill || !String(skill).trim()) return res.status(400).json({ message: 'skill is required' });
  const normalized = normalizeQuestions(questions);
  if (!normalized) return res.status(400).json({ message: 'Each question needs text and at least 2 options' });
  const slug = String(skill).trim().toLowerCase();
  if (db.quizzes.some((q) => q.skill.toLowerCase() === slug)) {
    return res.status(400).json({ message: `A quiz for '${slug}' already exists` });
  }
  const quiz = {
    _id: 'q-' + uid().slice(0, 10),
    skill: slug,
    level: Number(level) || 5,
    badge: badge || badgeForLevel(level),
    questions: normalized,
    createdAt: now(),
  };
  db.quizzes.push(quiz);
  save();
  res.status(201).json({ _id: quiz._id, skill: quiz.skill, level: quiz.level, badge: quiz.badge, total: quiz.questions.length });
});

const update = asyncHandler(async (req, res) => {
  const quiz = db.quizzes.find((q) => q._id === req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  const { skill, level, badge, questions } = req.body;
  if (questions !== undefined) {
    const normalized = normalizeQuestions(questions);
    if (!normalized) return res.status(400).json({ message: 'Each question needs text and at least 2 options' });
    quiz.questions = normalized;
  }
  if (skill !== undefined && String(skill).trim()) quiz.skill = String(skill).trim().toLowerCase();
  if (level !== undefined) quiz.level = Number(level) || quiz.level;
  if (badge !== undefined) quiz.badge = badge || badgeForLevel(quiz.level);
  else quiz.badge = badgeForLevel(quiz.level);
  quiz.updatedAt = now();
  save();
  res.json({ _id: quiz._id, skill: quiz.skill, level: quiz.level, badge: quiz.badge, total: quiz.questions.length });
});

const remove = asyncHandler(async (req, res) => {
  const idx = db.quizzes.findIndex((q) => q._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Quiz not found' });
  db.quizzes.splice(idx, 1);
  save();
  res.json({ message: 'Quiz removed' });
});

const grade = asyncHandler(async (req, res) => {
  const quiz = db.quizzes.find((q) => q.skill.toLowerCase() === String(req.body.skill || '').toLowerCase());
  if (!quiz) return res.status(404).json({ message: 'Quiz not found for this skill' });
  const answers = req.body.answers || [];
  let correct = 0;
  const detail = quiz.questions.map((q, i) => {
    const ok = answers[i] === q.answer;
    if (ok) correct += 1;
    return { correct: ok, answer: q.answer };
  });
  const score = Math.round((correct / quiz.questions.length) * 100);
  res.json({ skill: quiz.skill, score, correct, total: quiz.questions.length, detail });
});

module.exports = { listQuizzes, getById, getBySkill, create, update, remove, grade };
