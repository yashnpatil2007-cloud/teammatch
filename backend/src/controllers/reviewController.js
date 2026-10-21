const { db, save, uid, now } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');

const briefUser = (id) => {
  const u = db.users.find((x) => x._id === id);
  return u ? { _id: u._id, name: u.name, avatar: u.avatar, role: u.role } : id;
};

const populate = (r) => ({ ...r, reviewer: briefUser(r.reviewer) });

const create = asyncHandler(async (req, res) => {
  const { reviewee, rating, comment, type, team } = req.body;
  if (!reviewee || !rating) return res.status(400).json({ message: 'reviewee and rating are required' });
  if (rating < 1 || rating > 5) return res.status(400).json({ message: 'rating must be between 1 and 5' });
  if (!db.users.find((u) => u._id === reviewee)) return res.status(404).json({ message: 'Reviewee not found' });

  const review = {
    _id: 'r-' + uid().slice(0, 10),
    reviewer: req.user._id,
    reviewee,
    team: team || null,
    rating: Number(rating),
    comment: comment || '',
    type: type || 'peer',
    createdAt: now(),
  };
  db.reviews.push(review);

  const target = db.users.find((u) => u._id === reviewee);
  if (target) {
    const all = db.reviews.filter((r) => r.reviewee === reviewee);
    target.totalReviews = all.length;
    target.averageRating = Number((all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1));
    const delta = review.rating >= 4 ? 1 : review.rating <= 2 ? -2 : 0;
    target.reliabilityScore = Math.max(0, Math.min(100, (target.reliabilityScore || 75) + delta));
  }
  save();
  res.status(201).json(populate(review));
});

const listByUser = asyncHandler(async (req, res) => {
  const list = db.reviews
    .filter((r) => r.reviewee === req.params.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list.map(populate));
});

const listAll = asyncHandler(async (req, res) => {
  const list = [...db.reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list.map(populate));
});

module.exports = { create, listByUser, listAll };
