const express = require('express');
const {
  getLeaderboard,
  listUsers,
  getProfile,
  updateProfile,
  quizSubmit,
  quizHistory,
  adminUpdateUser,
  removeUser,
  addCertificate,
  uploadCertificateFile,
  deleteCertificate,
  uploadResumeFile,
  deleteResume,
  pendingCertificates,
  verifyCertificate,
  uploadProfilePhoto,
  deleteProfilePhoto,
  adminDirectory,
  adminGetUserDetails,
  adminUpdateAccountStatus,
  getAdminAuditLogs,
  getSecureDocument,
  adminListOrganizers,
  adminCreateOrganizer,
  adminAssignOrganizer,
  createReport,
  adminGetReports,
  adminResolveReport,
  adminGetSettings,
  adminUpdateSettings,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { uploadCertificate, uploadResume, uploadAvatar } = require('../middleware/upload');
const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.get('/me/quiz-history', protect, quizHistory);
router.get('/documents/:category/:fileName', protect, getSecureDocument);
router.post('/reports', protect, createReport);
router.get('/admin/directory', protect, authorize('admin'), adminDirectory);
router.get('/admin/organizers', protect, authorize('admin'), adminListOrganizers);
router.post('/admin/organizers', protect, authorize('admin'), adminCreateOrganizer);
router.put('/admin/organizers/:id/assign', protect, authorize('admin'), adminAssignOrganizer);
router.get('/admin/reports', protect, authorize('admin'), adminGetReports);
router.put('/admin/reports/:reportId', protect, authorize('admin'), adminResolveReport);
router.get('/admin/settings', protect, authorize('admin'), adminGetSettings);
router.put('/admin/settings', protect, authorize('admin'), adminUpdateSettings);
router.get('/admin/:id/audit-logs', protect, authorize('admin'), getAdminAuditLogs);
router.put('/admin/:id/status', protect, authorize('admin'), adminUpdateAccountStatus);
router.get('/admin/:id', protect, authorize('admin'), adminGetUserDetails);
router.get('/certificates/pending', protect, authorize('admin'), pendingCertificates);
router.put('/certificates/:certId/verify', protect, authorize('admin'), verifyCertificate);
router.post('/certificates', protect, addCertificate);
router.post('/certificates/upload', protect, uploadCertificate.single('file'), uploadCertificateFile);
router.delete('/certificates/:certId', protect, deleteCertificate);
router.post('/resume/upload', protect, uploadResume.single('resume'), uploadResumeFile);
router.delete('/resume', protect, deleteResume);
router.post('/profile-photo', protect, uploadAvatar.single('photo'), uploadProfilePhoto);
router.delete('/profile-photo', protect, deleteProfilePhoto);
router.put('/profile', protect, updateProfile);
router.post('/quiz', protect, quizSubmit);
router.get('/', protect, listUsers);
router.put('/:id', protect, authorize('admin'), adminUpdateUser);
router.delete('/:id', protect, authorize('admin'), removeUser);
router.get('/:id', protect, getProfile);

module.exports = router;
