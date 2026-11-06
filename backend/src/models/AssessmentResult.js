const mongoose = require('mongoose');
const crypto = require('crypto');

const assessmentResultSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'ar-' + crypto.randomBytes(6).toString('hex') },
    userId: { type: String, ref: 'User', required: true, index: true },
    assessmentType: {
      type: String,
      enum: ['technical', 'aptitude', 'personality', 'domain'],
      required: true,
      index: true,
    },
    skillOrDomain: { type: String, default: '' },
    score: { type: Number, min: 0, max: 100 },
    level: { type: Number, default: 1 },
    badge: { type: String, default: '' },
    archetype: { type: String, default: '' }, // For personality: e.g. 'Architect', 'Strategist'
    metrics: { type: Map, of: Number }, // Dimension breakdown: e.g. { speed: 85, accuracy: 92 }
    details: { type: mongoose.Schema.Types.Mixed },
    takenAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

assessmentResultSchema.index({ userId: 1, assessmentType: 1 });

module.exports = mongoose.models.AssessmentResult || mongoose.model('AssessmentResult', assessmentResultSchema);

