const express = require('express');
const {
  getOverview,
  getAptitudeQuestions,
  submitAptitude,
  getPersonalityQuestions,
  submitPersonality,
  getTechnicalSkills,
  getTechnicalQuestions,
  submitTechnical,
  getMyHistory,
  getAdminAssessmentStats,
  addAdminQuestion,
} = require('../controllers/assessmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Student routes
router.get('/overview', protect, getOverview);
router.get('/my-history', protect, getMyHistory);

// Aptitude assessment
router.get('/aptitude/questions', protect, getAptitudeQuestions);
router.post('/aptitude/submit', protect, submitAptitude);

// Personality assessment
router.get('/personality/questions', protect, getPersonalityQuestions);
router.post('/personality/submit', protect, submitPersonality);

// Technical skill assessments
router.get('/technical/skills', protect, getTechnicalSkills);
router.get('/technical/:skill/questions', protect, getTechnicalQuestions);
router.post('/technical/submit', protect, submitTechnical);

// Admin assessment management & stats
router.get('/admin/stats', protect, authorize('admin'), getAdminAssessmentStats);
router.post('/admin/questions', protect, authorize('admin'), addAdminQuestion);

module.exports = router;

