const mongoose = require('mongoose');
const crypto = require('crypto');

const certificateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'c-' + crypto.randomBytes(6).toString('hex') },
    userId: { type: String, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true, default: 'Self-uploaded' },
    issueDate: { type: Date },
    credentialId: { type: String, trim: true, default: '' },
    verificationUrl: { type: String, trim: true, default: '' },
    fileUrl: { type: String, required: true },
    fileName: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    fileMimeType: { type: String, default: '' },
    skill: { type: String, lowercase: true, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
    reviewedBy: { type: String, ref: 'User' },
    reviewedAt: { type: Date },
    submittedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

certificateSchema.index({ status: 1, submittedAt: -1 });

module.exports = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);

