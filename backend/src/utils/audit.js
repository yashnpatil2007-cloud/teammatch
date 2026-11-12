const { db, save, uid, now } = require('../data/store');

/**
 * Record an immutable administrative audit log entry.
 */
const recordAudit = ({ actor, action, targetType = 'user', targetId, details = '', previousValue = null, newValue = null }) => {
  if (!db.auditLogs) db.auditLogs = [];
  const entry = {
    _id: uid(),
    actorId: actor?._id || 'system',
    actorName: actor?.name || 'System',
    actorRole: actor?.role || 'system',
    action,
    targetType,
    targetId: String(targetId || ''),
    details,
    previousValue,
    newValue,
    createdAt: now(),
  };
  db.auditLogs.push(entry);
  save();
  return entry;
};

module.exports = { recordAudit };
