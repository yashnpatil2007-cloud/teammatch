const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    actorId: { type: String, required: true, index: true },
    actorName: { type: String, default: '' },
    actorRole: { type: String, default: 'admin' },
    action: { type: String, required: true, index: true },
    targetType: { type: String, default: 'user', index: true },
    targetId: { type: String, required: true, index: true },
    details: { type: String, default: '' },
    previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false, _id: false }
);

auditLogSchema.index({ targetId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
