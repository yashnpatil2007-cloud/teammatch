const express = require('express');
const {
  getTeams,
  getMine,
  getOne,
  createTeam,
  updateTeam,
  removeTeam,
  removeMember,
  match,
  analyze,
  invite,
  respondInvite,
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getTeams);
router.get('/mine', protect, getMine);
router.get('/match', protect, match);
router.post('/', protect, authorize('leader', 'organizer', 'admin', 'member'), createTeam);
router.get('/:teamId', protect, getOne);
router.get('/:teamId/analyze', protect, analyze);
router.put('/:teamId', protect, authorize('leader', 'organizer', 'admin'), updateTeam);
router.delete('/:teamId', protect, authorize('leader', 'organizer', 'admin'), removeTeam);
router.post('/:teamId/invite', protect, authorize('leader', 'organizer', 'admin'), invite);
router.post('/:teamId/respond', protect, respondInvite);
router.post('/:teamId/remove-member', protect, removeMember);

module.exports = router;
