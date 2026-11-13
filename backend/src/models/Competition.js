const mongoose = require('mongoose');
const crypto = require('crypto');

const judgeSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  assignedAt: { type: Date, default: Date.now },
});

const winnerSchema = new mongoose.Schema({
  rank: { type: Number, required: true },
  teamId: { type: String, ref: 'Team', required: true },
  teamName: { type: String, default: '' },
  submissionId: { type: String, ref: 'Submission', default: '' },
  projectTitle: { type: String, default: '' },
  score: { type: Number, default: 0 },
  prize: { type: String, default: '' },
  notes: { type: String, default: '' },
});

const competitionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'comp-' + crypto.randomBytes(5).toString('hex') },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    bannerUrl: { type: String, default: '' },
    rules: { type: String, default: '' },
    eligibility: { type: String, default: 'Open to verified university students and innovators' },
    category: { type: String, default: 'Innovation Challenge', index: true },
    registrationStart: { type: Date },
    registrationEnd: { type: Date },
    startDate: { type: Date },
    endDate: { type: Date },
    teamSizeMin: { type: Number, default: 2, min: 1 },
    teamSizeMax: { type: Number, default: 5, min: 1 },
    status: {
      type: String,
      enum: ['draft', 'published', 'ongoing', 'closed'],
      default: 'published',
      index: true,
    },
    organizer: { type: String, ref: 'User', index: true },
    assignedOrganizers: [{ type: String, ref: 'User' }],
    judges: [judgeSchema],
    resultsPublished: { type: Boolean, default: false },
    winners: [winnerSchema],
    createdBy: { type: String, ref: 'User' },
  },
  { timestamps: true }
);

competitionSchema.index({ status: 1, organizer: 1 });

module.exports = mongoose.models.Competition || mongoose.model('Competition', competitionSchema);

