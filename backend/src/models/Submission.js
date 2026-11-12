const mongoose = require('mongoose');
const crypto = require('crypto');

const attachmentSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'att-' + crypto.randomBytes(4).toString('hex') },
  name: { type: String, required: true },
  url: { type: String, required: true },
  fileType: { type: String },
  size: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now },
});

const submissionReviewSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'rev-' + crypto.randomBytes(4).toString('hex') },
  reviewer: { type: String, ref: 'User', required: true },
  reviewerName: { type: String, default: '' },
  score: { type: Number, min: 0, max: 100 },
  feedback: { type: String, required: true },
  revisionsRequired: [String],
  reviewedAt: { type: Date, default: Date.now },
});

const submissionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'sub-' + crypto.randomBytes(6).toString('hex') },
    team: { type: String, ref: 'Team', required: true, index: true },
    problem: { type: String, ref: 'ProblemStatement', required: true, index: true },
    competitionId: { type: String, ref: 'Competition', index: true },
    submittedBy: { type: String, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    githubUrl: { type: String, trim: true, default: '' },
    demoUrl: { type: String, trim: true, default: '' },
    presentationUrl: { type: String, trim: true, default: '' },
    attachments: [attachmentSchema],
    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'revisions_requested', 'approved', 'rejected'],
      default: 'submitted',
      index: true,
    },
    reviews: [submissionReviewSchema],
  },
  { timestamps: true }
);

submissionSchema.index({ team: 1, status: 1 });
submissionSchema.index({ problem: 1, status: 1 });

module.exports = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);

