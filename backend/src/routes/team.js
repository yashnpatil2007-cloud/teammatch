const express = require('express');
const {
  getTeams,
  getMine,
  getOne,
  createTeam,
  updateTeam,
  updateMemberRoles,
  adminModerateTeam,
  removeTeam,
  removeMember,
  match,
  analyze,
  invite,
  requestJoin,
  respondInvite,
  uploadTeamLogoHandler,
  uploadStandaloneTeamLogo,
  deleteTeamLogoHandler,
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
const { uploadTeamLogo } = require('../middleware/upload');
const router = express.Router();

router.get('/', protect, getTeams);
router.get('/mine', protect, getMine);
router.get('/match', protect, authorize('leader'), match);
router.post('/', protect, authorize('leader'), createTeam);
router.post('/upload-logo', protect, authorize('leader'), uploadTeamLogo.single('logo'), uploadStandaloneTeamLogo);
router.put('/admin/:teamId/moderate', protect, authorize('admin'), adminModerateTeam);
router.get('/:teamId', protect, getOne);
router.get('/:teamId/analyze', protect, analyze);
router.put('/:teamId', protect, authorize('leader'), updateTeam);
router.post('/:teamId/logo', protect, authorize('leader'), uploadTeamLogo.single('logo'), uploadTeamLogoHandler);
router.delete('/:teamId/logo', protect, authorize('leader'), deleteTeamLogoHandler);
router.put('/:teamId/member-roles', protect, authorize('leader'), updateMemberRoles);
router.delete('/:teamId', protect, authorize('leader', 'admin'), removeTeam);
router.post('/:teamId/invite', protect, authorize('leader'), invite);
router.post('/:teamId/request-join', protect, authorize('member'), requestJoin);
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
