const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  q: String,
  options: [String],
  answer: Number,
  level: Number,
});

const quizSchema = new mongoose.Schema({
  skill: { type: String, required: true },
  level: { type: Number, min: 1, max: 10 },
  questions: [questionSchema],
  badge: String,
}, { timestamps: true });

module.exports = mongoose.model('Quiz', quizSchema);
