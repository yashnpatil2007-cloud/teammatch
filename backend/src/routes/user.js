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
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { uploadCertificate, uploadResume, uploadAvatar } = require('../middleware/upload');
const router = express.Router();

router.get('/leaderboard', getLeaderboard);
router.get('/me/quiz-history', protect, quizHistory);
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
