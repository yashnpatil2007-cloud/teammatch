const { db, save, uid, now } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');
const { teamCoverage, calculateMatch } = require('../services/matchingEngine');

const findUser = (id) => db.users.find((u) => u._id === id);
const findProblem = (id) => db.problems.find((p) => p._id === id);

const briefUser = (id) => {
  const u = findUser(id);
  if (!u) return id;
  return { _id: u._id, name: u.name, role: u.role, avatar: u.avatar, skills: u.skills, reliabilityScore: u.reliabilityScore };
};

const populateTeam = (t) => {
  if (!t) return t;
  const problem = findProblem(t.problem);
  return {
    ...t,
    problem: problem ? { _id: problem._id, title: problem.title, category: problem.category, requiredSkills: problem.requiredSkills, requiredRoles: problem.requiredRoles, teamSize: problem.teamSize } : t.problem,
    leader: briefUser(t.leader),
    members: (t.members || []).map(briefUser),
    invites: (t.invites || []).map((inv) => ({ ...inv, user: briefUser(inv.user) })),
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
  const leader = findUser(team.leader);
  const avg = memberObjs.length
    ? Math.round(memberObjs.reduce((sum, m) => sum + calculateMatch(problem.requiredSkills, m.skills || []).pct, 0) / memberObjs.length)
    : 0;
  team.matchPercentage = avg;
  team.status = team.coverage >= 95 ? 'complete' : 'forming';
  team.leaderName = leader ? leader.name : undefined;
  return team;
};

const getTeams = asyncHandler(async (req, res) => {
  const { problemId, status } = req.query;
  let list = [...db.teams];
  if (problemId) list = list.filter((t) => t.problem === problemId);
  if (status) list = list.filter((t) => t.status === status);
  res.json(list.map(populateTeam));
});

const getMine = asyncHandler(async (req, res) => {
  const me = req.user._id;
  const list = db.teams.filter((t) => (t.members || []).includes(me) || t.leader === me || (t.invites || []).some((i) => i.user === me));
  res.json(list.map(populateTeam));
});

const getOne = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  res.json(populateTeam(team));
});

const createTeam = asyncHandler(async (req, res) => {
  const { name, problemId } = req.body;
  const problem = findProblem(problemId);
  if (!problem) return res.status(400).json({ message: 'A valid problemId is required' });

  const leaderId = req.user.role === 'leader' ? req.user._id : db.users.find((u) => u.role === 'leader')?._id || req.user._id;
  const team = {
    _id: 't-' + uid().slice(0, 10),
    name: name || `Team ${db.teams.length + 1}`,
    problem: problemId,
    leader: leaderId,
    members: [leaderId],
    invites: [],
    coverage: 0,
    balanceScore: 0,
    matchPercentage: 0,
    missingSkills: problem.requiredSkills.map((s) => s.name),
    missingRoles: problem.requiredRoles || [],
    status: 'forming',
    createdAt: now(),
  };
  recompute(team);
  db.teams.push(team);
  save();
  res.status(201).json(populateTeam(team));
});

const match = asyncHandler(async (req, res) => {
  const { problemId } = req.query;
  const problem = findProblem(problemId) || db.problems[0];
  if (!problem) return res.status(404).json({ message: 'No problem statements available' });

  const pool = db.users.filter((u) => ['member', 'leader'].includes(u.role));
  const recommendations = pool
    .map((u) => {
      const m = calculateMatch(problem.requiredSkills, u.skills || []);
      const roleFit = (problem.requiredRoles || []).filter((r) =>
        (u.skills || []).some((s) => r.toLowerCase().includes(s.name.toLowerCase()))
      );
      return {
        user: { _id: u._id, name: u.name, role: u.role, avatar: u.avatar, skills: u.skills, github: u.github },
        match: m.pct,
        missing: m.missing,
        roleFit,
        reliabilityScore: u.reliabilityScore,
      };
    })
    .sort((a, b) => b.match - a.match || b.reliabilityScore - a.reliabilityScore);

  res.json({ problem, recommendations });
});

const analyze = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  const problem = findProblem(team.problem);
  const members = (team.members || []).map(findUser).filter(Boolean);
  const analysis = teamCoverage(problem ? problem.requiredSkills : [], members);
  res.json({ team: populateTeam(team), problem, ...analysis });
});

const invite = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  const { userId } = req.body;
  if (!findUser(userId)) return res.status(404).json({ message: 'User not found' });
  if ((team.members || []).includes(userId)) return res.status(400).json({ message: 'User is already a member' });
  if ((team.invites || []).some((i) => i.user === userId && i.status === 'pending')) {
    return res.status(400).json({ message: 'Invite already pending' });
  }
  team.invites = team.invites || [];
  team.invites.push({ user: userId, status: 'pending', invitedAt: now() });
  save();
  res.json({ message: 'Invite sent', team: populateTeam(team) });
});

const respondInvite = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  const { userId, action } = req.body;
  const invite = (team.invites || []).find((i) => i.user === userId);
  if (!invite) return res.status(404).json({ message: 'Invite not found' });
  if (action === 'accept') {
    invite.status = 'accepted';
    if (!team.members.includes(userId)) team.members.push(userId);
  } else {
    invite.status = 'rejected';
  }
  recompute(team);
  save();
  res.json({ message: `Invite ${action}ed`, team: populateTeam(team) });
});

const canManage = (team, user) =>
  user.role === 'admin' || user.role === 'organizer' || String(team.leader?._id || team.leader) === user._id;

const updateTeam = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (!canManage(team, req.user)) return res.status(403).json({ message: 'Only the team leader can edit this team' });
  const { name, status, problemId } = req.body;
  if (name !== undefined && String(name).trim()) team.name = String(name).trim();
  if (status !== undefined) team.status = status;
  if (problemId !== undefined && findProblem(problemId)) {
    team.problem = problemId;
    recompute(team);
  }
  team.updatedAt = now();
  save();
  res.json(populateTeam(team));
});

const removeTeam = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (!canManage(team, req.user)) return res.status(403).json({ message: 'Only the team leader can delete this team' });
  const idx = db.teams.indexOf(team);
  db.teams.splice(idx, 1);
  save();
  res.json({ message: 'Team removed' });
});

const removeMember = asyncHandler(async (req, res) => {
  const team = db.teams.find((t) => t._id === req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  const { userId } = req.body;
  const isSelf = userId === req.user._id;
  if (!isSelf && !canManage(team, req.user)) return res.status(403).json({ message: 'Not allowed' });
  if (String(team.leader?._id || team.leader) === userId) {
    return res.status(400).json({ message: 'The leader cannot be removed. Delete the team instead.' });
  }
  team.members = (team.members || []).filter((m) => m !== userId);
  team.invites = (team.invites || []).filter((i) => i.user !== userId);
  recompute(team);
  save();
  res.json({ message: 'Member removed', team: populateTeam(team) });
});

module.exports = { getTeams, getMine, getOne, createTeam, updateTeam, removeTeam, removeMember, match, analyze, invite, respondInvite, populateTeam };
