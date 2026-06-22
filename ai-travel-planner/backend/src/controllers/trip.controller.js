const Trip = require('../models/trip.model');
const { successResponse, errorResponse } = require('../utils/response.utils');

// GET /api/trips - Get all trips for authenticated user
const getTrips = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, favorite } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    if (favorite === 'true') filter.isFavorite = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [trips, total] = await Promise.all([
      Trip.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).select('-itinerary'),
      Trip.countDocuments(filter),
    ]);

    return successResponse(res, 200, 'Trips retrieved', {
      trips,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/trips/:id - Get single trip (strict ownership check)
const getTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return errorResponse(res, 404, 'Trip not found or access denied.');
    }
    return successResponse(res, 200, 'Trip retrieved', { trip });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// PATCH /api/trips/:id - Update trip metadata
const updateTrip = async (req, res) => {
  try {
    const allowedUpdates = ['title', 'isFavorite', 'startDate', 'coverImage'];
    const updateData = {};
    allowedUpdates.forEach((key) => {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    });

    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!trip) return errorResponse(res, 404, 'Trip not found or access denied.');
    return successResponse(res, 200, 'Trip updated', { trip });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// DELETE /api/trips/:id
const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!trip) return errorResponse(res, 404, 'Trip not found or access denied.');
    return successResponse(res, 200, 'Trip deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// PATCH /api/trips/:id/itinerary/:day/activities - Add activity to a day
const addActivity = async (req, res) => {
  try {
    const { day } = req.params;
    const activity = req.body;

    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return errorResponse(res, 404, 'Trip not found or access denied.');

    const dayPlan = trip.itinerary.find((d) => d.day === parseInt(day));
    if (!dayPlan) return errorResponse(res, 404, `Day ${day} not found in itinerary.`);

    dayPlan.activities.push(activity);
    await trip.save();

    return successResponse(res, 200, 'Activity added', { trip });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// DELETE /api/trips/:id/itinerary/:day/activities/:activityId
const removeActivity = async (req, res) => {
  try {
    const { day, activityId } = req.params;

    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return errorResponse(res, 404, 'Trip not found or access denied.');

    const dayPlan = trip.itinerary.find((d) => d.day === parseInt(day));
    if (!dayPlan) return errorResponse(res, 404, `Day ${day} not found in itinerary.`);

    const activityIndex = dayPlan.activities.findIndex((a) => a._id.toString() === activityId);
    if (activityIndex === -1) return errorResponse(res, 404, 'Activity not found.');

    dayPlan.activities.splice(activityIndex, 1);
    await trip.save();

    return successResponse(res, 200, 'Activity removed', { trip });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/trips/stats - Dashboard stats
const getStats = async (req, res) => {
  try {
    const [total, favorites, destinations] = await Promise.all([
      Trip.countDocuments({ user: req.user._id, status: 'ready' }),
      Trip.countDocuments({ user: req.user._id, isFavorite: true }),
      Trip.distinct('destination', { user: req.user._id }),
    ]);

    const recentTrip = await Trip.findOne({ user: req.user._id, status: 'ready' })
      .sort({ createdAt: -1 })
      .select('title destination createdAt');

    return successResponse(res, 200, 'Stats retrieved', {
      stats: {
        totalTrips: total,
        favoriteTrips: favorites,
        uniqueDestinations: destinations.length,
        recentTrip,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = { getTrips, getTrip, updateTrip, deleteTrip, addActivity, removeActivity, getStats };
