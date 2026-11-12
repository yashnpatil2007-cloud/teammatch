const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const certificateSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'c-' + crypto.randomBytes(6).toString('hex') },
  title: { type: String, required: true },
  issuer: { type: String, default: 'Self-uploaded' },
  issueDate: { type: Date },
  credentialId: { type: String, default: '' },
  verificationUrl: { type: String, default: '' },
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  fileMimeType: { type: String, default: '' },
  url: { type: String, default: '' },
  skill: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'verified', 'rejected'],
    default: 'pending',
    index: true,
  },
  rejectionReason: { type: String, default: '' },
  verifiedAt: { type: Date },
  verifiedBy: { type: String, ref: 'User' },
  submittedAt: { type: Date, default: Date.now },
  uploadedAt: { type: Date, default: Date.now },
});

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, lowercase: true, trim: true },
  level: { type: Number, min: 1, max: 10, default: 1 },
  verifiedScore: { type: Number, default: 0 },
  badge: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Certified'], default: 'Bronze' },
});

const quizScoreSchema = new mongoose.Schema({
  _id: { type: String, default: () => 'qs-' + crypto.randomBytes(6).toString('hex') },
  skill: { type: String },
  level: { type: Number, default: 1 },
  score: { type: Number, default: 0 },
  badge: { type: String, default: 'Bronze' },
  takenAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'u-' + crypto.randomBytes(6).toString('hex') },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['organizer', 'leader', 'member', 'admin'], default: 'member', index: true },
    avatar: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    bio: { type: String, default: '' },
    about: { type: String, default: '' },
    phone: { type: String, default: '' },
    college: { type: String, default: '' },
    course: { type: String, default: '' },
    year: { type: String, default: '' },
    branch: { type: String, default: '' },
    location: { type: String, default: '' },
    interests: [{ type: String }],
    availability: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    website: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    resumeFileName: { type: String, default: '' },
    resumeOriginalName: { type: String, default: '' },
    resumeFileSize: { type: Number, default: 0 },
    resumeUploadedAt: { type: Date },
    skills: [skillSchema],
    certificates: [certificateSchema],
    quizScores: [quizScoreSchema],
    personality: {
      archetype: { type: String, default: '' },
      dimensions: { type: Map, of: Number },
      summary: { type: String, default: '' },
      idealComplement: { type: String, default: '' },
      takenAt: { type: Date },
    },
    aptitudeScore: { type: Number, default: 0 },
    aptitudeLevel: { type: String, default: '' },
    aptitudeBadge: { type: String, default: '' },
    reliabilityScore: { type: Number, default: 70, min: 0, max: 100, index: true },
    totalReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false, index: true },
    assignedCompetitions: [{ type: String }],
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'deactivated'],
      default: 'active',
      index: true,
    },
    statusReason: { type: String, default: '' },
    statusUpdatedAt: { type: Date },
    statusUpdatedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
