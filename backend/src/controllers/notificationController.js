const { db, save, now } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');

/**
 * GET /api/notifications
 * Retrieves notifications for currently authenticated user.
 */
const getMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  db.notifications = db.notifications || [];

  const { unreadOnly, limit = 40 } = req.query;
  let userNotifs = db.notifications.filter((n) => n.recipient === userId);

  if (unreadOnly === 'true') {
    userNotifs = userNotifs.filter((n) => !n.read);
  }

  // Sort descending by creation date
  userNotifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalUnread = db.notifications.filter((n) => n.recipient === userId && !n.read).length;
  const paged = userNotifs.slice(0, Number(limit) || 40);

  res.json({
    notifications: paged,
    unreadCount: totalUnread,
    total: userNotifs.length,
  });
});

/**
 * GET /api/notifications/unread-count
 * Lightweight endpoint for polling unread notification badge count
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  db.notifications = db.notifications || [];
  const unreadCount = db.notifications.filter((n) => n.recipient === userId && !n.read).length;

  res.json({ unreadCount });
});

/**
 * PUT /api/notifications/:id/read
 * Marks a single notification as read (strictly owned by user)
 */
const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  db.notifications = db.notifications || [];
  const notif = db.notifications.find((n) => n._id === req.params.id);

  if (!notif) return res.status(404).json({ message: 'Notification not found' });
  if (notif.recipient !== userId) {
    return res.status(403).json({ message: 'Access denied: You do not own this notification' });
  }

  notif.read = true;
  notif.updatedAt = now();
  save();

  res.json({ message: 'Notification marked as read', notification: notif });
});

/**
 * PUT /api/notifications/read-all
 * Marks all notifications for the user as read
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  db.notifications = db.notifications || [];

  let count = 0;
  db.notifications.forEach((n) => {
    if (n.recipient === userId && !n.read) {
      n.read = true;
      n.updatedAt = now();
      count++;
    }
  });

  save();
  res.json({ message: 'All notifications marked as read', updatedCount: count });
});

/**
 * DELETE /api/notifications/:id
 * Deletes a notification (strictly owned by user)
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  db.notifications = db.notifications || [];
  const idx = db.notifications.findIndex((n) => n._id === req.params.id);

  if (idx === -1) return res.status(404).json({ message: 'Notification not found' });
  if (db.notifications[idx].recipient !== userId) {
    return res.status(403).json({ message: 'Access denied: You do not own this notification' });
  }

  db.notifications.splice(idx, 1);
  save();

  res.json({ message: 'Notification removed successfully', id: req.params.id });
});

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

