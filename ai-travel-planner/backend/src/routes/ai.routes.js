const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth.middleware');
const { generateItinerary, regenerateDayPlan, getActivitySuggestion, getPackingList } = require('../controllers/ai.controller');

const router = express.Router();

router.use(protect);

router.post(
  '/generate',
  [
    body('destination').trim().notEmpty().withMessage('Destination is required'),
    body('numberOfDays').isInt({ min: 1, max: 30 }).withMessage('Days must be between 1 and 30'),
    body('budgetType').isIn(['low', 'medium', 'high']).withMessage('Budget type must be low, medium, or high'),
    body('interests').optional().isArray().withMessage('Interests must be an array'),
  ],
  generateItinerary
);

router.post('/regenerate-day/:tripId/:day', regenerateDayPlan);
router.post('/suggest-activity/:tripId/:day', getActivitySuggestion);
router.post('/packing-list/:tripId', getPackingList);

module.exports = router;
