const mongoose = require('mongoose');
const crypto = require('crypto');

const messageSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => 'msg-' + crypto.randomBytes(6).toString('hex') },
    team: { type: String, ref: 'Team', required: true, index: true },
    sender: { type: String, ref: 'User', required: true, index: true },
    senderName: { type: String, default: '' },
    senderAvatar: { type: String, default: '' },
    senderRole: { type: String, default: 'member' },
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

messageSchema.index({ team: 1, createdAt: -1 });

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);

