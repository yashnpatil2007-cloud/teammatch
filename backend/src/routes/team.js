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
  requestJoin,
  respondInvite,
} = require('../controllers/teamController');

const {
  getWorkspace,
  createTask,
  updateTask,
  deleteTask,
  addMilestone,
  updateMilestone,
  addResource,
  getMessages,
  postMessage,
} = require('../controllers/workspaceController');

const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getTeams);
router.get('/mine', protect, getMine);
router.get('/match', protect, authorize('leader', 'admin'), match);
router.post('/', protect, authorize('leader', 'admin'), createTeam);
router.get('/:teamId', protect, getOne);
router.get('/:teamId/analyze', protect, analyze);
router.put('/:teamId', protect, authorize('leader', 'admin'), updateTeam);
router.delete('/:teamId', protect, authorize('leader', 'admin'), removeTeam);
router.post('/:teamId/invite', protect, authorize('leader', 'admin'), invite);
router.post('/:teamId/request-join', protect, requestJoin);
router.post('/:teamId/respond', protect, respondInvite);
router.post('/:teamId/remove-member', protect, removeMember);

// Team Collaboration Workspace Routes
router.get('/:teamId/workspace', protect, getWorkspace);
router.post('/:teamId/tasks', protect, createTask);
router.put('/:teamId/tasks/:taskId', protect, updateTask);
router.delete('/:teamId/tasks/:taskId', protect, deleteTask);
router.post('/:teamId/milestones', protect, addMilestone);
router.put('/:teamId/milestones/:milestoneId', protect, updateMilestone);
router.post('/:teamId/resources', protect, addResource);
router.get('/:teamId/messages', protect, getMessages);
router.post('/:teamId/messages', protect, postMessage);

module.exports = router;
