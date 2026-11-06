const { db, save, uid, now } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');
const {
  APTITUDE_QUESTIONS,
  PERSONALITY_QUESTIONS,
  ARCHETYPES,
  TECHNICAL_QUESTION_BANKS,
} = require('../data/assessmentData');

// In-memory question overrides for custom admin-created or edited questions
const customQuestions = {
  aptitude: [],
  personality: [],
  technical: {},
};

// Helper to determine badge from objective score
const badgeForScore = (score) => {
  const s = Number(score) || 0;
  if (s >= 90) return 'Platinum';
  if (s >= 75) return 'Gold';
  if (s >= 60) return 'Silver';
  return 'Bronze';
};

// Fisher-Yates shuffle helper
const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Ensure db.assessments array exists
const getAssessments = () => {
  db.assessments = db.assessments || [];
  return db.assessments;
};

/**
 * GET /api/assessments/overview
 * Overview of student assessment status, summary metrics, and platform catalog
 */
const getOverview = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const allResults = getAssessments().filter((a) => a.userId === user._id);
  allResults.sort((a, b) => new Date(b.takenAt || 0) - new Date(a.takenAt || 0));

  // Technical skills summary
  const skills = user.skills || [];
  const verifiedSkillsCount = skills.filter((s) => s.verifiedScore >= 60 || s.badge === 'Certified').length;

  // Aptitude test summary
  const aptitudeResults = allResults.filter((a) => a.assessmentType === 'aptitude');
  const latestAptitude = aptitudeResults[0] || null;
  const bestAptitudeScore = aptitudeResults.length
    ? Math.max(...aptitudeResults.map((a) => a.score || 0))
    : user.aptitudeScore || 0;

  // Personality summary
  const personalityResults = allResults.filter((a) => a.assessmentType === 'personality');
  const latestPersonality = personalityResults[0] || null;

  res.json({
    summary: {
      totalAssessmentsTaken: allResults.length,
      reliabilityScore: user.reliabilityScore || 75,
      verifiedSkillsCount,
      bestAptitudeScore,
      aptitudeLevel: user.aptitudeLevel || (latestAptitude ? `Level ${latestAptitude.level}` : 'Not Assessed'),
      aptitudeBadge: user.aptitudeBadge || (latestAptitude ? latestAptitude.badge : 'None'),
      personalityArchetype: user.personality?.archetype || latestPersonality?.archetype || 'Not Assessed',
      personalitySummary: user.personality?.summary || latestPersonality?.details?.summary || '',
      personalityDimensions: user.personality?.dimensions || latestPersonality?.metrics || null,
      personalityIdealComplement: user.personality?.idealComplement || latestPersonality?.details?.idealComplements?.join(', ') || '',
    },
    catalog: {
      technicalSkills: Object.keys(TECHNICAL_QUESTION_BANKS).concat(
        (db.quizzes || []).map((q) => q.skill)
      ).filter((v, i, a) => a.indexOf(v) === i),
      aptitudeQuestionCount: APTITUDE_QUESTIONS.length + customQuestions.aptitude.length,
      personalityQuestionCount: PERSONALITY_QUESTIONS.length + customQuestions.personality.length,
      archetypes: ARCHETYPES.map((a) => ({ key: a.key, title: a.title, tagline: a.tagline })),
    },
    recentResults: allResults.slice(0, 5),
  });
});

/**
 * GET /api/assessments/aptitude/questions
 * Returns aptitude questions with randomized order, hiding correct answers and explanations
 */
const getAptitudeQuestions = asyncHandler(async (req, res) => {
  const pool = [...APTITUDE_QUESTIONS, ...customQuestions.aptitude];
  const shuffled = shuffle(pool).map((q) => {
    // Randomize options while keeping track for client display
    return {
      id: q.id,
      category: q.category,
      difficulty: q.difficulty,
      level: q.level,
      q: q.q,
      options: q.options, // Options array
    };
  });

  res.json({
    assessmentType: 'aptitude',
    title: 'Aptitude & Logical Reasoning Assessment',
    description: 'Objectively timed assessment evaluating deductive logic, quantitative reasoning, and pattern recognition.',
    timeLimitSeconds: 600, // 10 minutes
    totalQuestions: shuffled.length,
    isSelfReported: false,
    questions: shuffled,
  });
});

/**
 * POST /api/assessments/aptitude/submit
 * Server-side objective evaluation of aptitude test answers
 */
const submitAptitude = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { answers = [], timeSpentSeconds = 0 } = req.body;
  const pool = [...APTITUDE_QUESTIONS, ...customQuestions.aptitude];
  const questionMap = new Map(pool.map((q) => [q.id, q]));

  let correctCount = 0;
  const categoryBreakdown = {};
  const questionReviews = [];

  answers.forEach((ans) => {
    const qObj = questionMap.get(ans.questionId);
    if (!qObj) return;

    const cat = qObj.category || 'general';
    categoryBreakdown[cat] = categoryBreakdown[cat] || { correct: 0, total: 0 };
    categoryBreakdown[cat].total += 1;

    const isCorrect = Number(ans.selectedOption) === qObj.answer;
    if (isCorrect) {
      correctCount += 1;
      categoryBreakdown[cat].correct += 1;
    }

    questionReviews.push({
      id: qObj.id,
      category: qObj.category,
      q: qObj.q,
      options: qObj.options,
      selectedOption: ans.selectedOption,
      correctAnswer: qObj.answer,
      isCorrect,
      explanation: qObj.explanation,
    });
  });

  const totalQuestions = answers.length || 1;
  const score = Math.round((correctCount / totalQuestions) * 100);
  const badge = badgeForScore(score);
  const level = Math.max(1, Math.min(10, Math.round(score / 10)));
  const verified = score >= 60;

  // Compute breakdown percentages
  const metrics = {};
  Object.keys(categoryBreakdown).forEach((cat) => {
    const item = categoryBreakdown[cat];
    metrics[cat] = Math.round((item.correct / (item.total || 1)) * 100);
  });

  const resultId = 'ar-' + uid().slice(0, 10);
  const assessmentRecord = {
    _id: resultId,
    userId: user._id,
    assessmentType: 'aptitude',
    skillOrDomain: 'logical_reasoning',
    score,
    level,
    badge,
    archetype: '',
    metrics,
    details: {
      isSelfReported: false,
      totalQuestions,
      correctCount,
      timeSpentSeconds,
      verified,
      categoryBreakdown,
      questionReviews,
    },
    takenAt: now(),
  };

  getAssessments().unshift(assessmentRecord);

  // Update user profile
  user.aptitudeScore = Math.max(user.aptitudeScore || 0, score);
  user.aptitudeLevel = `Level ${level}`;
  user.aptitudeBadge = badge;
  if (verified) {
    user.reliabilityScore = Math.min(100, (user.reliabilityScore || 75) + 3);
  }
  user.updatedAt = now();

  save();

  res.status(201).json({
    result: assessmentRecord,
    score,
    badge,
    level,
    verified,
    metrics,
    correctCount,
    totalQuestions,
    questionReviews,
    message: verified
      ? `Aptitude assessment completed! You scored ${score}% and earned the ${badge} Badge.`
      : `Aptitude assessment completed with score ${score}%. Score 60% or higher to earn verification.`,
  });
});

/**
 * GET /api/assessments/personality/questions
 * Returns situational team scenario questions evaluating working-style dimensions
 */
const getPersonalityQuestions = asyncHandler(async (req, res) => {
  const pool = [...PERSONALITY_QUESTIONS, ...customQuestions.personality];
  // Sanitize options to not reveal dimension weights to client
  const sanitized = pool.map((q) => ({
    id: q.id,
    scenario: q.scenario,
    q: q.q,
    options: q.options.map((opt, idx) => ({
      index: idx,
      text: opt.text,
    })),
  }));

  res.json({
    assessmentType: 'personality',
    title: 'Personality & Working-Style Assessment',
    description: 'Self-reported assessment evaluating collaboration dynamics, decision making, and team archetype profiles.',
    isSelfReported: true,
    totalQuestions: sanitized.length,
    dimensions: [
      { key: 'execution', label: 'Execution & Delivery' },
      { key: 'innovation', label: 'Innovation & Ideation' },
      { key: 'collaboration', label: 'Collaboration & Empathy' },
      { key: 'leadership', label: 'Leadership & Coordination' },
      { key: 'detail_orientation', label: 'Detail & Quality Assurance' },
    ],
    questions: sanitized,
  });
});

/**
 * POST /api/assessments/personality/submit
 * Evaluates working-style dimensions and classifies team archetype
 */
const submitPersonality = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { answers = [] } = req.body;
  const pool = [...PERSONALITY_QUESTIONS, ...customQuestions.personality];
  const questionMap = new Map(pool.map((q) => [q.id, q]));

  const rawDimensions = {
    execution: 0,
    innovation: 0,
    collaboration: 0,
    leadership: 0,
    detail_orientation: 0,
  };

  const maxPossible = {
    execution: 0,
    innovation: 0,
    collaboration: 0,
    leadership: 0,
    detail_orientation: 0,
  };

  // Compute maximums
  pool.forEach((q) => {
    q.options.forEach((opt) => {
      Object.entries(opt.weights || {}).forEach(([dim, val]) => {
        if (maxPossible[dim] !== undefined) {
          maxPossible[dim] += val;
        }
      });
    });
  });

  // Calculate user choices
  answers.forEach((ans) => {
    const qObj = questionMap.get(ans.questionId);
    if (!qObj) return;
    const selected = qObj.options[ans.selectedOption];
    if (!selected || !selected.weights) return;

    Object.entries(selected.weights).forEach(([dim, val]) => {
      if (rawDimensions[dim] !== undefined) {
        rawDimensions[dim] += val;
      }
    });
  });

  // Normalize dimensions to 0 - 100%
  const normalizedDimensions = {};
  const totalAnswers = answers.length || 1;
  Object.keys(rawDimensions).forEach((dim) => {
    const maxForCount = (maxPossible[dim] / pool.length) * totalAnswers || 10;
    const pct = Math.min(100, Math.max(10, Math.round((rawDimensions[dim] / maxForCount) * 100)));
    normalizedDimensions[dim] = pct;
  });

  // Determine Archetype by checking strongest combined dimensions
  const archetypeScores = ARCHETYPES.map((arch) => {
    const score = arch.primaryDimensions.reduce((sum, dim) => sum + (normalizedDimensions[dim] || 50), 0);
    return { archetype: arch, score };
  });

  archetypeScores.sort((a, b) => b.score - a.score);
  const primaryMatch = archetypeScores[0].archetype;
  const secondaryMatch = archetypeScores[1].archetype;

  const resultId = 'ar-' + uid().slice(0, 10);
  const assessmentRecord = {
    _id: resultId,
    userId: user._id,
    assessmentType: 'personality',
    skillOrDomain: 'workstyle_profile',
    score: 100, // Completion indicator
    level: 5,
    badge: 'Self-Reported',
    archetype: primaryMatch.title,
    metrics: normalizedDimensions,
    details: {
      isSelfReported: true,
      tagline: primaryMatch.tagline,
      strengths: primaryMatch.strengths,
      idealComplements: primaryMatch.idealComplements,
      secondaryArchetype: secondaryMatch.title,
      summary: `${primaryMatch.title} — ${primaryMatch.tagline}`,
      answersCount: answers.length,
    },
    takenAt: now(),
  };

  getAssessments().unshift(assessmentRecord);

  // Update user profile with personality working style
  user.personality = {
    archetype: primaryMatch.title,
    dimensions: normalizedDimensions,
    summary: `${primaryMatch.title}: ${primaryMatch.tagline}`,
    idealComplement: primaryMatch.idealComplements.join(', '),
    takenAt: now(),
  };
  user.updatedAt = now();

  save();

  res.status(201).json({
    result: assessmentRecord,
    archetype: primaryMatch.title,
    tagline: primaryMatch.tagline,
    strengths: primaryMatch.strengths,
    idealComplements: primaryMatch.idealComplements,
    dimensions: normalizedDimensions,
    secondaryArchetype: secondaryMatch.title,
    isSelfReported: true,
    message: `Working-style assessment completed! You exhibit the characteristics of ${primaryMatch.title}.`,
  });
});

/**
 * GET /api/assessments/technical/skills
 * Lists all technical skills available for testing with user's current level & badge
 */
const getTechnicalSkills = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  const userSkills = user?.skills || [];

  const catalog = [
    { skill: 'react', name: 'React.js', category: 'Frontend', icon: 'Code', description: 'Components, hooks, state management, and virtual DOM performance.' },
    { skill: 'python', name: 'Python', category: 'Backend / AI', icon: 'Terminal', description: 'Data structures, generators, OOP, concurrency, and standard libraries.' },
    { skill: 'node', name: 'Node.js', category: 'Backend', icon: 'Server', description: 'Event loop, libuv, asynchronous I/O, streams, and Express APIs.' },
    { skill: 'ml', name: 'Machine Learning', category: 'AI & Data Science', icon: 'Cpu', description: 'Supervised algorithms, validation metrics, regularizations, and model tuning.' },
    { skill: 'ui_ux', name: 'UI / UX Design', category: 'Design', icon: 'Palette', description: 'Design systems, accessibility standards (WCAG), layout principles, and user testing.' },
    { skill: 'devops', name: 'DevOps & Cloud', category: 'Infrastructure', icon: 'Cloud', description: 'Docker, CI/CD pipelines, container orchestration, and deployments.' },
    { skill: 'dsa', name: 'Data Structures & Algorithms', category: 'Computer Science', icon: 'Binary', description: 'Big-O complexity, tree & graph traversals, and dynamic programming.' },
    { skill: 'cybersecurity', name: 'Cybersecurity', category: 'Security', icon: 'Shield', description: 'SQL injection prevention, XSS mitigation, secure authentication, and authorization.' },
  ];

  // Merge with custom quizzes created in db.quizzes
  (db.quizzes || []).forEach((q) => {
    if (!catalog.some((c) => c.skill.toLowerCase() === q.skill.toLowerCase())) {
      catalog.push({
        skill: q.skill.toLowerCase(),
        name: q.skill.charAt(0).toUpperCase() + q.skill.slice(1),
        category: 'Custom Domain',
        icon: 'Brain',
        description: `Technical assessment for ${q.skill}.`,
      });
    }
  });

  const skillsWithUserStatus = catalog.map((item) => {
    const existing = userSkills.find((s) => s.name.toLowerCase() === item.skill.toLowerCase());
    const questionsCount = (TECHNICAL_QUESTION_BANKS[item.skill] || []).length ||
      ((db.quizzes || []).find((q) => q.skill.toLowerCase() === item.skill)?.questions || []).length || 5;

    return {
      ...item,
      totalQuestions: questionsCount,
      userLevel: existing?.level || 0,
      userBadge: existing?.badge || 'None',
      userScore: existing?.verifiedScore || 0,
      isVerified: (existing?.verifiedScore || 0) >= 60 || existing?.badge === 'Certified',
    };
  });

  res.json(skillsWithUserStatus);
});

/**
 * GET /api/assessments/technical/:skill/questions
 * Returns questions for a specific technical skill, hiding answers and explanations
 */
const getTechnicalQuestions = asyncHandler(async (req, res) => {
  const skill = String(req.params.skill || '').toLowerCase();
  const bank = TECHNICAL_QUESTION_BANKS[skill];
  const dbQuiz = (db.quizzes || []).find((q) => q.skill.toLowerCase() === skill);

  let rawQuestions = [];
  if (bank && bank.length > 0) {
    rawQuestions = [...bank];
  } else if (dbQuiz && dbQuiz.questions && dbQuiz.questions.length > 0) {
    rawQuestions = dbQuiz.questions.map((q, idx) => ({
      id: `custom-${skill}-${idx}`,
      level: q.level || dbQuiz.level || 5,
      q: q.q,
      options: q.options,
      answer: q.answer,
      explanation: `Correct answer is Option ${String.fromCharCode(65 + q.answer)}.`,
    }));
  }

  if (!rawQuestions.length) {
    return res.status(404).json({ message: `No questions found for skill: ${skill}` });
  }

  const sanitized = shuffle(rawQuestions).map((q) => ({
    id: q.id,
    level: q.level,
    q: q.q,
    options: q.options,
  }));

  res.json({
    assessmentType: 'technical',
    skill,
    totalQuestions: sanitized.length,
    timeLimitSeconds: sanitized.length * 90, // 90 seconds per question
    isSelfReported: false,
    questions: sanitized,
  });
});

/**
 * POST /api/assessments/technical/submit
 * Server-side objective evaluation of technical quiz answers
 */
const submitTechnical = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { skill, answers = [], timeSpentSeconds = 0 } = req.body;
  if (!skill) return res.status(400).json({ message: 'Skill is required' });

  const skillSlug = String(skill).toLowerCase();
  const bank = TECHNICAL_QUESTION_BANKS[skillSlug];
  const dbQuiz = (db.quizzes || []).find((q) => q.skill.toLowerCase() === skillSlug);

  let sourceQuestions = [];
  if (bank && bank.length) {
    sourceQuestions = bank;
  } else if (dbQuiz && dbQuiz.questions) {
    sourceQuestions = dbQuiz.questions.map((q, idx) => ({
      id: `custom-${skillSlug}-${idx}`,
      q: q.q,
      options: q.options,
      answer: q.answer,
      level: q.level || 5,
      explanation: `Option ${String.fromCharCode(65 + q.answer)} is correct.`,
    }));
  }

  const questionMap = new Map(sourceQuestions.map((q) => [q.id, q]));

  let correctCount = 0;
  const questionReviews = [];

  answers.forEach((ans) => {
    const qObj = questionMap.get(ans.questionId);
    if (!qObj) return;

    const isCorrect = Number(ans.selectedOption) === qObj.answer;
    if (isCorrect) correctCount += 1;

    questionReviews.push({
      id: qObj.id,
      q: qObj.q,
      options: qObj.options,
      selectedOption: ans.selectedOption,
      correctAnswer: qObj.answer,
      isCorrect,
      explanation: qObj.explanation,
    });
  });

  const totalQuestions = answers.length || 1;
  const score = Math.round((correctCount / totalQuestions) * 100);
  const badge = badgeForScore(score);
  const level = Math.max(1, Math.min(10, Math.round(score / 10)));
  const verified = score >= 60;

  const resultId = 'ar-' + uid().slice(0, 10);
  const assessmentRecord = {
    _id: resultId,
    userId: user._id,
    assessmentType: 'technical',
    skillOrDomain: skillSlug,
    score,
    level,
    badge,
    archetype: '',
    metrics: { accuracy: score },
    details: {
      isSelfReported: false,
      totalQuestions,
      correctCount,
      timeSpentSeconds,
      verified,
      questionReviews,
    },
    takenAt: now(),
  };

  getAssessments().unshift(assessmentRecord);

  // Update user's skills & badge
  user.skills = user.skills || [];
  const existingSkill = user.skills.find((s) => s.name.toLowerCase() === skillSlug);
  if (verified) {
    if (existingSkill) {
      existingSkill.level = Math.max(existingSkill.level, level);
      existingSkill.verifiedScore = Math.max(existingSkill.verifiedScore || 0, score);
      existingSkill.badge = badge;
    } else {
      user.skills.push({
        name: skillSlug,
        level,
        verifiedScore: score,
        badge,
      });
    }
    user.reliabilityScore = Math.min(100, (user.reliabilityScore || 75) + 2);
  }

  // Record in quiz history for backward compatibility
  user.quizScores = user.quizScores || [];
  user.quizScores.push({
    _id: uid(),
    skill: skillSlug,
    level,
    score,
    badge,
    takenAt: now(),
  });

  user.updatedAt = now();
  save();

  res.status(201).json({
    result: assessmentRecord,
    skill: skillSlug,
    score,
    badge,
    level,
    verified,
    correctCount,
    totalQuestions,
    questionReviews,
    message: verified
      ? `Congratulations! You scored ${score}% in ${skillSlug} and earned the ${badge} badge.`
      : `Test completed with score ${score}%. Score 60% or higher to verify your skill.`,
  });
});

/**
 * GET /api/assessments/my-history
 * Returns user's assessment history across all 3 modules
 */
const getMyHistory = asyncHandler(async (req, res) => {
  const { type } = req.query;
  let results = getAssessments().filter((a) => a.userId === req.user._id);

  if (type && type !== 'all') {
    results = results.filter((a) => a.assessmentType === type);
  }

  results.sort((a, b) => new Date(b.takenAt || 0) - new Date(a.takenAt || 0));
  res.json(results);
});

/**
 * GET /api/assessments/admin/stats
 * Admin dashboard overview for assessment performance and questions management
 */
const getAdminAssessmentStats = asyncHandler(async (req, res) => {
  const allResults = getAssessments();
  const techCount = allResults.filter((a) => a.assessmentType === 'technical').length;
  const aptCount = allResults.filter((a) => a.assessmentType === 'aptitude').length;
  const persCount = allResults.filter((a) => a.assessmentType === 'personality').length;

  const aptScores = allResults.filter((a) => a.assessmentType === 'aptitude').map((a) => a.score || 0);
  const avgAptitude = aptScores.length ? Math.round(aptScores.reduce((s, v) => s + v, 0) / aptScores.length) : 0;

  const techScores = allResults.filter((a) => a.assessmentType === 'technical').map((a) => a.score || 0);
  const avgTechnical = techScores.length ? Math.round(techScores.reduce((s, v) => s + v, 0) / techScores.length) : 0;

  // Archetype distribution
  const archetypeDistribution = {};
  ARCHETYPES.forEach((arch) => {
    archetypeDistribution[arch.title] = allResults.filter((a) => a.archetype === arch.title).length;
  });

  res.json({
    totals: {
      allAttempts: allResults.length,
      technicalAttempts: techCount,
      aptitudeAttempts: aptCount,
      personalityAttempts: persCount,
      avgAptitudeScore: avgAptitude,
      avgTechnicalScore: avgTechnical,
    },
    archetypeDistribution,
    questionCounts: {
      aptitude: APTITUDE_QUESTIONS.length + customQuestions.aptitude.length,
      personality: PERSONALITY_QUESTIONS.length + customQuestions.personality.length,
      technical: Object.keys(TECHNICAL_QUESTION_BANKS).reduce((s, k) => s + TECHNICAL_QUESTION_BANKS[k].length, 0),
    },
    recentAttempts: allResults.slice(0, 15),
  });
});

/**
 * POST /api/assessments/admin/questions
 * Add question to question banks (technical, aptitude, or personality)
 */
const addAdminQuestion = asyncHandler(async (req, res) => {
  const { type, question } = req.body;
  if (!type || !question || !question.q || !Array.isArray(question.options)) {
    return res.status(400).json({ message: 'Invalid question payload. Question text and options required.' });
  }

  const qId = `q-${type}-${uid().slice(0, 6)}`;
  const newQ = { id: qId, ...question };

  if (type === 'aptitude') {
    customQuestions.aptitude.push(newQ);
  } else if (type === 'personality') {
    customQuestions.personality.push(newQ);
  } else if (type === 'technical') {
    const skill = (question.skill || 'general').toLowerCase();
    TECHNICAL_QUESTION_BANKS[skill] = TECHNICAL_QUESTION_BANKS[skill] || [];
    TECHNICAL_QUESTION_BANKS[skill].push(newQ);
  } else {
    return res.status(400).json({ message: 'Invalid assessment type' });
  }

  res.status(201).json({ message: 'Question added successfully', question: newQ });
});

module.exports = {
  getOverview,
  getAptitudeQuestions,
  submitAptitude,
  getPersonalityQuestions,
  submitPersonality,
  getTechnicalSkills,
  getTechnicalQuestions,
  submitTechnical,
  getMyHistory,
  getAdminAssessmentStats,
  addAdminQuestion,
};

