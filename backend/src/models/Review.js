const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String,
  type: { type: String, enum: ['leader_to_member','member_to_leader','peer'], default: 'peer' },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
