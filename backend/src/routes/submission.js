const express = require('express');
const {
  submitProject,
  getSubmissionByTeam,
  getAllSubmissions,
  getOneSubmission,
  reviewSubmission,
  uploadAttachment,
} = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/auth');
const { uploadSubmission } = require('../middleware/upload');

const router = express.Router();

router.post('/', protect, authorize('leader'), submitProject);
router.get('/', protect, authorize('organizer', 'admin'), getAllSubmissions);
router.get('/team/:teamId', protect, getSubmissionByTeam);
router.get('/:id', protect, getOneSubmission);
router.post('/:id/review', protect, authorize('organizer', 'admin'), reviewSubmission);
router.post('/upload', protect, authorize('leader'), uploadSubmission.single('file'), uploadAttachment);

module.exports = router;

