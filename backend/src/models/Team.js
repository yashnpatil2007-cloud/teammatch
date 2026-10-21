const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'ProblemStatement' },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  invites: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, status: { type: String, enum: ['pending','accepted','rejected'], default: 'pending' } }],
  coverage: { type: Number, default: 0 },
  balanceScore: { type: Number, default: 0 },
  matchPercentage: { type: Number, default: 0 },
  missingSkills: [String],
  missingRoles: [String],
  status: { type: String, enum: ['forming','complete','submitted'], default: 'forming' },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
