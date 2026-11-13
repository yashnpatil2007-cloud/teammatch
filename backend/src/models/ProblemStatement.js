const mongoose = require('mongoose');
const crypto = require('crypto');

const requiredSkillSchema = new mongoose.Schema({
  name: { type: String, required: true, lowercase: true, trim: true },
  weight: { type: Number, default: 5 },
  level: { type: Number, default: 5 },
});

const problemSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'p-' + crypto.randomBytes(6).toString('hex') },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    category: {
      type: String,
      enum: ['AI/ML', 'Web3', 'HealthTech', 'FinTech', 'EdTech', 'IoT', 'Open'],
      default: 'Open',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
      index: true,
    },
    organizer: { type: String, ref: 'User', index: true },
    competitionId: { type: String, ref: 'Competition', index: true },
    evaluationCriteria: { type: String, default: '' },
    submissionGuidelines: { type: String, default: '' },
    requiredSkills: [requiredSkillSchema],
    requiredRoles: [String],
    difficultyScore: { type: Number, min: 1, max: 10, default: 5 },
    teamSize: {
      min: { type: Number, default: 2 },
      max: { type: Number, default: 5 },
    },
    prize: { type: String, default: '₹1L' },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'published',
      index: true,
    },
    registeredCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

problemSchema.index({ category: 1, difficulty: 1, status: 1 });

module.exports = mongoose.models.ProblemStatement || mongoose.model('ProblemStatement', problemSchema);
