const mongoose = require('mongoose');
const crypto = require('crypto');

const inviteSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'inv-' + crypto.randomBytes(4).toString('hex') },
  user: { type: String, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'requested'], default: 'pending' },
  type: { type: String, enum: ['invite', 'join_request'], default: 'invite' },
  invitedAt: { type: Date, default: Date.now },
});

const milestoneSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'ms-' + crypto.randomBytes(4).toString('hex') },
  title: { type: String, required: true, trim: true },
  deadline: { type: Date },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const resourceSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'res-' + crypto.randomBytes(4).toString('hex') },
  title: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  type: { type: String, enum: ['doc', 'figma', 'github', 'drive', 'other'], default: 'doc' },
  addedBy: { type: String, ref: 'User' },
  addedAt: { type: Date, default: Date.now },
});

const activitySchema = new mongoose.Schema({
  _id: { type: String, default: () => 'act-' + crypto.randomBytes(4).toString('hex') },
  action: { type: String, required: true },
  actor: { type: String, ref: 'User' },
  actorName: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  details: { type: String, default: '' },
});

const teamSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 't-' + crypto.randomBytes(6).toString('hex') },
    name: { type: String, required: true, trim: true },
    problem: { type: String, ref: 'ProblemStatement', required: true, index: true },
    leader: { type: String, ref: 'User', required: true, index: true },
    members: [{ type: String, ref: 'User' }],
    invites: [inviteSchema],
    coverage: { type: Number, default: 0 },
    balanceScore: { type: Number, default: 0 },
    matchPercentage: { type: Number, default: 0 },
    missingSkills: [String],
    missingRoles: [String],
    status: { type: String, enum: ['forming', 'complete', 'submitted'], default: 'forming', index: true },
    milestones: [milestoneSchema],
    resources: [resourceSchema],
    activityTimeline: [activitySchema], // Capped at recent events
  },
  { timestamps: true }
);

teamSchema.index({ problem: 1, status: 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ members: 1 });

module.exports = mongoose.models.Team || mongoose.model('Team', teamSchema);
