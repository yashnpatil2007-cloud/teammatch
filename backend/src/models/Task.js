const mongoose = require('mongoose');
const crypto = require('crypto');

const taskSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'tsk-' + crypto.randomBytes(6).toString('hex') },
    team: { type: String, ref: 'Team', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assignee: { type: String, ref: 'User', index: true },
    assigneeName: { type: String, default: '' },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Completed'],
      default: 'To Do',
      index: true,
    },
    dueDate: { type: Date },
    createdBy: { type: String, ref: 'User' },
  },
  { timestamps: true }
);

taskSchema.index({ team: 1, status: 1 });
taskSchema.index({ team: 1, assignee: 1 });

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);

