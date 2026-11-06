const mongoose = require('mongoose');
const crypto = require('crypto');

const notificationSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'notif-' + crypto.randomBytes(6).toString('hex') },
    recipient: { type: String, ref: 'User', required: true, index: true },
    sender: { type: String, ref: 'User' },
    type: {
      type: String,
      enum: [
        'invite_received',
        'join_requested',
        'join_accepted',
        'join_rejected',
        'task_assigned',
        'submission_status',
        'review_received',
        'general',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

