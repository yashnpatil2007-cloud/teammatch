const mongoose = require('mongoose');
const { db } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');
const {
  User,
  Team,
  ProblemStatement,
  Quiz,
  Review,
  Certificate,
  AssessmentResult,
  Task,
  Message,
  Submission,
} = require('../models');

/**
 * Extracts a normalized YYYY-MM-DD string from a date or timestamp
 */
function toDateKey(dateVal) {
  if (!dateVal) return '2025-01-01';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '2025-01-01';
    return d.toISOString().slice(0, 10);
  } catch {
    return '2025-01-01';
  }
}

/**
 * Computes platform statistics derived strictly from actual database records.
 * Supports both native MongoDB collections and dual-mode file store.
 */
async function computeRealStats() {
  const isMongo = mongoose.connection.readyState === 1;

  // 1. Users & Roles
  let allUsers = [];
  if (isMongo && User) {
    allUsers = await User.find({}).lean();
  } else {
    allUsers = db.users || [];
  }

  const roleCounts = {
    admin: allUsers.filter((u) => u.role === 'admin').length,
    organizer: allUsers.filter((u) => u.role === 'organizer').length,
    leader: allUsers.filter((u) => u.role === 'leader').length,
    member: allUsers.filter((u) => u.role === 'member').length,
  };
  const verifiedUsersCount = allUsers.filter((u) => u.isVerified).length;
  const nonAdminUsers = allUsers.filter((u) => u.role !== 'admin');

  // 2. Problems & Categories
  let allProblems = [];
  if (isMongo && ProblemStatement) {
    allProblems = await ProblemStatement.find({}).lean();
  } else {
    allProblems = db.problems || [];
  }

  const categoryCounts = {};
  allProblems.forEach((p) => {
    const cat = p.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  // 3. Teams & Team Sizes
  let allTeams = [];
  if (isMongo && Team) {
    allTeams = await Team.find({}).lean();
  } else {
    allTeams = db.teams || [];
  }

  const teamStatusCounts = {
    recruiting: 0,
    forming: 0,
    submitted: 0,
    complete: 0,
  };
  let totalTeamMembers = 0;
  let totalPendingInvites = 0;
  let totalJoinRequests = 0;

  allTeams.forEach((t) => {
    const st = t.status || 'recruiting';
    teamStatusCounts[st] = (teamStatusCounts[st] || 0) + 1;
    const memberCount = (t.members || []).length;
    totalTeamMembers += memberCount;

    (t.invites || []).forEach((inv) => {
      if (inv.status === 'pending') totalPendingInvites++;
      if (inv.status === 'requested') totalJoinRequests++;
    });
  });

  const avgTeamSize = allTeams.length
    ? Number((totalTeamMembers / allTeams.length).toFixed(1))
    : 0;

  // 4. Skills Breakdown
  const skillCounts = {};
  nonAdminUsers.forEach((u) => {
    (u.skills || []).forEach((s) => {
      const sk = s.name ? s.name.toLowerCase().trim() : '';
      if (sk) skillCounts[sk] = (skillCounts[sk] || 0) + 1;
    });
  });
  const topSkills = Object.entries(skillCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // 5. Assessments
  let allAssessments = [];
  if (isMongo && AssessmentResult) {
    allAssessments = await AssessmentResult.find({}).lean();
  } else {
    allAssessments = db.assessments || [];
  }

  const assessmentTypeCounts = { aptitude: 0, personality: 0, technical: 0 };
  let aptitudeScoreSum = 0;
  let aptitudeCount = 0;
  let technicalScoreSum = 0;
  let technicalCount = 0;

  allAssessments.forEach((a) => {
    if (a.type && assessmentTypeCounts[a.type] !== undefined) {
      assessmentTypeCounts[a.type]++;
    }
    if (a.type === 'aptitude' && typeof a.score === 'number') {
      aptitudeScoreSum += a.score;
      aptitudeCount++;
    }
    if (a.type === 'technical' && typeof a.score === 'number') {
      technicalScoreSum += a.score;
      technicalCount++;
    }
  });

  const avgAptitudeScore = aptitudeCount ? Math.round(aptitudeScoreSum / aptitudeCount) : 0;
  const avgTechnicalScore = technicalCount ? Math.round(technicalScoreSum / technicalCount) : 0;

  // 6. Certificates
  let allCertificates = [];
  if (isMongo && Certificate) {
    allCertificates = await Certificate.find({}).lean();
  } else if (db.certificates && db.certificates.length > 0) {
    allCertificates = db.certificates;
  } else {
    allCertificates = allUsers.reduce((acc, u) => acc.concat(u.certificates || []), []);
  }

  const certStatusCounts = {
    pending: 0,
    under_review: 0,
    verified: 0,
    rejected: 0,
  };
  allCertificates.forEach((c) => {
    const st = c.status || 'pending';
    if (certStatusCounts[st] !== undefined) certStatusCounts[st]++;
  });

  // 7. Submissions & Reviews
  let allSubmissions = [];
  if (isMongo && Submission) {
    allSubmissions = await Submission.find({}).lean();
  } else {
    allSubmissions = db.submissions || [];
  }

  const submissionStatusCounts = {
    draft: 0,
    submitted: 0,
    under_review: 0,
    revisions_requested: 0,
    approved: 0,
  };
  let totalReviewScoreSum = 0;
  let totalReviewScoresCount = 0;

  allSubmissions.forEach((s) => {
    const st = s.status || 'submitted';
    if (submissionStatusCounts[st] !== undefined) submissionStatusCounts[st]++;

    (s.reviews || []).forEach((r) => {
      if (typeof r.score === 'number') {
        totalReviewScoreSum += r.score;
        totalReviewScoresCount++;
      }
    });
  });

  const avgSubmissionScore = totalReviewScoresCount
    ? Math.round(totalReviewScoreSum / totalReviewScoresCount)
    : 0;

  // 8. Collaboration: Tasks & Messages
  let allTasks = [];
  let allMessages = [];
  if (isMongo && Task && Message) {
    [allTasks, allMessages] = await Promise.all([
      Task.find({}).lean(),
      Message.find({}).lean(),
    ]);
  } else {
    allTasks = db.tasks || [];
    allMessages = db.messages || [];
  }

  const taskStatusCounts = {
    toDo: allTasks.filter((t) => t.status === 'To Do').length,
    inProgress: allTasks.filter((t) => t.status === 'In Progress').length,
    completed: allTasks.filter((t) => t.status === 'Completed').length,
  };

  // 9. Real Registration Growth Trends (Past 7 Days)
  // Computed strictly from real user records without synthetic random math
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const growth = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const dayKey = day.toISOString().slice(0, 10);

    // Count new users who registered on this exact date
    const dailyRegistrations = allUsers.filter((u) => toDateKey(u.createdAt) === dayKey).length;

    // Cumulative users registered up to and including this date
    // If a user has no createdAt or was created prior to the 7-day window, they are counted in the baseline
    const cumulativeUsers = allUsers.filter((u) => toDateKey(u.createdAt) <= dayKey).length;

    growth.push({
      name: days[day.getDay()],
      date: dayKey,
      users: dailyRegistrations,
      registered: cumulativeUsers > 0 ? cumulativeUsers : allUsers.length,
    });
  }

  // 10. Platform Reviews
  let allReviews = [];
  if (isMongo && Review) {
    allReviews = await Review.find({}).lean();
  } else {
    allReviews = db.reviews || [];
  }
  const totalReviews = allReviews.length;
  const avgRating = totalReviews
    ? Number((allReviews.reduce((s, r) => s + (r.rating || 0), 0) / totalReviews).toFixed(2))
    : 0;

  let allQuizzes = [];
  if (isMongo && Quiz) {
    allQuizzes = await Quiz.find({}).lean();
  } else {
    allQuizzes = db.quizzes || [];
  }

  return {
    totals: {
      users: nonAdminUsers.length,
      allUsersCount: allUsers.length,
      roles: roleCounts,
      verifiedUsers: verifiedUsersCount,
      problems: allProblems.length,
      teams: allTeams.length,
      activeTeams: allTeams.filter((t) => t.status !== 'complete').length,
      completedTeams: teamStatusCounts.complete,
      avgTeamSize,
      reviews: totalReviews,
      quizzes: allQuizzes.length,
      certificates: allCertificates.length,
      certificatesPending: certStatusCounts.pending,
      registeredParticipants: allProblems.reduce((s, p) => s + (p.registeredCount || 0), 0),
      avgMatch: allTeams.length
        ? Math.round(allTeams.reduce((s, t) => s + (t.matchPercentage || 0), 0) / allTeams.length)
        : 0,
      avgReliability: nonAdminUsers.length
        ? Math.round(nonAdminUsers.reduce((s, u) => s + (u.reliabilityScore || 0), 0) / nonAdminUsers.length)
        : 0,
      avgRating,
      assessmentsTotal: allAssessments.length,
      avgAptitudeScore,
      avgTechnicalScore,
      submissionsTotal: allSubmissions.length,
      avgSubmissionScore,
      tasksTotal: allTasks.length,
      tasksCompleted: taskStatusCounts.completed,
      messagesTotal: allMessages.length,
      pendingInvites: totalPendingInvites,
      pendingJoinRequests: totalJoinRequests,
    },
    roles: roleCounts,
    teamStatus: Object.entries(teamStatusCounts).map(([name, value]) => ({ name, value })),
    categories: Object.entries(categoryCounts).map(([name, value]) => ({ name, value })),
    topSkills,
    assessments: {
      total: allAssessments.length,
      byType: assessmentTypeCounts,
      avgAptitudeScore,
      avgTechnicalScore,
    },
    certificates: certStatusCounts,
    submissions: {
      total: allSubmissions.length,
      byStatus: submissionStatusCounts,
      avgScore: avgSubmissionScore,
      totalReviewRecords: totalReviewScoresCount,
    },
    collaboration: {
      tasksTotal: allTasks.length,
      taskStatus: taskStatusCounts,
      messagesTotal: allMessages.length,
      pendingInvites: totalPendingInvites,
      pendingJoinRequests: totalJoinRequests,
    },
    growth,
    recentProblems: [...allProblems]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5),
  };
}

/**
 * GET /api/stats
 * Public platform statistics (used by Leaderboard, Landing, and general dashboards)
 */
const stats = asyncHandler(async (req, res) => {
  const result = await computeRealStats();
  res.json(result);
});

/**
 * GET /api/stats/admin
 * Comprehensive protected analytics for Administrators & Organizers
 */
const adminAnalytics = asyncHandler(async (req, res) => {
  const result = await computeRealStats();
  res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    analytics: result,
  });
});

module.exports = {
  stats,
  adminAnalytics,
  computeRealStats,
};
