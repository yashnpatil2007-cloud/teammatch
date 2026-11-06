const express = require('express');
const { reset } = require('../data/store');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/reset', protect, authorize('admin'), (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Reset is disabled in production' });
  }
  reset();
  res.json({ message: 'Datastore reset to seed data' });
});

module.exports = router;
