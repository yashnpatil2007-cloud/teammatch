const { db, save, uid, now } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');
const { createNotification } = require('../utils/notify');
const { recordAudit } = require('../utils/audit');

const isAssignedOrganizer = (comp, user) => {
  if (!comp || !user) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'organizer') return false;
  const uidStr = String(user._id);
  const fullUser = (db.users || []).find((u) => u._id === uidStr);
  return (
    String(comp.organizer || '') === uidStr ||
    String(comp.createdBy || '') === uidStr ||
    (comp.assignedOrganizers || []).map(String).includes(uidStr) ||
    (comp.judges || []).some((j) => String(j.userId) === uidStr) ||
    (fullUser?.assignedCompetitions || []).map(String).includes(String(comp._id))
  );
};

const enrichCompetition = (comp) => {
  const problems = (db.problems || []).filter((p) => p.competitionId === comp._id);
  const problemIds = new Set(problems.map((p) => p._id));
  const teams = (db.teams || []).filter(
    (t) => t.competitionId === comp._id || problemIds.has(t.problem)
  );
  const teamIds = new Set(teams.map((t) => t._id));
  const submissions = (db.submissions || []).filter(
    (s) => s.competitionId === comp._id || problemIds.has(s.problem) || teamIds.has(s.team)
  );
  const orgUser = (db.users || []).find((u) => u._id === comp.organizer);
  const assignedUsers = (comp.assignedOrganizers || [])
    .map((oid) => (db.users || []).find((u) => u._id === oid))
    .filter(Boolean)
    .map((u) => ({ _id: u._id, name: u.name, email: u.email, avatar: u.avatar }));

  return {
    ...comp,
    organizerDetails: orgUser
      ? { _id: orgUser._id, name: orgUser.name, email: orgUser.email, avatar: orgUser.avatar }
      : null,
    assignedOrganizerDetails: assignedUsers,
    stats: {
      problemsCount: problems.length,
      teamsCount: teams.length,
      submissionsCount: submissions.length,
      approvedCount: submissions.filter((s) => s.status === 'approved').length,
    },
  };
};

/**
 * GET /api/competitions
 * Public / role-scoped list of competitions
 */
const listCompetitions = asyncHandler(async (req, res) => {
  const { mine, status, q } = req.query;
  let list = [...(db.competitions || [])];

  const user = req.user || null;
  if (!user || !['admin', 'organizer'].includes(user.role)) {
    list = list.filter((c) => c.status !== 'draft');
  } else if (user.role === 'organizer') {
    if (mine === 'true') {
      list = list.filter((c) => isAssignedOrganizer(c, user));
    } else {
      list = list.filter((c) => c.status !== 'draft' || isAssignedOrganizer(c, user));
    }
  }

  if (status && status !== 'all') {
    list = list.filter((c) => c.status === status);
  }
  if (q && String(q).trim()) {
    const term = String(q).trim().toLowerCase();
    list = list.filter(
      (c) =>
        (c.title || '').toLowerCase().includes(term) ||
        (c.description || '').toLowerCase().includes(term) ||
        (c.category || '').toLowerCase().includes(term)
    );
  }

  list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json(list.map(enrichCompetition));
});

/**
 * GET /api/competitions/:id
 */
const getCompetition = asyncHandler(async (req, res) => {
  const comp = (db.competitions || []).find((c) => c._id === req.params.id);
  if (!comp) return res.status(404).json({ message: 'Competition not found' });

  if (comp.status === 'draft' && (!req.user || !isAssignedOrganizer(comp, req.user))) {
    return res.status(403).json({ message: 'Access denied: draft competition is restricted to assigned organizers and admins' });
  }

  const problems = (db.problems || []).filter(
    (p) => p.competitionId === comp._id && (p.status !== 'draft' || isAssignedOrganizer(comp, req.user))
  );

  res.json({
    ...enrichCompetition(comp),
    problems,
  });
});

/**
 * POST /api/competitions
 * Organizer or Admin creates a competition
 */
const createCompetition = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    bannerUrl = '',
    rules = '',
    eligibility = 'Open to verified university students and builders',
    category = 'Innovation Challenge',
    registrationStart,
    registrationEnd,
    startDate,
    endDate,
    teamSizeMin = 2,
    teamSizeMax = 5,
    status = 'published',
    assignedOrganizers = [],
  } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'Competition title is required' });
  }
  if (!description || !String(description).trim()) {
    return res.status(400).json({ message: 'Competition description is required' });
  }

  const allowedStatuses = ['draft', 'published', 'ongoing', 'closed'];
  const settings = (db.settings || [])[0];
  let initialStatus = allowedStatuses.includes(status) ? status : 'published';
  if (req.user.role === 'organizer' && settings?.requireAdminApprovalForCompetitions && initialStatus === 'published') {
    initialStatus = 'draft';
  }

  const minSize = Math.max(1, Number(teamSizeMin) || 2);
  const maxSize = Math.max(minSize, Number(teamSizeMax) || 5);

  const compId = 'comp-' + uid().slice(0, 8);
  const orgList = Array.isArray(assignedOrganizers) ? [...assignedOrganizers] : [];
  if (req.user.role === 'organizer' && !orgList.includes(req.user._id)) {
    orgList.push(req.user._id);
  }

  const primaryOrg = req.user.role === 'organizer' ? req.user._id : orgList[0] || req.user._id;
  const comp = {
    _id: compId,
    title: String(title).trim(),
    description: String(description).trim(),
    bannerUrl: String(bannerUrl || '').trim(),
    rules: String(rules || '').trim(),
    eligibility: String(eligibility || '').trim(),
    category: String(category || 'Innovation Challenge').trim(),
    registrationStart: registrationStart || null,
    registrationEnd: registrationEnd || null,
    startDate: startDate || null,
    endDate: endDate || null,
    teamSizeMin: minSize,
    teamSizeMax: maxSize,
    status: initialStatus,
    organizer: primaryOrg,
    assignedOrganizers: Array.from(new Set(orgList)),
    judges:
      req.user.role === 'organizer'
        ? [{ userId: req.user._id, name: req.user.name, email: req.user.email, assignedAt: now() }]
        : [],
    resultsPublished: false,
    winners: [],
    createdBy: req.user._id,
    createdAt: now(),
    updatedAt: now(),
  };

  db.competitions = db.competitions || [];
  db.competitions.unshift(comp);

  // Sync assignedCompetitions onto organizer user records
  comp.assignedOrganizers.forEach((oid) => {
    const u = (db.users || []).find((x) => x._id === oid);
    if (u) {
      u.assignedCompetitions = Array.from(new Set([...(u.assignedCompetitions || []), comp._id]));
    }
  });

  save();
  recordAudit({
    actor: req.user,
    action: 'competition_created',
    targetType: 'competition',
    targetId: comp._id,
    details: `Created competition "${comp.title}" (${comp.status})`,
  });

  res.status(201).json(enrichCompetition(comp));
});

/**
 * PUT /api/competitions/:id
 * Assigned Organizer or Admin updates competition
 */
const updateCompetition = asyncHandler(async (req, res) => {
  const comp = (db.competitions || []).find((c) => c._id === req.params.id);
  if (!comp) return res.status(404).json({ message: 'Competition not found' });

  if (!isAssignedOrganizer(comp, req.user)) {
    return res.status(403).json({ message: 'Access denied: you are not assigned to manage this competition' });
  }

  const editable = [
    'title',
    'description',
    'bannerUrl',
    'rules',
    'eligibility',
    'category',
    'registrationStart',
    'registrationEnd',
    'startDate',
    'endDate',
    'teamSizeMin',
    'teamSizeMax',
    'status',
  ];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) comp[field] = req.body[field];
  });
  if (comp.teamSizeMin !== undefined && comp.teamSizeMax !== undefined) {
    comp.teamSizeMin = Math.max(1, Number(comp.teamSizeMin) || 1);
    comp.teamSizeMax = Math.max(comp.teamSizeMin, Number(comp.teamSizeMax) || comp.teamSizeMin);
  }
  if (req.user.role === 'admin' && Array.isArray(req.body.assignedOrganizers)) {
    comp.assignedOrganizers = Array.from(new Set(req.body.assignedOrganizers.map(String)));
  }

  comp.updatedAt = now();
  save();
  res.json(enrichCompetition(comp));
});

/**
 * PATCH /api/competitions/:id/status
 */
const updateCompetitionStatus = asyncHandler(async (req, res) => {
  const comp = (db.competitions || []).find((c) => c._id === req.params.id);
  if (!comp) return res.status(404).json({ message: 'Competition not found' });

  if (!isAssignedOrganizer(comp, req.user)) {
    return res.status(403).json({ message: 'Access denied: you cannot change status of an unassigned competition' });
  }

  const { status } = req.body;
  const allowed = ['draft', 'published', 'ongoing', 'closed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Allowed: draft, published, ongoing, closed' });
  }

  const prev = comp.status;
  comp.status = status;
  comp.updatedAt = now();
  save();
  recordAudit({
    actor: req.user,
    action: 'competition_status_changed',
    targetType: 'competition',
    targetId: comp._id,
    details: `Competition "${comp.title}" status changed from ${prev} to ${status}`,
    previousValue: { status: prev },
    newValue: { status },
  });
  res.json(enrichCompetition(comp));
});

/**
 * POST /api/competitions/:id/judges
 * Assign judges / reviewers to competition
 */
const assignJudges = asyncHandler(async (req, res) => {
  const comp = (db.competitions || []).find((c) => c._id === req.params.id);
  if (!comp) return res.status(404).json({ message: 'Competition not found' });

  if (!isAssignedOrganizer(comp, req.user)) {
    return res.status(403).json({ message: 'Access denied: only assigned organizers or admins can manage judges' });
  }

  const { userId, email, name, judges } = req.body;
  comp.judges = comp.judges || [];

  if (Array.isArray(judges)) {
    comp.judges = judges
      .map((j) => {
        const jUser = j.userId
          ? (db.users || []).find((u) => u._id === j.userId)
          : j.email
          ? (db.users || []).find((u) => u.email.toLowerCase() === String(j.email).toLowerCase())
          : null;
        return {
          userId: jUser ? jUser._id : j.userId || `ext-${uid().slice(0, 6)}`,
          name: jUser ? jUser.name : String(j.name || j.email || 'External Judge').trim(),
          email: jUser ? jUser.email : String(j.email || '').trim(),
          expertise: String(j.expertise || '').trim(),
          assignedAt: j.assignedAt || now(),
        };
      })
      .filter((j) => j.name || j.email);

    comp.updatedAt = now();
    save();
    return res.json(enrichCompetition(comp));
  }

  let target = userId ? (db.users || []).find((u) => u._id === userId) : null;
  if (!target && email) {
    target = (db.users || []).find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  }

  const judgeEntry = {
    userId: target ? target._id : `ext-${uid().slice(0, 6)}`,
    name: target ? target.name : String(name || email || 'External Judge').trim(),
    email: target ? target.email : String(email || '').trim(),
    assignedAt: now(),
  };

  if (comp.judges.some((j) => j.userId === judgeEntry.userId || (judgeEntry.email && j.email === judgeEntry.email))) {
    return res.status(400).json({ message: 'This reviewer is already assigned as a judge' });
  }

  comp.judges.push(judgeEntry);
  comp.updatedAt = now();

  if (target) {
    createNotification({
      recipient: target._id,
      sender: req.user._id,
      type: 'system',
      title: 'Assigned as Competition Judge',
      message: `You have been assigned to review submissions for "${comp.title}".`,
      link: '/dashboard/organizer/judging',
    });
  }

  save();
  res.json(enrichCompetition(comp));
});

/**
 * POST /api/competitions/:id/results
 * Publish competition winners and official results
 */
const publishResults = asyncHandler(async (req, res) => {
  const comp = (db.competitions || []).find((c) => c._id === req.params.id);
  if (!comp) return res.status(404).json({ message: 'Competition not found' });

  if (!isAssignedOrganizer(comp, req.user)) {
    return res.status(403).json({ message: 'Access denied: only assigned organizers or admins can publish results' });
  }

  const { winners = [], resultsPublished = true } = req.body;
  if (!Array.isArray(winners)) {
    return res.status(400).json({ message: 'winners must be an array' });
  }

  comp.winners = winners.map((w, idx) => {
    const team = (db.teams || []).find((t) => t._id === w.teamId);
    const sub = (db.submissions || []).find((s) => s._id === w.submissionId || s.team === w.teamId);
    return {
      rank: Number(w.rank) || idx + 1,
      teamId: w.teamId,
      teamName: w.teamName || team?.name || 'Team',
      submissionId: w.submissionId || sub?._id || '',
      projectTitle: w.projectTitle || sub?.title || '',
      score: Number(w.score) || sub?.reviews?.[0]?.score || 0,
      prize: String(w.prize || '').trim(),
      notes: String(w.notes || '').trim(),
    };
  });
  comp.resultsPublished = Boolean(resultsPublished);
  comp.updatedAt = now();

  if (comp.resultsPublished) {
    comp.winners.forEach((w) => {
      const team = (db.teams || []).find((t) => t._id === w.teamId);
      if (team) {
        (team.members || []).forEach((m) => {
          const mid = String(m._id || m);
          createNotification({
            recipient: mid,
            sender: req.user._id,
            type: 'system',
            title: `Competition Results Published (${comp.title})`,
            message: `Congratulations! Team "${team.name}" placed #${w.rank} in "${comp.title}"!`,
            link: `/dashboard/teams/${team._id}/workspace`,
          });
        });
      }
    });
  }

  save();
  recordAudit({
    actor: req.user,
    action: 'competition_results_published',
    targetType: 'competition',
    targetId: comp._id,
    details: `${comp.resultsPublished ? 'Published' : 'Saved'} results for "${comp.title}" (${comp.winners.length} ranked winners)`,
  });

  res.json(enrichCompetition(comp));
});

/**
 * GET /api/competitions/:id/teams
 * Participating teams for a competition (Admin or Assigned Organizer only)
 */
const getCompetitionTeams = asyncHandler(async (req, res) => {
  const comp = (db.competitions || []).find((c) => c._id === req.params.id);
  if (!comp) return res.status(404).json({ message: 'Competition not found' });

  if (!isAssignedOrganizer(comp, req.user)) {
    return res.status(403).json({ message: 'Access denied: you are not assigned to monitor this competition' });
  }

  const problems = (db.problems || []).filter((p) => p.competitionId === comp._id);
  const problemIds = new Set(problems.map((p) => p._id));
  const teams = (db.teams || []).filter((t) => t.competitionId === comp._id || problemIds.has(t.problem));

  const populated = teams.map((t) => {
    const prob = problems.find((p) => p._id === t.problem) || (db.problems || []).find((p) => p._id === t.problem);
    const sub = (db.submissions || []).find((s) => s.team === t._id);
    const members = (t.members || []).map((mid) => {
      const u = (db.users || []).find((x) => x._id === String(mid._id || mid));
      return u ? { _id: u._id, name: u.name, role: u.role, avatar: u.avatar, skills: u.skills || [] } : { _id: mid };
    });
    const leaderUser = (db.users || []).find((u) => u._id === t.leader);
    return {
      ...t,
      problemTitle: prob?.title || '',
      leaderName: leaderUser?.name || t.leaderName || '',
      members,
      submissionStatus: sub ? sub.status : 'none',
      submissionId: sub?._id || null,
    };
  });

  res.json(populated);
});

/**
 * DELETE /api/competitions/:id
 */
const deleteCompetition = asyncHandler(async (req, res) => {
  const idx = (db.competitions || []).findIndex((c) => c._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Competition not found' });
  const comp = db.competitions[idx];

  if (req.user.role !== 'admin' && String(comp.createdBy) !== req.user._id && String(comp.organizer) !== req.user._id) {
    return res.status(403).json({ message: 'Access denied: only the competition owner or admin can delete this competition' });
  }

  const linkedProblems = (db.problems || []).filter((p) => p.competitionId === comp._id);
  if (linkedProblems.length > 0 && req.query.force !== 'true') {
    return res.status(400).json({
      message: `Competition still has ${linkedProblems.length} linked problem statement(s). Archive/close it instead or pass ?force=true.`,
    });
  }

  db.competitions.splice(idx, 1);
  save();
  recordAudit({
    actor: req.user,
    action: 'competition_deleted',
    targetType: 'competition',
    targetId: comp._id,
    details: `Deleted competition "${comp.title}"`,
  });

  res.json({ message: 'Competition removed' });
});

module.exports = {
  isAssignedOrganizer,
  listCompetitions,
  getCompetition,
  createCompetition,
  updateCompetition,
  updateCompetitionStatus,
  assignJudges,
  publishResults,
  getCompetitionTeams,
  deleteCompetition,
};
