const express = require('express');
const {
  listCompetitions,
  getCompetition,
  createCompetition,
  updateCompetition,
  updateCompetitionStatus,
  assignJudges,
  publishResults,
  getCompetitionTeams,
  deleteCompetition,
} = require('../controllers/competitionController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public/optional-auth helper to read req.user if Bearer token provided
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  return next();
};

router.get('/', optionalAuth, listCompetitions);
router.post('/', protect, authorize('organizer', 'admin'), createCompetition);
router.get('/:id', optionalAuth, getCompetition);
router.put('/:id', protect, authorize('organizer', 'admin'), updateCompetition);
router.patch('/:id/status', protect, authorize('organizer', 'admin'), updateCompetitionStatus);
router.post('/:id/judges', protect, authorize('organizer', 'admin'), assignJudges);
router.post('/:id/results', protect, authorize('organizer', 'admin'), publishResults);
router.get('/:id/teams', protect, authorize('organizer', 'admin'), getCompetitionTeams);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteCompetition);

module.exports = router;
