const express = require('express');
const { create, listByUser, listAll } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, authorize('admin', 'organizer'), listAll);
router.post('/', protect, create);
router.get('/:userId', listByUser);

module.exports = router;
