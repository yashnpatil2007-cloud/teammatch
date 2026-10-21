const { db } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');

const stats = asyncHandler(async (req, res) => {
  const users = db.users.filter((u) => u.role !== 'admin');
  const categoryCounts = {};
  db.problems.forEach((p) => { categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1; });

  const statusCounts = { complete: 0, forming: 0, submitted: 0 };
  db.teams.forEach((t) => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });

  const skillCounts = {};
  users.forEach((u) => (u.skills || []).forEach((s) => { skillCounts[s.name] = (skillCounts[s.name] || 0) + 1; }));
  const topSkills = Object.entries(skillCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const growth = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    growth.push({
      name: days[day.getDay()],
      date: key,
      users: users.filter((u) => (u.createdAt || '').slice(0, 10) === key).length,
      registered: 60 + ((day.getDay() * 37) % 220),
    });
  }

  const totalReviews = db.reviews.length;
  const avgRating = totalReviews
    ? Number((db.reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(2))
    : 0;

  res.json({
    totals: {
      users: users.length,
      problems: db.problems.length,
      teams: db.teams.length,
      reviews: totalReviews,
      quizzes: db.quizzes.length,
      certificates: users.reduce((s, u) => s + (u.certificates ? u.certificates.length : 0), 0),
      registeredParticipants: db.problems.reduce((s, p) => s + (p.registeredCount || 0), 0),
      avgMatch: db.teams.length ? Math.round(db.teams.reduce((s, t) => s + (t.matchPercentage || 0), 0) / db.teams.length) : 0,
      avgReliability: users.length ? Math.round(users.reduce((s, u) => s + (u.reliabilityScore || 0), 0) / users.length) : 0,
      avgRating,
    },
    categories: Object.entries(categoryCounts).map(([name, value]) => ({ name, value })),
    teamStatus: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    topSkills,
    growth,
    recentProblems: [...db.problems].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5),
  });
});

module.exports = { stats };
