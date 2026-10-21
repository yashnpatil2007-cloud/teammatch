const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['AI/ML','Web3','HealthTech','FinTech','EdTech','IoT','Open'], default: 'Open' },
  difficulty: { type: String, enum: ['Easy','Medium','Hard'], default: 'Medium' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requiredSkills: [{ name: String, weight: Number, level: Number }],
  requiredRoles: [String],
  difficultyScore: { type: Number, min: 1, max: 10 },
  teamSize: { min: { type: Number, default: 2 }, max: { type: Number, default: 5 } },
  prize: String,
  deadline: Date,
  status: { type: String, enum: ['draft','published','closed'], default: 'published' },
  registeredCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ProblemStatement', problemSchema);
