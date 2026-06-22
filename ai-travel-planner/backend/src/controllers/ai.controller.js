const { validationResult } = require('express-validator');
const Trip = require('../models/trip.model');
const { generateFullItinerary, regenerateDay, suggestActivity, generatePackingList } = require('../services/ai.service');
const { successResponse, errorResponse } = require('../utils/response.utils');

// POST /api/ai/generate - Generate a new trip itinerary
const generateItinerary = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 400, 'Validation failed', errors.array());
    }

    const { destination, numberOfDays, budgetType, interests, startDate } = req.body;

    // Create trip record immediately with 'generating' status
    const trip = await Trip.create({
      user: req.user._id,
      title: `Trip to ${destination}`,
      destination,
      numberOfDays,
      budgetType,
      interests: interests || [],
      startDate: startDate || null,
      status: 'generating',
    });

    // Generate with AI
    let aiData;
    try {
      aiData = await generateFullItinerary({ destination, numberOfDays, budgetType, interests: interests || [] });
    } catch (aiError) {
      await Trip.findByIdAndUpdate(trip._id, { status: 'error' });
      return errorResponse(res, 500, 'AI generation failed. Please try again.');
    }

    // Update trip with generated data
    const updatedTrip = await Trip.findByIdAndUpdate(
      trip._id,
      {
        title: aiData.title || `Trip to ${destination}`,
        status: 'ready',
        itinerary: aiData.itinerary || [],
        budgetEstimate: aiData.budgetEstimate || {},
        hotelSuggestions: aiData.hotelSuggestions || [],
        travelTips: aiData.travelTips || [],
        weatherInfo: aiData.weatherInfo || '',
        bestTimeToVisit: aiData.bestTimeToVisit || '',
        aiInsightsScore: aiData.aiInsightsScore || {},
      },
      { new: true }
    );

    return successResponse(res, 201, 'Itinerary generated successfully', { trip: updatedTrip });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/ai/regenerate-day/:tripId/:day
const regenerateDayPlan = async (req, res) => {
  try {
    const { tripId, day } = req.params;
    const { customRequest } = req.body;

    const trip = await Trip.findOne({ _id: tripId, user: req.user._id });
    if (!trip) return errorResponse(res, 404, 'Trip not found or access denied.');

    const dayNumber = parseInt(day);
    if (dayNumber < 1 || dayNumber > trip.numberOfDays) {
      return errorResponse(res, 400, `Day must be between 1 and ${trip.numberOfDays}.`);
    }

    let newDayPlan;
    try {
      newDayPlan = await regenerateDay({
        destination: trip.destination,
        dayNumber,
        numberOfDays: trip.numberOfDays,
        budgetType: trip.budgetType,
        interests: trip.interests,
        customRequest,
      });
    } catch (aiError) {
      return errorResponse(res, 500, 'AI regeneration failed. Please try again.');
    }

    // Replace the specific day in itinerary
    const itinerary = trip.itinerary.map((d) =>
      d.day === dayNumber ? { ...newDayPlan, day: dayNumber } : d
    );

    trip.itinerary = itinerary;
    trip.generationVersion += 1;
    await trip.save();

    return successResponse(res, 200, `Day ${day} regenerated successfully`, { trip });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/ai/suggest-activity/:tripId/:day
const getActivitySuggestion = async (req, res) => {
  try {
    const { tripId, day } = req.params;

    const trip = await Trip.findOne({ _id: tripId, user: req.user._id });
    if (!trip) return errorResponse(res, 404, 'Trip not found or access denied.');

    const dayPlan = trip.itinerary.find((d) => d.day === parseInt(day));
    if (!dayPlan) return errorResponse(res, 404, `Day ${day} not found.`);

    const suggestion = await suggestActivity({
      destination: trip.destination,
      dayTheme: dayPlan.theme,
      existingActivities: dayPlan.activities,
      budgetType: trip.budgetType,
      interests: trip.interests,
    });

    return successResponse(res, 200, 'Activity suggestion generated', { suggestion });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/ai/packing-list/:tripId
const getPackingList = async (req, res) => {
  try {
    const { tripId } = req.params;
    const trip = await Trip.findOne({ _id: tripId, user: req.user._id });
    if (!trip) return errorResponse(res, 404, 'Trip not found or access denied.');

    const packingList = await generatePackingList({
      destination: trip.destination,
      numberOfDays: trip.numberOfDays,
      budgetType: trip.budgetType,
      interests: trip.interests,
      itinerary: trip.itinerary,
    });

    return successResponse(res, 200, 'Packing list generated', { packingList });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = { generateItinerary, regenerateDayPlan, getActivitySuggestion, getPackingList };
