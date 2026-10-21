const express = require('express');
const { getAll, getOne, create, update, remove, analyze } = require('../controllers/problemController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', protect, authorize('organizer', 'admin'), create);
router.post('/analyze', protect, analyze);
router.put('/:id', protect, authorize('organizer', 'admin'), update);
router.delete('/:id', protect, authorize('organizer', 'admin'), remove);

module.exports = router;
