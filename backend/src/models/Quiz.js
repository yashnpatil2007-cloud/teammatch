const mongoose = require('mongoose');
const crypto = require('crypto');

const questionSchema = new mongoose.Schema({
  q: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: Number, required: true, default: 0 },
  level: { type: Number, default: 5 },
});

const quizSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'q-' + crypto.randomBytes(6).toString('hex') },
    skill: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    level: { type: Number, min: 1, max: 10, default: 5 },
    questions: [questionSchema],
    badge: { type: String, default: 'Bronze' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
