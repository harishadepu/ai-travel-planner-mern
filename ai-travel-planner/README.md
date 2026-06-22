# WanderAI – AI-Powered Travel Planner

A full-stack **MERN** application (MongoDB, Express, React, Node.js) that uses Claude AI to generate personalized day-by-day travel itineraries with budget estimates, hotel recommendations, and smart packing lists.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | **React 19 + Vite** (plain React, no framework) |
| Styling | **Tailwind CSS v3** |
| Routing | **React Router DOM v7** |
| Backend | **Node.js + Express** |
| Database | **MongoDB + Mongoose** |
| AI | **Anthropic Claude** (claude-sonnet-4-6) |
| Auth | **JWT + bcryptjs** |

> Pure MERN stack — no Next.js, no SSR, no meta-framework.

---

## Project Structure

```
ai-travel-planner/
├── backend/
│   └── src/
│       ├── app.js                    # Express app + middleware
│       ├── server.js                 # Entry point
│       ├── config/database.js        # MongoDB connection
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── trip.controller.js
│       │   └── ai.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js    # JWT protect middleware
│       │   └── error.middleware.js
│       ├── models/
│       │   ├── user.model.js
│       │   └── trip.model.js         # Nested: Trip → Days → Activities
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── trip.routes.js
│       │   └── ai.routes.js
│       ├── services/
│       │   └── ai.service.js         # All Claude API calls
│       └── utils/
│           ├── jwt.utils.js
│           └── response.utils.js
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx                  # React entry point
        ├── App.jsx                   # React Router setup
        ├── index.css                 # Tailwind + global styles
        ├── lib/api.js                # Axios instance
        ├── contexts/AuthContext.jsx  # Global auth state
        ├── components/
        │   ├── Navbar.jsx
        │   ├── TripCard.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── LandingPage.jsx
            ├── AuthPage.jsx
            ├── DashboardPage.jsx
            ├── NewTripPage.jsx
            └── TripDetailPage.jsx    # 5 tabs: Itinerary, Budget, Hotels, Packing, Insights
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Anthropic API key → https://console.anthropic.com

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edit .env and fill in your values
npm install
npm run dev        # runs on http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env
# VITE_API_URL is /api by default (proxied to localhost:5000 in dev)
npm install
npm run dev        # runs on http://localhost:3000
```

### Environment Variables

**backend/.env**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-travel-planner
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=sk-ant-...
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**frontend/.env**
```
VITE_API_URL=/api
```
> In dev, Vite proxies `/api` to `http://localhost:5000`. In production set `VITE_API_URL=https://your-backend.com/api`.

---

## API Routes

```
Auth:
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me

Trips (all protected):
  GET    /api/trips              — list user's trips
  GET    /api/trips/stats        — dashboard stats
  GET    /api/trips/:id          — get single trip
  PATCH  /api/trips/:id          — update title/favorite/date
  DELETE /api/trips/:id

  POST   /api/trips/:id/itinerary/:day/activities          — add activity
  DELETE /api/trips/:id/itinerary/:day/activities/:actId   — remove activity

AI (all protected, rate limited 20/hr):
  POST   /api/ai/generate                    — generate full itinerary
  POST   /api/ai/regenerate-day/:tripId/:day — regenerate a single day
  POST   /api/ai/suggest-activity/:tripId/:day — AI suggest one activity
  POST   /api/ai/packing-list/:tripId        — generate packing list
```

---

## Authentication & Authorization

- On login/register the server signs a JWT (7-day expiry)
- Client stores token in a cookie via `js-cookie`
- Axios interceptor attaches `Authorization: Bearer <token>` to every request
- `protect` middleware verifies the token on all non-public routes
- **Every database query filters by `user: req.user._id`** — strict data isolation, no user can touch another's data

---

## AI Agent Design

All Claude calls live in `backend/src/services/ai.service.js`.

| Function | Purpose |
|---|---|
| `generateFullItinerary` | Full trip in one prompt: itinerary + budget + hotels + insights |
| `regenerateDay` | Replace one day, accepts optional custom request |
| `suggestActivity` | One AI-picked activity, aware of existing activities |
| `generatePackingList` | Context-aware packing checklist per trip |

Prompts instruct Claude to return **only valid JSON** (no markdown). The service strips any accidental backtick fences before parsing.

---

## Creative Features

### 1. AI Packing List (🎒 tab on every trip)
Generates a smart, destination-aware checklist across categories (Documents, Clothing, Electronics, Health, etc). Items are interactive — tap to check off with a progress bar. Essential items are flagged. Context-aware: a hiking trip gets different gear than a city break.

**Why:** Standard itinerary apps tell you what to do, not what to bring. A packing list scoped to your actual activities prevents the "I forgot my adapter" trip disasters.

### 2. Trip Personality Score (AI Insights tab)
Scores the trip 0–100 across 5 dimensions: Cultural Immersion, Adventure Level, Relaxation Factor, Budget Efficiency, Overall. Displayed as gradient progress bars.

**Why:** Lets you instantly see if the AI-generated plan matches your energy before you travel, and makes comparing two itineraries to the same destination actually useful.

---

## Deployment

### Backend (Railway / Render)
1. Set env vars from `.env.example`
2. Start command: `npm start`
3. Use MongoDB Atlas for production DB

### Frontend (Vercel / Netlify)
1. Set `VITE_API_URL=https://your-backend-url.com/api`
2. Build command: `npm run build`
3. Output dir: `dist`

---

## Known Limitations
- AI generation takes 15–30 seconds (no streaming)
- Hotel suggestions are AI-generated, not from a live booking API
- No password reset flow
- Budget figures are estimates, not live pricing
