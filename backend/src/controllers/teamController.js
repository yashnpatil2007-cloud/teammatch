const { db, save, uid, now } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');
const { createNotification } = require('../utils/notify');
const { recordAudit } = require('../utils/audit');
const { isAssignedOrganizer } = require('./competitionController');
const {
  teamCoverage,
  calculateMatch,
  calculateComprehensiveMatch,
  generateAlternativeCombinations,
  DEFAULT_WEIGHTS,
} = require('../services/matchingEngine');

const findUser = (id) => db.users.find((u) => u._id === id);
const findProblem = (id) => db.problems.find((p) => p._id === id);

const getProblemCapacity = (problem) => {
  if (!problem || !problem.teamSize) return 4;
  if (typeof problem.teamSize === 'number') return problem.teamSize;
  if (typeof problem.teamSize === 'object') return problem.teamSize.max || problem.teamSize.min || 4;
  const num = parseInt(problem.teamSize, 10);
  return isNaN(num) ? 4 : num;
};

const briefUser = (id) => {
  const u = findUser(id);
  if (!u) return id;
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    skills: u.skills || [],
    reliabilityScore: u.reliabilityScore || 75,
    averageRating: u.averageRating || 0,
    totalReviews: u.totalReviews || 0,
    personality: u.personality || null,
    aptitudeScore: u.aptitudeScore || 0,
    aptitudeBadge: u.aptitudeBadge || '',
  };
};

const populateTeam = (t) => {
  if (!t) return t;
  const problem = findProblem(t.problem);
  return {
    ...t,
    problem: problem
      ? {
          _id: problem._id,
          title: problem.title,
          description: problem.description || '',
          category: problem.category,
          difficulty: problem.difficulty || 'Medium',
          requiredSkills: problem.requiredSkills || [],
          requiredRoles: problem.requiredRoles || [],
          teamSize: getProblemCapacity(problem),
          deadline: problem.deadline || '',
        }
      : t.problem,
    leader: briefUser(t.leader),
    members: (t.members || []).map(briefUser),
    invites: (t.invites || []).map((inv) => ({
      ...inv,
      user: briefUser(inv.user),
    })),
  };
};

const recompute = (team) => {
  const problem = findProblem(team.problem);
  if (!problem) return team;
  const memberObjs = (team.members || []).map(findUser).filter(Boolean);
  const analysis = teamCoverage(problem.requiredSkills, memberObjs);
  team.coverage = analysis.coverage;
  team.balanceScore = analysis.balance;
  team.missingSkills = analysis.missingSkills;
  team.missingRoles = analysis.missingRoles;
  team.duplicateSkills = analysis.duplicateSkills;
  team.archetypeDistribution = analysis.archetypeDistribution;
  team.recommendedArchetypes = analysis.recommendedArchetypes;

  const leader = findUser(team.leader);
  const avg = memberObjs.length
    ? Math.round(
        memberObjs.reduce(
          (sum, m) => sum + calculateMatch(problem.requiredSkills, m.skills || []).pct,
          0
        ) / memberObjs.length
      )
    : 0;
  team.matchPercentage = avg;
  team.status = team.coverage >= 95 ? 'complete' : 'forming';
  team.leaderName = leader ? leader.name : undefined;
  return team;
};

const getTeams = asyncHandler(async (req, res) => {
  const { problemId, status, competitionId, scope } = req.query;
  let list = [...db.teams];

  if (req.user.role === 'organizer') {
    // Organizers monitor teams registered in their assigned/created competitions
    const myCompIds = new Set(
      (db.competitions || [])
        .filter((c) => isAssignedOrganizer(c, req.user))
        .map((c) => c._id)
    );
    const myProbIds = new Set(
      (db.problems || [])
        .filter((p) => String(p.organizer) === req.user._id || myCompIds.has(p.competitionId))
        .map((p) => p._id)
    );
    list = list.filter((t) => myCompIds.has(t.competitionId) || myProbIds.has(t.problem));
  } else if (req.user.role !== 'admin' && scope !== 'all') {
    list = list.filter(
      (t) =>
        (t.status !== 'archived' && t.status !== 'moderated') ||
        String(t.leader) === req.user._id ||
        (t.members || []).includes(req.user._id)
    );
  }

  if (competitionId) list = list.filter((t) => t.competitionId === competitionId);
  if (problemId) list = list.filter((t) => t.problem === problemId);
  if (status) list = list.filter((t) => t.status === status);
  res.json(list.map(populateTeam));
});

const getMine = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const list = db.teams.filter(
    (t) =>
      (t.members || []).includes(me) ||
      t.leader === me ||
      (t.invites || []).some((i) => (i.user?._id || i.user) === me)
  );
  res.json(list.map(populateTeam));
});

const getOne = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (req.user.role === 'organizer') {
    const prob = findProblem(team.problem);
    const comp = (db.competitions || []).find((c) => c._id === (team.competitionId || prob?.competitionId));
    if (comp && !isAssignedOrganizer(comp, req.user) && String(prob?.organizer) !== req.user._id) {
      return res.status(403).json({ message: 'Access denied: team belongs to an unrelated competition' });
    }
  }
  res.json(populateTeam(team));
});

const createTeam = asyncHandler(async (req, res) => {
  if (req.user.role !== 'leader') {
    return res.status(403).json({ message: 'Only Team Leaders can create student teams' });
  }
  const { name, problemId, competitionId } = req.body;
  if (!name || !String(name).trim()) return res.status(400).json({ message: 'Team name is required' });
  const problem = findProblem(problemId) || db.problems[0];
  if (!problem) return res.status(400).json({ message: 'Valid problem statement required' });

  const leaderUser = db.users.find((u) => u._id === req.user._id);
  const teamId = 't-' + uid().slice(0, 8);
  const resolvedCompId = competitionId || problem.competitionId || (db.competitions || [])[0]?._id || '';
  const team = {
    _id: teamId,
    name: String(name).trim(),
    problem: problem._id,
    competitionId: resolvedCompId,
    leader: req.user._id,
    leaderName: leaderUser?.name,
    members: [req.user._id],
    memberRoles: [{ userId: req.user._id, teamRole: 'Team Leader / Coordinator' }],
    invites: [],
    coverage: 0,
    balanceScore: 1,
    matchPercentage: 0,
    missingSkills: (problem.requiredSkills || []).map((s) => s.name),
    missingRoles: problem.requiredRoles || [],
    status: 'forming',
    createdAt: now(),
  };

  recompute(team);
  db.teams.push(team);
  save();
  res.status(201).json(populateTeam(team));
});

/**
 * Smart Teammate Matching Endpoint 2.0
 * GET /api/teams/match?problemId=...&teamId=...&minMatch=...&role=...&onlyVerified=...
 */
const match = asyncHandler(async (req, res) => {
  if (req.user.role !== 'leader') {
    return res.status(403).json({ message: 'Find Members matching is restricted to Team Leaders' });
  }
  const { problemId, teamId, minMatch, role, onlyVerified } = req.query;

  let team = null;
  let problem = null;

  if (teamId) {
    team = db.teams.find((t) => t._id === teamId);
    if (team) {
      if (String(team.leader?._id || team.leader) !== req.user._id) {
        return res.status(403).json({ message: 'You can only match candidates for your own teams' });
      }
      problem = findProblem(team.problem);
    }
  }

  if (!problem && problemId) {
    problem = findProblem(problemId);
  }

  if (!problem) {
    problem = db.problems[0];
  }

  if (!problem) {
    return res.status(404).json({ message: 'No problem statements available' });
  }

  // Build team context if matching for an existing team
  let teamContext = null;
  const excludedUserIds = new Set();

  if (team) {
    const leaderUser = findUser(team.leader);
    const memberUsers = (team.members || []).map(findUser).filter(Boolean);
    const existingCoverage = teamCoverage(problem.requiredSkills, memberUsers);

    teamContext = {
      teamId: team._id,
      teamName: team.name,
      leader: leaderUser,
      members: memberUsers,
      missingSkills: existingCoverage.missingSkills,
      currentCoverage: existingCoverage.coverage,
      currentBalance: existingCoverage.balance,
      archetypeDistribution: existingCoverage.archetypeDistribution,
    };

    // Exclude members already in this team
    (team.members || []).forEach((m) => excludedUserIds.add(String(m._id || m)));
    excludedUserIds.add(String(team.leader?._id || team.leader));

    // Exclude pending invites
    (team.invites || []).forEach((inv) => {
      if (inv.status === 'pending') {
        excludedUserIds.add(String(inv.user?._id || inv.user));
      }
    });
  }

  // Count active team load per user
  const activeTeamsCount = new Map();
  db.teams.forEach((t) => {
    (t.members || []).forEach((m) => {
      const id = String(m._id || m);
      activeTeamsCount.set(id, (activeTeamsCount.get(id) || 0) + 1);
    });
  });

  // Candidate pool: all students/members (exclude currently logged-in user if team leader, plus existing members)
  const pool = db.users.filter(
    (u) =>
      ['member', 'leader'].includes(u.role) &&
      !excludedUserIds.has(u._id) &&
      u._id !== req.user._id
  );

  let recommendations = pool.map((u) => {
    const enrichedCandidate = {
      ...u,
      activeTeamsCount: activeTeamsCount.get(u._id) || 0,
    };

    const evaluation = calculateComprehensiveMatch(problem, enrichedCandidate, teamContext);

    return {
      user: {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        skills: u.skills || [],
        github: u.github,
        reliabilityScore: u.reliabilityScore || 75,
        averageRating: u.averageRating || 0,
        totalReviews: u.totalReviews || 0,
        aptitudeScore: u.aptitudeScore || 0,
        aptitudeBadge: u.aptitudeBadge || '',
        personality: u.personality || null,
      },
      match: evaluation.compositeScore, // Backward compatibility
      compositeScore: evaluation.compositeScore,
      confidence: evaluation.confidence,
      isProvisional: evaluation.isProvisional,
      missingAssessments: evaluation.missingAssessments,
      breakdown: evaluation.breakdown,
      missing: evaluation.missing,
      gapsClosed: evaluation.gapsClosed,
      roleFit: evaluation.roleFit,
      aiExplanation: evaluation.aiExplanation,
    };
  });

  // Apply filters
  if (minMatch) {
    const minThreshold = Number(minMatch) || 0;
    recommendations = recommendations.filter((r) => r.compositeScore >= minThreshold);
  }

  if (role) {
    const roleQuery = String(role).toLowerCase();
    recommendations = recommendations.filter((r) =>
      r.roleFit.some((rf) => rf.toLowerCase().includes(roleQuery))
    );
  }

  if (onlyVerified === 'true' || onlyVerified === true) {
    recommendations = recommendations.filter(
      (r) => !r.isProvisional && (r.user.skills || []).some((s) => s.badge === 'Certified' || s.verifiedScore >= 60)
    );
  }

  // Sort by composite score descending, then by reliability score
  recommendations.sort(
    (a, b) => b.compositeScore - a.compositeScore || b.user.reliabilityScore - a.user.reliabilityScore
  );

  // Generate 2-3 optimal alternative combinations
  const existingTeamMembers = teamContext ? teamContext.members : [];
  const targetSize = getProblemCapacity(problem);
  const alternativeCombinations = generateAlternativeCombinations(
    problem,
    recommendations,
    existingTeamMembers,
    targetSize
  );

  // Calculate current team analysis if team exists
  const teamAnalysis = teamContext
    ? {
        coverage: teamContext.currentCoverage,
        balance: teamContext.currentBalance,
        missingSkills: teamContext.missingSkills,
        archetypeDistribution: teamContext.archetypeDistribution,
        isAtCapacity: (team.members || []).length >= targetSize,
        maxCapacity: targetSize,
      }
    : null;

  res.json({
    problem: {
      _id: problem._id,
      title: problem.title,
      category: problem.category,
      difficulty: problem.difficulty,
      requiredSkills: problem.requiredSkills || [],
      requiredRoles: problem.requiredRoles || [],
      teamSize: targetSize,
    },
    team: team ? populateTeam(team) : null,
    teamAnalysis,
    recommendations,
    alternativeCombinations,
    weightsConfig: DEFAULT_WEIGHTS,
  });
});

/**
 * Team Strength Analyzer Endpoint
 * GET /api/teams/:teamId/analyze
 */
const analyze = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  const problem = findProblem(team.problem);
  const comp = (db.competitions || []).find((c) => c._id === (team.competitionId || problem?.competitionId));
  const isMember =
    String(team.leader?._id || team.leader) === req.user._id ||
    (team.members || []).some((m) => String(m._id || m) === req.user._id);
  const isAllowedOrganizer =
    req.user.role === 'organizer' &&
    ((comp && isAssignedOrganizer(comp, req.user)) || String(problem?.organizer) === req.user._id);

  if (req.user.role !== 'admin' && !isMember && !isAllowedOrganizer) {
    return res.status(403).json({ message: 'Access denied: you are not authorized to analyze this team' });
  }

  const members = (team.members || []).map(findUser).filter(Boolean);
  const analysis = teamCoverage(problem ? problem.requiredSkills : [], members);

  res.json({
    team: populateTeam(team),
    problem,
    ...analysis,
  });
});

/**
 * Team Invitation by Leader
 * POST /api/teams/:teamId/invite
 */
const invite = asyncHandler(async (req, res) => {
  if (req.user.role !== 'leader') {
    return res.status(403).json({ message: 'Only Team Leaders can send team invitations' });
  }
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  // Only owning team leader can invite members to this team
  const isLeader = String(team.leader?._id || team.leader) === req.user._id;
  if (!isLeader) {
    return res.status(403).json({ message: 'Only the team leader of this team can invite members.' });
  }

  const problem = findProblem(team.problem);
  const maxCapacity = getProblemCapacity(problem);

  if ((team.members || []).length >= maxCapacity) {
    return res.status(400).json({
      message: `Team is already at full capacity (${maxCapacity} members).`,
    });
  }

  const { userId } = req.body;
  if (!findUser(userId)) return res.status(404).json({ message: 'User not found' });
  if ((team.members || []).includes(userId)) {
    return res.status(400).json({ message: 'User is already a team member' });
  }

  team.invites = team.invites || [];
  const existingInvite = team.invites.find((i) => (i.user?._id || i.user) === userId);

  if (existingInvite && (existingInvite.status === 'pending' || existingInvite.status === 'requested')) {
    return res.status(400).json({ message: 'An invite or request is already pending for this student.' });
  }

  if (existingInvite) {
    existingInvite.status = 'pending';
    existingInvite.invitedAt = now();
  } else {
    team.invites.push({
      _id: 'inv-' + uid().slice(0, 8),
      user: userId,
      status: 'pending',
      invitedAt: now(),
    });
  }

  createNotification({
    recipient: userId,
    sender: req.user._id,
    type: 'invite_received',
    title: 'Team Invitation',
    message: `${req.user.name} invited you to join team "${team.name}".`,
    link: '/dashboard/teams',
  });

  save();
  res.json({ message: 'Team invitation sent successfully', team: populateTeam(team) });
});

/**
 * Student Join Request
 * POST /api/teams/:teamId/request-join
 */
const requestJoin = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  const problem = findProblem(team.problem);
  const maxCapacity = getProblemCapacity(problem);

  if ((team.members || []).length >= maxCapacity) {
    return res.status(400).json({
      message: `Team is already at full capacity (${maxCapacity} members).`,
    });
  }

  const userId = req.user._id;
  if ((team.members || []).includes(userId) || String(team.leader?._id || team.leader) === userId) {
    return res.status(400).json({ message: 'You are already a member or leader of this team.' });
  }

  team.invites = team.invites || [];
  const existing = team.invites.find((i) => (i.user?._id || i.user) === userId);
  if (existing && (existing.status === 'pending' || existing.status === 'requested')) {
    return res.status(400).json({ message: 'You already have a pending invite or request for this team.' });
  }

  if (existing) {
    existing.status = 'requested';
    existing.type = 'join_request';
    existing.invitedAt = now();
  } else {
    team.invites.push({
      _id: 'inv-' + uid().slice(0, 8),
      user: userId,
      status: 'requested',
      type: 'join_request',
      invitedAt: now(),
    });
  }

  const leaderId = String(team.leader?._id || team.leader);
  createNotification({
    recipient: leaderId,
    sender: req.user._id,
    type: 'join_requested',
    title: 'New Join Request',
    message: `${req.user.name} has requested to join your team "${team.name}".`,
    link: `/dashboard/teams/${team._id}/workspace`,
  });

  save();
  res.status(201).json({
    message: 'Join request submitted to team leader for review.',
    team: populateTeam(team),
  });
});

/**
 * Respond to Invitation or Join Request
 * POST /api/teams/:teamId/respond
 */
const respondInvite = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  const problem = findProblem(team.problem);
  const maxCapacity = getProblemCapacity(problem);

  const { userId, action } = req.body; // action: 'accept' | 'decline' | 'approve' | 'reject'
  const invite = (team.invites || []).find((i) => (i.user?._id || i.user) === userId);
  if (!invite) return res.status(404).json({ message: 'Invite not found' });

  const isLeader = req.user.role === 'leader' && String(team.leader?._id || team.leader) === req.user._id;
  const isTargetUser = req.user._id === String(userId);

  if (action === 'accept' || action === 'decline') {
    // Only the invited user can accept or decline their own invitation
    if (!isTargetUser) {
      return res.status(403).json({ message: 'You can only accept or decline invitations sent to yourself.' });
    }
    if (invite.status !== 'pending') {
      return res.status(400).json({ message: `Cannot ${action} invitation with current status "${invite.status}".` });
    }
  } else if (action === 'approve' || action === 'reject') {
    // Only the owning team leader can approve or reject join requests
    if (!isLeader) {
      return res.status(403).json({ message: 'Only the team leader can approve or reject join requests.' });
    }
    if (invite.status !== 'requested') {
      return res.status(400).json({ message: `Cannot ${action} join request with current status "${invite.status}".` });
    }
  } else {
    return res.status(400).json({ message: 'Invalid action. Must be accept, decline, approve, or reject.' });
  }

  if (action === 'accept' || action === 'approve') {
    if ((team.members || []).length >= maxCapacity) {
      return res.status(400).json({
        message: `Cannot accept member: team is at full capacity (${maxCapacity} members).`,
      });
    }
    invite.status = 'accepted';
    if (!team.members.includes(userId)) team.members.push(userId);
    createNotification({
      recipient: userId,
      sender: req.user._id,
      type: 'join_accepted',
      title: 'Joined Team Successfully',
      message: `You are now a confirmed member of team "${team.name}"!`,
      link: `/dashboard/teams/${team._id}/workspace`,
    });
  } else {
    invite.status = 'rejected';
    createNotification({
      recipient: userId,
      sender: req.user._id,
      type: 'join_rejected',
      title: 'Team Application Update',
      message: `Your invitation or join request for "${team.name}" was declined.`,
      link: '/dashboard/teams',
    });
  }

  recompute(team);
  save();
  res.json({ message: `Invitation ${action}ed`, team: populateTeam(team) });
});

const canManage = (team, user) =>
  user.role === 'leader' && String(team.leader?._id || team.leader) === user._id;

const updateTeam = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (!canManage(team, req.user)) return res.status(403).json({ message: 'Only the team leader can edit this team' });
  const { name, status, problemId } = req.body;
  if (name !== undefined && String(name).trim()) team.name = String(name).trim();
  if (status !== undefined && ['forming', 'complete', 'submitted'].includes(status)) team.status = status;
  if (problemId !== undefined && findProblem(problemId)) {
    const p = findProblem(problemId);
    team.problem = problemId;
    team.competitionId = p.competitionId || team.competitionId;
    recompute(team);
  }
  team.updatedAt = now();
  save();
  res.json(populateTeam(team));
});

const updateMemberRoles = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (!canManage(team, req.user)) {
    return res.status(403).json({ message: 'Only the team leader can assign team roles' });
  }
  const { memberRoles } = req.body;
  if (!Array.isArray(memberRoles)) {
    return res.status(400).json({ message: 'memberRoles array is required' });
  }
  const memberIds = new Set((team.members || []).map((m) => String(m._id || m)));
  team.memberRoles = memberRoles
    .filter((mr) => mr.userId && memberIds.has(String(mr.userId)))
    .map((mr) => ({ userId: String(mr.userId), teamRole: String(mr.teamRole || '').trim() }));
  team.updatedAt = now();
  save();
  res.json(populateTeam(team));
});

const adminModerateTeam = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Admin can moderate or archive teams' });
  }
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  const { status = 'archived', reason = '' } = req.body;
  if (!['forming', 'archived', 'moderated'].includes(status)) {
    return res.status(400).json({ message: 'Invalid moderation status. Must be forming, archived, or moderated' });
  }

  const prevStatus = team.status;
  team.status = status;
  team.moderationReason = String(reason || '').trim();
  team.moderatedBy = req.user._id;
  team.moderatedAt = now();
  team.updatedAt = now();

  (team.members || []).forEach((m) => {
    const mid = String(m._id || m);
    createNotification({
      recipient: mid,
      sender: req.user._id,
      type: 'system',
      title: `Team Status Moderated (${team.name})`,
      message: `Administrator updated team "${team.name}" status to ${status}${team.moderationReason ? `: ${team.moderationReason}` : '.'}`,
      link: `/dashboard/teams/${team._id}/workspace`,
    });
  });

  save();
  recordAudit({
    actor: req.user,
    action: 'admin_moderate_team',
    targetType: 'team',
    targetId: team._id,
    details: `Moderated team "${team.name}" from ${prevStatus} to ${status}${team.moderationReason ? ` — Reason: ${team.moderationReason}` : ''}`,
    previousValue: { status: prevStatus },
    newValue: { status, reason: team.moderationReason },
  });

  res.json({ message: `Team status updated to ${status}`, team: populateTeam(team) });
});

const removeTeam = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (!canManage(team, req.user) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the team leader or admin can delete this team' });
  }
  const idx = db.teams.indexOf(team);
  db.teams.splice(idx, 1);
  save();
  if (req.user.role === 'admin') {
    recordAudit({
      actor: req.user,
      action: 'admin_delete_team',
      targetType: 'team',
      targetId: team._id,
      details: `Admin deleted team "${team.name}"`,
    });
  }
  res.json({ message: 'Team removed' });
});

const removeMember = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  const { userId } = req.body;
  const isSelf = userId === req.user._id;
  if (!isSelf && !canManage(team, req.user) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not allowed' });
  }
  if (String(team.leader?._id || team.leader) === userId) {
    return res.status(400).json({ message: 'The leader cannot be removed. Delete the team instead.' });
  }
  team.members = (team.members || []).filter((m) => (m._id || m) !== userId);
  team.memberRoles = (team.memberRoles || []).filter((mr) => mr.userId !== userId);
  team.invites = (team.invites || []).filter((i) => (i.user?._id || i.user) !== userId);
  recompute(team);
  save();
  res.json({ message: 'Member removed', team: populateTeam(team) });
});

module.exports = {
  getTeams,
  getMine,
  getOne,
  createTeam,
  updateTeam,
  updateMemberRoles,
  adminModerateTeam,
  removeTeam,
  removeMember,
  match,
  analyze,
  invite,
  requestJoin,
  respondInvite,
  populateTeam,
};
