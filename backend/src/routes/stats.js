const express = require('express');
const { stats, adminAnalytics } = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', stats);
router.get('/admin', protect, authorize('admin', 'organizer'), adminAnalytics);

module.exports = router;
