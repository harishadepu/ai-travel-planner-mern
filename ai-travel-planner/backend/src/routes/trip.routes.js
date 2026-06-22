const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  getTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  addActivity,
  removeActivity,
  getStats,
} = require('../controllers/trip.controller');

const router = express.Router();

// All trip routes are protected
router.use(protect);

router.get('/stats', getStats);
router.get('/', getTrips);
router.get('/:id', getTrip);
router.patch('/:id', updateTrip);
router.delete('/:id', deleteTrip);

// Itinerary management
router.post('/:id/itinerary/:day/activities', addActivity);
router.delete('/:id/itinerary/:day/activities/:activityId', removeActivity);

module.exports = router;
