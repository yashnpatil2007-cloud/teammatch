const { db, save, uid, now } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');
const { createNotification } = require('../utils/notify');

const findTeam = (id) => db.teams.find((t) => t._id === id);
const findUser = (id) => db.users.find((u) => u._id === id);
const findProblem = (id) => db.problems.find((p) => p._id === id);

/**
 * Verifies if user has permission to access team workspace.
 * Members, Leaders, Organizers, and Admins can view.
 */
const verifyTeamAccess = (team, user) => {
  if (!team || !user) return false;
  if (user.role === 'admin' || user.role === 'organizer') return true;
  const userId = String(user._id);
  const leaderId = String(team.leader?._id || team.leader);
  if (userId === leaderId) return true;
  return (team.members || []).some((m) => String(m._id || m) === userId);
};

/**
 * Verifies if user is an active team member or leader (can create/edit tasks/messages).
 */
const verifyTeamMember = (team, user) => {
  if (!team || !user) return false;
  if (user.role === 'admin') return true;
  const userId = String(user._id);
  const leaderId = String(team.leader?._id || team.leader);
  if (userId === leaderId) return true;
  return (team.members || []).some((m) => String(m._id || m) === userId);
};

const briefUser = (id) => {
  const u = findUser(id);
  if (!u) return { _id: id, name: 'Unknown User' };
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar || u.profilePicture,
    skills: u.skills || [],
    personality: u.personality || null,
  };
};

/**
 * Log action to team activity timeline
 */
const logActivity = (team, { action, actor, actorName, details = '' }) => {
  team.activityTimeline = team.activityTimeline || [];
  team.activityTimeline.unshift({
    _id: 'act-' + uid().slice(0, 8),
    action,
    actor: String(actor),
    actorName: actorName || 'Team Member',
    details,
    timestamp: now(),
  });
  // Cap at 60 entries
  if (team.activityTimeline.length > 60) {
    team.activityTimeline = team.activityTimeline.slice(0, 60);
  }
};

/**
 * GET /api/teams/:teamId/workspace
 * Returns full workspace state for authorized users
 */
const getWorkspace = asyncHandler(async (req, res) => {
  const team = findTeam(req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  if (!verifyTeamAccess(team, req.user)) {
    return res.status(403).json({ message: 'Access denied: You are not authorized to view this team workspace' });
  }

  const problem = findProblem(team.problem);
  const leader = briefUser(team.leader);
  const members = (team.members || []).map(briefUser);

  db.tasks = db.tasks || [];
  const teamTasks = db.tasks.filter((t) => t.team === team._id);

  db.messages = db.messages || [];
  const teamMessages = db.messages.filter((m) => m.team === team._id).slice(-60);

  // Calculate task progress metrics
  const totalTasks = teamTasks.length;
  const completedTasks = teamTasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = teamTasks.filter((t) => t.status === 'In Progress').length;
  const todoTasks = teamTasks.filter((t) => t.status === 'To Do').length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  res.json({
    team: {
      _id: team._id,
      name: team.name,
      status: team.status,
      coverage: team.coverage || 0,
      balanceScore: team.balanceScore || 0,
      leader,
      members,
      milestones: team.milestones || [],
      resources: team.resources || [],
      activityTimeline: (team.activityTimeline || []).slice(0, 40),
    },
    problem: problem
      ? {
          _id: problem._id,
          title: problem.title,
          description: problem.description,
          category: problem.category,
          difficulty: problem.difficulty,
          deadline: problem.deadline,
          requiredSkills: problem.requiredSkills || [],
          teamSize: problem.teamSize,
        }
      : null,
    tasks: teamTasks,
    messages: teamMessages,
    metrics: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate,
    },
    permissions: {
      isLeader: String(team.leader?._id || team.leader) === req.user._id,
      canEdit: verifyTeamMember(team, req.user),
    },
  });
});

/**
 * POST /api/teams/:teamId/tasks
 * Create task inside team workspace
 */
const createTask = asyncHandler(async (req, res) => {
  const team = findTeam(req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (!verifyTeamMember(team, req.user)) {
    return res.status(403).json({ message: 'Only team members and leaders can create tasks' });
  }

  const { title, description, priority, status, dueDate, assignee } = req.body;
  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'Task title is required' });
  }

  let assigneeUser = null;
  if (assignee) {
    assigneeUser = findUser(assignee);
    if (!assigneeUser) return res.status(404).json({ message: 'Assignee not found' });
  }

  const newTask = {
    _id: 'tsk-' + uid().slice(0, 8),
    team: team._id,
    title: String(title).trim(),
    description: description ? String(description).trim() : '',
    priority: ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium',
    status: ['To Do', 'In Progress', 'Completed'].includes(status) ? status : 'To Do',
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    assignee: assigneeUser ? assigneeUser._id : null,
    assigneeName: assigneeUser ? assigneeUser.name : 'Unassigned',
    createdBy: req.user._id,
    createdAt: now(),
    updatedAt: now(),
  };

  db.tasks = db.tasks || [];
  db.tasks.unshift(newTask);

  logActivity(team, {
    action: 'task_created',
    actor: req.user._id,
    actorName: req.user.name,
    details: `Created task "${newTask.title}"${assigneeUser ? ` assigned to ${assigneeUser.name}` : ''}`,
  });

  save();

  // Send notification to assignee if assigned to someone else
  if (assigneeUser && assigneeUser._id !== req.user._id) {
    createNotification({
      recipient: assigneeUser._id,
      sender: req.user._id,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `${req.user.name} assigned you the task "${newTask.title}" in team "${team.name}".`,
      link: `/dashboard/teams/${team._id}/workspace`,
    });
  }

  res.status(201).json(newTask);
});

/**
 * PUT /api/teams/:teamId/tasks/:taskId
 * Update task status, priority, or assignee
 */
const updateTask = asyncHandler(async (req, res) => {
  const team = findTeam(req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (!verifyTeamMember(team, req.user)) {
    return res.status(403).json({ message: 'Only team members can update tasks' });
  }

  db.tasks = db.tasks || [];
  const task = db.tasks.find((t) => t._id === req.params.taskId && t.team === team._id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const { title, description, priority, status, dueDate, assignee } = req.body;

  if (title !== undefined && String(title).trim()) task.title = String(title).trim();
  if (description !== undefined) task.description = String(description).trim();
  if (priority && ['Low', 'Medium', 'High'].includes(priority)) task.priority = priority;

  const oldStatus = task.status;
  if (status && ['To Do', 'In Progress', 'Completed'].includes(status)) {
    task.status = status;
    if (oldStatus !== status) {
      logActivity(team, {
        action: 'task_status_changed',
        actor: req.user._id,
        actorName: req.user.name,
        details: `Moved "${task.title}" from ${oldStatus} to ${status}`,
      });
    }
  }

  if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate).toISOString() : null;

  if (assignee !== undefined) {
    if (assignee) {
      const u = findUser(assignee);
      if (u) {
        task.assignee = u._id;
        task.assigneeName = u.name;
        if (u._id !== req.user._id) {
          createNotification({
            recipient: u._id,
            sender: req.user._id,
            type: 'task_assigned',
            title: 'Task Assignment Updated',
            message: `${req.user.name} assigned you the task "${task.title}" in "${team.name}".`,
            link: `/dashboard/teams/${team._id}/workspace`,
          });
        }
      }
    } else {
      task.assignee = null;
      task.assigneeName = 'Unassigned';
    }
  }

  task.updatedAt = now();
  save();

  res.json(task);
});

/**
 * DELETE /api/teams/:teamId/tasks/:taskId
 * Delete task (creator, leader or admin)
 */
const deleteTask = asyncHandler(async (req, res) => {
  const team = findTeam(req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  db.tasks = db.tasks || [];
  const idx = db.tasks.findIndex((t) => t._id === req.params.taskId && t.team === team._id);
  if (idx === -1) return res.status(404).json({ message: 'Task not found' });

  const task = db.tasks[idx];
  const isLeader = String(team.leader?._id || team.leader) === req.user._id;
  const isCreator = task.createdBy === req.user._id;

  if (!isLeader && !isCreator && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the task creator, team leader, or admin can delete this task' });
  }

  db.tasks.splice(idx, 1);
  logActivity(team, {
    action: 'task_deleted',
    actor: req.user._id,
    actorName: req.user.name,
    details: `Deleted task "${task.title}"`,
  });

  save();
  res.json({ message: 'Task deleted successfully', taskId: req.params.taskId });
});

/**
 * POST /api/teams/:teamId/milestones
 * Add milestone (leader or admin)
 */
const addMilestone = asyncHandler(async (req, res) => {
  const team = findTeam(req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  const isLeader = String(team.leader?._id || team.leader) === req.user._id;
  if (!isLeader && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the team leader or admin can manage milestones' });
  }

  const { title, deadline, status } = req.body;
  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'Milestone title is required' });
  }

  team.milestones = team.milestones || [];
  const milestone = {
    _id: 'ms-' + uid().slice(0, 8),
    title: String(title).trim(),
    deadline: deadline ? new Date(deadline).toISOString() : null,
    status: ['pending', 'in_progress', 'completed'].includes(status) ? status : 'pending',
    createdAt: now(),
  };

  team.milestones.push(milestone);
  logActivity(team, {
    action: 'milestone_created',
    actor: req.user._id,
    actorName: req.user.name,
    details: `Created project milestone "${milestone.title}"`,
  });

  save();
  res.status(201).json(milestone);
});

/**
 * PUT /api/teams/:teamId/milestones/:milestoneId
 * Update milestone status (leader or admin)
 */
const updateMilestone = asyncHandler(async (req, res) => {
  const team = findTeam(req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  const isLeader = String(team.leader?._id || team.leader) === req.user._id;
  if (!isLeader && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the team leader or admin can manage milestones' });
  }

  team.milestones = team.milestones || [];
  const ms = team.milestones.find((m) => m._id === req.params.milestoneId);
  if (!ms) return res.status(404).json({ message: 'Milestone not found' });

  const { title, deadline, status } = req.body;
  if (title !== undefined && String(title).trim()) ms.title = String(title).trim();
  if (deadline !== undefined) ms.deadline = deadline ? new Date(deadline).toISOString() : null;
  if (status && ['pending', 'in_progress', 'completed'].includes(status)) {
    ms.status = status;
    logActivity(team, {
      action: 'milestone_status_changed',
      actor: req.user._id,
      actorName: req.user.name,
      details: `Updated milestone "${ms.title}" to ${status}`,
    });
  }

  save();
  res.json(ms);
});

/**
 * POST /api/teams/:teamId/resources
 * Add shared document/link
 */
const addResource = asyncHandler(async (req, res) => {
  const team = findTeam(req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (!verifyTeamMember(team, req.user)) {
    return res.status(403).json({ message: 'Only team members can add project resources' });
  }

  const { title, url, type } = req.body;
  if (!title || !url) {
    return res.status(400).json({ message: 'Resource title and valid URL are required' });
  }

  team.resources = team.resources || [];
  const resource = {
    _id: 'res-' + uid().slice(0, 8),
    title: String(title).trim(),
    url: String(url).trim(),
    type: ['doc', 'figma', 'github', 'drive', 'other'].includes(type) ? type : 'doc',
    addedBy: req.user._id,
    addedAt: now(),
  };

  team.resources.push(resource);
  logActivity(team, {
    action: 'resource_added',
    actor: req.user._id,
    actorName: req.user.name,
    details: `Shared resource: "${resource.title}" (${resource.type})`,
  });

  save();
  res.status(201).json(resource);
});

/**
 * GET /api/teams/:teamId/messages
 * Get team communication feed
 */
const getMessages = asyncHandler(async (req, res) => {
  const team = findTeam(req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (!verifyTeamAccess(team, req.user)) {
    return res.status(403).json({ message: 'Access denied: You cannot view messages for this team' });
  }

  db.messages = db.messages || [];
  const messages = db.messages
    .filter((m) => m.team === team._id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-100);

  res.json(messages);
});

/**
 * POST /api/teams/:teamId/messages
 * Send message to team discussion feed
 */
const postMessage = asyncHandler(async (req, res) => {
  const team = findTeam(req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });
  if (!verifyTeamMember(team, req.user)) {
    return res.status(403).json({ message: 'Only team members can participate in team discussion' });
  }

  const { text } = req.body;
  if (!text || !String(text).trim()) {
    return res.status(400).json({ message: 'Message text cannot be empty' });
  }

  const newMsg = {
    _id: 'msg-' + uid().slice(0, 8),
    team: team._id,
    sender: req.user._id,
    senderName: req.user.name,
    senderAvatar: req.user.avatar || req.user.profilePicture || '',
    senderRole: req.user.role,
    text: String(text).trim(),
    createdAt: now(),
  };

  db.messages = db.messages || [];
  db.messages.push(newMsg);
  // Cap at 200 messages per team in file store to avoid unbounded storage
  const teamMsgCount = db.messages.filter((m) => m.team === team._id).length;
  if (teamMsgCount > 200) {
    const oldestIdx = db.messages.findIndex((m) => m.team === team._id);
    if (oldestIdx !== -1) db.messages.splice(oldestIdx, 1);
  }

  save();
  res.status(201).json(newMsg);
});

module.exports = {
  getWorkspace,
  createTask,
  updateTask,
  deleteTask,
  addMilestone,
  updateMilestone,
  addResource,
  getMessages,
  postMessage,
};

