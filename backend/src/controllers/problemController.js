const { db, save, uid, now } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');
const { analyzeProblem } = require('../services/aiAnalyzer');
const { isAssignedOrganizer } = require('./competitionController');
const { storageService } = require('../services/storageService');

const populateOrganizer = (p) => {
  if (!p) return p;
  const org = db.users.find((u) => u._id === p.organizer);
  const comp = (db.competitions || []).find((c) => c._id === p.competitionId);
  return {
    ...p,
    competitionTitle: comp ? comp.title : '',
    organizer: org ? { _id: org._id, name: org.name, email: org.email, avatar: org.avatar } : p.organizer,
  };
};

const getAll = asyncHandler(async (req, res) => {
  const { category, difficulty, q, competitionId, mine } = req.query;
  let list = [...db.problems];

  const user = req.user || null;
  if (!user || !['admin', 'organizer'].includes(user.role)) {
    list = list.filter((p) => p.status !== 'draft');
  } else if (user.role === 'organizer') {
    if (mine === 'true') {
      list = list.filter((p) => {
        const comp = (db.competitions || []).find((c) => c._id === p.competitionId);
        return String(p.organizer || '') === user._id || (comp && isAssignedOrganizer(comp, user));
      });
    } else {
      list = list.filter((p) => {
        if (p.status !== 'draft') return true;
        const comp = (db.competitions || []).find((c) => c._id === p.competitionId);
        return String(p.organizer || '') === user._id || (comp && isAssignedOrganizer(comp, user));
      });
    }
  }

  if (competitionId) list = list.filter((p) => p.competitionId === competitionId);
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
  const comp = (db.competitions || []).find((c) => c._id === p.competitionId);
  if (
    p.status === 'draft' &&
    (!req.user || (req.user.role !== 'admin' && String(p.organizer) !== req.user._id && !(comp && isAssignedOrganizer(comp, req.user))))
  ) {
    return res.status(403).json({ message: 'Access denied: draft problem statement is private' });
  }
  res.json(populateOrganizer(p));
});

const create = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    prize,
    teamSize,
    deadline,
    competitionId,
    imageUrl,
    evaluationCriteria = '',
    submissionGuidelines = '',
    status = 'published',
  } = req.body;
  if (!title || !description) {
    return res.status(400).json({ message: 'title and description are required' });
  }

  let targetCompId = competitionId || null;
  if (targetCompId) {
    const comp = (db.competitions || []).find((c) => c._id === targetCompId);
    if (!comp) return res.status(404).json({ message: 'Linked competition not found' });
    if (req.user.role === 'organizer' && !isAssignedOrganizer(comp, req.user)) {
      return res.status(403).json({ message: 'Access denied: you are not assigned to this competition' });
    }
  } else if (req.user.role === 'organizer') {
    const owned = (db.competitions || []).find((c) => isAssignedOrganizer(c, req.user));
    targetCompId = owned ? owned._id : (db.competitions || [])[0]?._id || null;
  } else {
    targetCompId = (db.competitions || [])[0]?._id || null;
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
    imageUrl: imageUrl ? String(imageUrl).trim() : '',
    prize: prize || '₹1L',
    deadline: deadline || null,
    competitionId: targetCompId,
    evaluationCriteria: String(evaluationCriteria || '').trim(),
    submissionGuidelines: String(submissionGuidelines || '').trim(),
    organizer: req.user._id,
    registeredCount: 0,
    status: ['draft', 'published', 'closed'].includes(status) ? status : 'published',
    createdAt: now(),
  };
  db.problems.push(problem);
  save();
  res.status(201).json(populateOrganizer(problem));
});

const update = asyncHandler(async (req, res) => {
  const p = db.problems.find((x) => x._id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Problem statement not found' });
  const comp = (db.competitions || []).find((c) => c._id === p.competitionId);
  if (req.user.role !== 'admin' && String(p.organizer) !== req.user._id && !(comp && isAssignedOrganizer(comp, req.user))) {
    return res.status(403).json({ message: 'Access denied: you do not manage this problem statement' });
  }
  const fields = [
    'title',
    'description',
    'category',
    'prize',
    'teamSize',
    'deadline',
    'status',
    'difficulty',
    'competitionId',
    'imageUrl',
    'evaluationCriteria',
    'submissionGuidelines',
  ];
  fields.forEach((f) => { if (req.body[f] !== undefined) p[f] = req.body[f]; });
  p.updatedAt = now();
  save();
  res.json(populateOrganizer(p));
});

const remove = asyncHandler(async (req, res) => {
  const idx = db.problems.findIndex((x) => x._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Problem statement not found' });
  const p = db.problems[idx];
  const comp = (db.competitions || []).find((c) => c._id === p.competitionId);
  if (req.user.role !== 'admin' && String(p.organizer) !== req.user._id && !(comp && isAssignedOrganizer(comp, req.user))) {
    return res.status(403).json({ message: 'Access denied: you cannot delete an unrelated organizer problem statement' });
  }
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

/**
 * POST /api/problems/upload-image
 * Organizer / Admin uploads an illustration/diagram for a problem statement
 */
const uploadProblemImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  try {
    storageService.validateImageFile(req.file);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  const processed = await storageService.processUpload(req.file, 'problems');
  res.status(200).json({
    message: 'Problem image uploaded successfully',
    imageUrl: processed.url,
    file: processed,
  });
});

module.exports = { getAll, getOne, create, update, remove, analyze, uploadProblemImage };
