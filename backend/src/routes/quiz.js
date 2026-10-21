const express = require('express');
const { listQuizzes, getById, getBySkill, create, update, remove, grade } = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', listQuizzes);
router.post('/', protect, authorize('admin'), create);
router.post('/grade', protect, grade);
router.get('/id/:id', protect, authorize('admin'), getById);
router.put('/:id', protect, authorize('admin'), update);
router.delete('/:id', protect, authorize('admin'), remove);
router.get('/:skill', getBySkill);

module.exports = router;
