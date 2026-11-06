const mongoose = require('mongoose');
const crypto = require('crypto');

const reviewSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'r-' + crypto.randomBytes(6).toString('hex') },
    reviewer: { type: String, ref: 'User', required: true, index: true },
    reviewee: { type: String, ref: 'User', required: true, index: true },
    team: { type: String, ref: 'Team', index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
    type: { type: String, enum: ['leader_to_member', 'member_to_leader', 'peer'], default: 'peer' },
  },
  { timestamps: true }
);

reviewSchema.index({ reviewee: 1, createdAt: -1 });

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);
