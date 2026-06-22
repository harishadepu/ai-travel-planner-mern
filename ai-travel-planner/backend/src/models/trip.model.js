const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  time: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  location: { type: String, default: '' },
  estimatedCost: { type: Number, default: 0 },
  category: {
    type: String,
    enum: ['food', 'culture', 'adventure', 'shopping', 'transport', 'accommodation', 'other'],
    default: 'other',
  },
  tips: { type: String, default: '' },
}, { _id: true });

const dayPlanSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  date: { type: String, default: '' },
  theme: { type: String, default: '' },
  activities: [activitySchema],
  dailyBudget: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { _id: false });

const budgetBreakdownSchema = new mongoose.Schema({
  flights: { type: Number, default: 0 },
  accommodation: { type: Number, default: 0 },
  food: { type: Number, default: 0 },
  activities: { type: Number, default: 0 },
  transport: { type: Number, default: 0 },
  miscellaneous: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  notes: { type: String, default: '' },
}, { _id: false });

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tier: { type: String, enum: ['budget', 'mid-range', 'luxury'], default: 'mid-range' },
  pricePerNight: { type: Number, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  location: { type: String, default: '' },
  amenities: [String],
  pros: [String],
  description: { type: String, default: '' },
}, { _id: true });

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Trip title is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    numberOfDays: {
      type: Number,
      required: true,
      min: [1, 'Trip must be at least 1 day'],
      max: [30, 'Trip cannot exceed 30 days'],
    },
    budgetType: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    interests: {
      type: [String],
      default: [],
    },
    startDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['generating', 'ready', 'error'],
      default: 'generating',
    },
    itinerary: [dayPlanSchema],
    budgetEstimate: budgetBreakdownSchema,
    hotelSuggestions: [hotelSchema],
    travelTips: [String],
    weatherInfo: { type: String, default: '' },
    bestTimeToVisit: { type: String, default: '' },
    // Custom feature: AI travel insights score
    aiInsightsScore: {
      culture: { type: Number, default: 0 },
      adventure: { type: Number, default: 0 },
      relaxation: { type: Number, default: 0 },
      budget_efficiency: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },
    generationVersion: { type: Number, default: 1 },
    isFavorite: { type: Boolean, default: false },
    coverImage: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure efficient user-specific queries
tripSchema.index({ user: 1, createdAt: -1 });
tripSchema.index({ user: 1, isFavorite: 1 });

module.exports = mongoose.model('Trip', tripSchema);
