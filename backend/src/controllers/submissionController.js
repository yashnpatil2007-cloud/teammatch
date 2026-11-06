const { db, save, uid, now } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');
const { createNotification } = require('../utils/notify');
const { storageService } = require('../services/storageService');

const findTeam = (id) => db.teams.find((t) => t._id === id);
const findProblem = (id) => db.problems.find((p) => p._id === id);
const findUser = (id) => db.users.find((u) => u._id === id);

/**
 * Validate URL helper
 */
const isValidUrl = (str) => {
  if (!str) return true;
  try {
    const full = str.startsWith('http://') || str.startsWith('https://') ? str : `https://${str}`;
    const url = new URL(full);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    return url.hostname === 'localhost' || url.hostname.includes('.');
  } catch {
    return false;
  }
};

/**
 * Verify team leadership
 */
const isTeamLeader = (team, user) => {
  if (!team || !user) return false;
  return user.role === 'admin' || String(team.leader?._id || team.leader) === String(user._id);
};

/**
 * Verify team view access
 */
const canViewTeamSubmission = (team, user) => {
  if (!team || !user) return false;
  if (user.role === 'admin' || user.role === 'organizer') return true;
  const userId = String(user._id);
  const leaderId = String(team.leader?._id || team.leader);
  if (userId === leaderId) return true;
  return (team.members || []).some((m) => String(m._id || m) === userId);
};

/**
 * POST /api/submissions
 * Team Leader creates draft or submits final project
 */
const submitProject = asyncHandler(async (req, res) => {
  const {
    teamId,
    title,
    description,
    githubUrl,
    demoUrl,
    presentationUrl,
    attachments,
    status = 'submitted',
  } = req.body;

  if (!teamId) return res.status(400).json({ message: 'Team ID is required' });
  const team = findTeam(teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  // Only team leader or admin can finalize/create submission
  if (!isTeamLeader(team, req.user)) {
    return res.status(403).json({ message: 'Only the team leader or admin can submit or manage team projects' });
  }

  const validStatuses = ['draft', 'submitted', 'under_review', 'revisions_requested', 'approved'];
  const targetStatus = validStatuses.includes(status) ? status : 'submitted';

  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'Project title is required' });
  }
  if (!description || !String(description).trim()) {
    return res.status(400).json({ message: 'Project description is required' });
  }

  // Validate URLs if provided
  if (githubUrl && !isValidUrl(githubUrl)) {
    return res.status(400).json({ message: 'Invalid GitHub repository URL' });
  }
  if (demoUrl && !isValidUrl(demoUrl)) {
    return res.status(400).json({ message: 'Invalid live demo URL' });
  }
  if (presentationUrl && !isValidUrl(presentationUrl)) {
    return res.status(400).json({ message: 'Invalid presentation or video URL' });
  }

  const problem = findProblem(team.problem);

  db.submissions = db.submissions || [];
  let existingSubmission = db.submissions.find((s) => s.team === team._id);

  if (existingSubmission) {
    existingSubmission.title = String(title).trim();
    existingSubmission.description = String(description).trim();
    existingSubmission.githubUrl = githubUrl ? String(githubUrl).trim() : '';
    existingSubmission.demoUrl = demoUrl ? String(demoUrl).trim() : '';
    existingSubmission.presentationUrl = presentationUrl ? String(presentationUrl).trim() : '';
    if (Array.isArray(attachments)) existingSubmission.attachments = attachments;
    existingSubmission.status = targetStatus;
    existingSubmission.updatedAt = now();
  } else {
    existingSubmission = {
      _id: 'sub-' + uid().slice(0, 8),
      team: team._id,
      problem: problem ? problem._id : team.problem,
      submittedBy: req.user._id,
      title: String(title).trim(),
      description: String(description).trim(),
      githubUrl: githubUrl ? String(githubUrl).trim() : '',
      demoUrl: demoUrl ? String(demoUrl).trim() : '',
      presentationUrl: presentationUrl ? String(presentationUrl).trim() : '',
      attachments: Array.isArray(attachments) ? attachments : [],
      status: targetStatus,
      reviews: [],
      createdAt: now(),
      updatedAt: now(),
    };
    db.submissions.unshift(existingSubmission);
  }

  if (targetStatus === 'submitted') {
    team.status = 'submitted';

    // Log to team activity timeline
    team.activityTimeline = team.activityTimeline || [];
    team.activityTimeline.unshift({
      _id: 'act-' + uid().slice(0, 8),
      action: 'project_submitted',
      actor: req.user._id,
      actorName: req.user.name,
      details: `Submitted project "${existingSubmission.title}" for review`,
      timestamp: now(),
    });

    // Notify all other team members
    (team.members || []).forEach((m) => {
      const mid = String(m._id || m);
      if (mid !== req.user._id) {
        createNotification({
          recipient: mid,
          sender: req.user._id,
          type: 'submission_status',
          title: 'Project Submitted',
          message: `${req.user.name} submitted the team project "${existingSubmission.title}" for review.`,
          link: `/dashboard/teams/${team._id}/workspace`,
        });
      }
    });

    // Notify organizers and admins
    db.users
      .filter((u) => u.role === 'organizer' || u.role === 'admin')
      .forEach((org) => {
        createNotification({
          recipient: org._id,
          sender: req.user._id,
          type: 'submission_status',
          title: 'New Project Submission',
          message: `Team "${team.name}" submitted project "${existingSubmission.title}" for problem "${problem?.title || 'Challenge'}".`,
          link: '/dashboard/organizer',
          dedupKey: `new_sub_${existingSubmission._id}_${org._id}`,
        });
      });
  }

  save();
  res.status(201).json(existingSubmission);
});

/**
 * GET /api/submissions/team/:teamId
 * Fetch submission for specific team
 */
const getSubmissionByTeam = asyncHandler(async (req, res) => {
  const team = findTeam(req.params.teamId);
  if (!team) return res.status(404).json({ message: 'Team not found' });

  if (!canViewTeamSubmission(team, req.user)) {
    return res.status(403).json({ message: 'Access denied: You are not authorized to view this submission' });
  }

  db.submissions = db.submissions || [];
  const submission = db.submissions.find((s) => s.team === team._id);

  res.json({
    submission: submission || null,
    team: {
      _id: team._id,
      name: team.name,
      status: team.status,
      leader: team.leader,
    },
    problem: findProblem(team.problem),
  });
});

/**
 * GET /api/submissions
 * Organizers & Admins list all submissions
 */
const getAllSubmissions = asyncHandler(async (req, res) => {
  const { problemId, status } = req.query;
  db.submissions = db.submissions || [];

  let list = db.submissions.map((s) => {
    const team = findTeam(s.team);
    const problem = findProblem(s.problem);
    const user = findUser(s.submittedBy);
    return {
      ...s,
      teamName: team ? team.name : 'Unknown Team',
      teamMembersCount: team ? (team.members || []).length : 0,
      problemTitle: problem ? problem.title : 'General Problem',
      problemCategory: problem ? problem.category : 'General',
      submittedByName: user ? user.name : 'Student',
    };
  });

  if (problemId) {
    list = list.filter((s) => s.problem === problemId);
  }
  if (status) {
    list = list.filter((s) => s.status === status);
  }

  list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  res.json(list);
});

/**
 * GET /api/submissions/:id
 * Get single submission details
 */
const getOneSubmission = asyncHandler(async (req, res) => {
  db.submissions = db.submissions || [];
  const submission = db.submissions.find((s) => s._id === req.params.id);
  if (!submission) return res.status(404).json({ message: 'Submission not found' });

  const team = findTeam(submission.team);
  if (!canViewTeamSubmission(team, req.user)) {
    return res.status(403).json({ message: 'Access denied: You cannot view this submission' });
  }

  res.json({
    ...submission,
    team,
    problem: findProblem(submission.problem),
  });
});

/**
 * POST /api/submissions/:id/review
 * Organizer/Admin submits score, feedback, revision requests, or approval
 */
const reviewSubmission = asyncHandler(async (req, res) => {
  db.submissions = db.submissions || [];
  const submission = db.submissions.find((s) => s._id === req.params.id);
  if (!submission) return res.status(404).json({ message: 'Submission not found' });

  const { status, score, feedback, revisionsRequired } = req.body;

  const validStatuses = ['under_review', 'revisions_requested', 'approved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid review status. Must be under_review, revisions_requested, or approved' });
  }

  if (!feedback || !String(feedback).trim()) {
    return res.status(400).json({ message: 'Written feedback is required for every review' });
  }

  submission.status = status;
  submission.reviews = submission.reviews || [];

  const reviewRecord = {
    _id: 'rev-' + uid().slice(0, 8),
    reviewer: req.user._id,
    reviewerName: req.user.name,
    score: score !== undefined ? Math.max(0, Math.min(100, Number(score))) : null,
    feedback: String(feedback).trim(),
    revisionsRequired: Array.isArray(revisionsRequired) ? revisionsRequired : [],
    reviewedAt: now(),
  };

  submission.reviews.unshift(reviewRecord);
  submission.updatedAt = now();

  const team = findTeam(submission.team);
  if (team) {
    if (status === 'approved') team.status = 'complete';

    // Log to team activity timeline
    team.activityTimeline = team.activityTimeline || [];
    team.activityTimeline.unshift({
      _id: 'act-' + uid().slice(0, 8),
      action: 'submission_reviewed',
      actor: req.user._id,
      actorName: req.user.name,
      details: `Project review completed (${status})${reviewRecord.score !== null ? ` — Score: ${reviewRecord.score}/100` : ''}`,
      timestamp: now(),
    });

    // Notify leader and all members with clear explanation
    const recipients = [String(team.leader?._id || team.leader), ...(team.members || []).map((m) => String(m._id || m))];
    const uniqueRecipients = [...new Set(recipients)];

    const notificationTitles = {
      approved: 'Project Approved 🎉',
      revisions_requested: 'Revisions Requested ⚠️',
      under_review: 'Project Under Review 🔍',
    };

    const notificationMessages = {
      approved: `Congratulations! Your project "${submission.title}" was approved by ${req.user.name}${
        reviewRecord.score !== null ? ` with a score of ${reviewRecord.score}/100` : ''
      }.`,
      revisions_requested: `Updates requested for "${submission.title}": ${reviewRecord.feedback}`,
      under_review: `Organizer ${req.user.name} has started reviewing your submission "${submission.title}".`,
    };

    uniqueRecipients.forEach((recId) => {
      createNotification({
        recipient: recId,
        sender: req.user._id,
        type: status === 'approved' ? 'submission_status' : 'review_received',
        title: notificationTitles[status],
        message: notificationMessages[status],
        link: `/dashboard/teams/${team._id}/workspace`,
      });
    });
  }

  save();
  res.json({
    message: 'Submission review recorded successfully',
    submission,
  });
});

/**
 * POST /api/submissions/upload
 * Multipart file upload for supporting documents, presentations, archives, screenshots
 */
const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const processed = await storageService.processUpload(req.file, 'submissions');
  res.status(201).json({
    message: 'File uploaded successfully',
    file: {
      name: processed.name,
      url: processed.url,
      fileType: processed.fileType,
      size: processed.size,
      provider: processed.provider,
    },
  });
});

module.exports = {
  submitProject,
  getSubmissionByTeam,
  getAllSubmissions,
  getOneSubmission,
  reviewSubmission,
  uploadAttachment,
};
