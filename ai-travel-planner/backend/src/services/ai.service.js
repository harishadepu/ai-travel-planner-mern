const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BUDGET_LABELS = { low: 'budget-friendly', medium: 'moderate', high: 'luxury' };

/**
 * Generate a complete travel itinerary with budget + hotels + insights
 */
const generateFullItinerary = async ({ destination, numberOfDays, budgetType, interests }) => {
  const budgetLabel = BUDGET_LABELS[budgetType];
  const interestsList = interests.length > 0 ? interests.join(', ') : 'general sightseeing';

  const prompt = `You are an expert travel planner. Generate a comprehensive travel plan for the following trip:

Destination: ${destination}
Duration: ${numberOfDays} days
Budget: ${budgetLabel} (${budgetType})
Interests: ${interestsList}

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "title": "catchy trip title",
  "weatherInfo": "brief weather/climate info",
  "bestTimeToVisit": "best season/months to visit",
  "travelTips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "itinerary": [
    {
      "day": 1,
      "theme": "day theme",
      "notes": "brief day overview",
      "dailyBudget": 150,
      "activities": [
        {
          "time": "9:00 AM",
          "title": "Activity name",
          "description": "What to do and see",
          "location": "Specific location/address",
          "estimatedCost": 20,
          "category": "culture",
          "tips": "Insider tip for this activity"
        }
      ]
    }
  ],
  "budgetEstimate": {
    "flights": 400,
    "accommodation": 300,
    "food": 150,
    "activities": 100,
    "transport": 80,
    "miscellaneous": 50,
    "total": 1080,
    "currency": "USD",
    "notes": "Budget notes and money-saving tips"
  },
  "hotelSuggestions": [
    {
      "name": "Hotel Name",
      "tier": "budget",
      "pricePerNight": 50,
      "rating": 4.2,
      "location": "Central area",
      "amenities": ["WiFi", "Breakfast"],
      "pros": ["Great location", "Affordable"],
      "description": "Brief description"
    }
  ],
  "aiInsightsScore": {
    "culture": 85,
    "adventure": 60,
    "relaxation": 70,
    "budget_efficiency": 80,
    "overall": 74
  }
}

Requirements:
- Generate exactly ${numberOfDays} days in the itinerary array
- Each day should have 4-6 activities
- Hotel suggestions: provide 3 hotels (one per tier: budget, mid-range, luxury)
- Budget should match the ${budgetLabel} preference
- Make all scores between 0-100
- Category must be one of: food, culture, adventure, shopping, transport, accommodation, other
- All costs in USD
- Make it realistic and specific to ${destination}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0].text.trim();
  
  // Clean up any potential markdown fences
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Attempt to extract JSON from the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Failed to parse AI response as JSON');
  }
};

/**
 * Regenerate a specific day with new preferences
 */
const regenerateDay = async ({ destination, dayNumber, numberOfDays, budgetType, interests, customRequest }) => {
  const budgetLabel = BUDGET_LABELS[budgetType];
  const interestsList = interests.length > 0 ? interests.join(', ') : 'general sightseeing';

  const prompt = `You are an expert travel planner. Regenerate Day ${dayNumber} of a ${numberOfDays}-day trip to ${destination}.

Budget: ${budgetLabel}
Interests: ${interestsList}
Special request: ${customRequest || 'Make it interesting and varied'}

Return ONLY a valid JSON object with this structure:
{
  "day": ${dayNumber},
  "theme": "day theme",
  "notes": "brief day overview",
  "dailyBudget": 150,
  "activities": [
    {
      "time": "9:00 AM",
      "title": "Activity name",
      "description": "What to do and see",
      "location": "Specific location",
      "estimatedCost": 20,
      "category": "culture",
      "tips": "Insider tip"
    }
  ]
}

Provide 4-6 activities. Make it specific, realistic, and honor the special request.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0].text.trim();
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Failed to parse AI response for day regeneration');
  }
};

/**
 * Generate a smart activity suggestion
 */
const suggestActivity = async ({ destination, dayTheme, existingActivities, budgetType, interests }) => {
  const budgetLabel = BUDGET_LABELS[budgetType];
  const existing = existingActivities.map(a => a.title).join(', ');

  const prompt = `Suggest one new activity for a trip to ${destination}.

Day theme: ${dayTheme}
Budget: ${budgetLabel}
Interests: ${interests.join(', ')}
Already planned: ${existing}

Return ONLY a JSON object:
{
  "time": "suggested time",
  "title": "Activity name",
  "description": "What to do and see",
  "location": "Specific location",
  "estimatedCost": 25,
  "category": "culture",
  "tips": "Insider tip"
}

Make it different from existing activities, specific, and realistic.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0].text.trim();
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Failed to parse AI activity suggestion');
  }
};

/**
 * Generate a smart packing list based on trip details
 * Custom Feature: Context-aware packing suggestions per trip type
 */
const generatePackingList = async ({ destination, numberOfDays, budgetType, interests, itinerary }) => {
  // Extract activity categories from itinerary for smarter packing
  const activityTypes = itinerary
    ? [...new Set(itinerary.flatMap((d) => d.activities?.map((a) => a.category) || []))]
    : [];

  const prompt = `You are a seasoned travel packer. Generate a smart, specific packing list for this trip:

Destination: ${destination}
Duration: ${numberOfDays} days
Budget tier: ${budgetType}
Interests: ${interests.join(', ')}
Activity types planned: ${activityTypes.join(', ') || 'general sightseeing'}

Return ONLY a valid JSON object:
{
  "categories": [
    {
      "name": "Documents & Money",
      "icon": "📄",
      "items": [
        { "item": "Passport", "essential": true, "note": "Check validity 6+ months" },
        { "item": "Travel insurance docs", "essential": true, "note": "" }
      ]
    }
  ],
  "tips": ["tip1", "tip2"]
}

Categories should include relevant ones from: Documents & Money, Clothing, Toiletries, Electronics, Health & Safety, Activities & Gear.
Mark items as essential: true if they'd be a disaster to forget.
Add specific notes where helpful (e.g. "Leave room for souvenirs").
Be specific to the destination climate, activities, and budget level.
Return 4-6 categories, each with 4-8 items.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0].text.trim();
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Failed to parse packing list');
  }
};

module.exports = { generateFullItinerary, regenerateDay, suggestActivity, generatePackingList };
