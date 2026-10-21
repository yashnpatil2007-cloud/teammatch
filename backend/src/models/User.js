const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const certificateSchema = new mongoose.Schema({
  title: String,
  issuer: String,
  url: String,
  verified: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now },
});

const skillSchema = new mongoose.Schema({
  name: String,
  level: { type: Number, min: 1, max: 10, default: 1 },
  verifiedScore: { type: Number, default: 0 },
  badge: { type: String, enum: ['Bronze','Silver','Gold','Platinum'], default: 'Bronze' },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['organizer','leader','member','admin'], required: true },
  avatar: String,
  bio: String,
  github: String,
  linkedin: String,
  resumeUrl: String,
  skills: [skillSchema],
  certificates: [certificateSchema],
  quizScores: [{ quizId: mongoose.Schema.Types.ObjectId, score: Number, level: Number, takenAt: Date }],
  reliabilityScore: { type: Number, default: 70, min: 0, max: 100 },
  totalReviews: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
