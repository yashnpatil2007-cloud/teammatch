const { db, save, uid, now } = require('../data/store');

/**
 * Creates and dispatches a persistent in-app notification with deduplication.
 * @param {Object} options
 * @param {string} options.recipient - Target user _id
 * @param {string} [options.sender] - Originating user _id
 * @param {string} options.type - One of the valid notification enum types
 * @param {string} options.title - Short descriptive title
 * @param {string} options.message - Detailed explanation
 * @param {string} [options.link] - Deep link URL inside the app
 * @param {string} [options.dedupKey] - Optional explicit idempotency key
 */
function createNotification({ recipient, sender = null, type, title, message, link = '', dedupKey = null }) {
  if (!recipient || !title || !message) return null;
  db.notifications = db.notifications || [];

  const key = dedupKey || `${recipient}:${type}:${link}:${title}`;
  // Prevent duplicate notifications within 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const duplicate = db.notifications.find(
    (n) =>
      n.recipient === String(recipient) &&
      n.type === type &&
      (n.dedupKey === key || (n.link === link && n.title === title)) &&
      n.createdAt >= tenMinutesAgo
  );

  if (duplicate) {
    return duplicate;
  }

  const notif = {
    _id: 'notif-' + uid().slice(0, 10),
    recipient: String(recipient),
    sender: sender ? String(sender) : null,
    type: type || 'general',
    title: String(title).trim(),
    message: String(message).trim(),
    link: String(link || '').trim(),
    dedupKey: key,
    read: false,
    createdAt: now(),
    updatedAt: now(),
  };

  db.notifications.unshift(notif);
  // Cap at 2000 total notifications in memory store to prevent memory bloat
  if (db.notifications.length > 2000) {
    db.notifications = db.notifications.slice(0, 2000);
  }
  save();
  return notif;
}

module.exports = { createNotification };
