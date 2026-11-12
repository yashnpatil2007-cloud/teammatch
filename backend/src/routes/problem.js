const express = require('express');
const { getAll, getOne, create, update, remove, analyze } = require('../controllers/problemController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  return next();
};

router.get('/', optionalAuth, getAll);
router.get('/:id', optionalAuth, getOne);
router.post('/', protect, authorize('organizer', 'admin'), create);
router.post('/analyze', protect, analyze);
router.put('/:id', protect, authorize('organizer', 'admin'), update);
router.delete('/:id', protect, authorize('organizer', 'admin'), remove);

module.exports = router;
