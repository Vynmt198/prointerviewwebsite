# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProInterview is a full-stack interview preparation SaaS platform. It is a monorepo with separate `frontend/` (Vite + React) and `backend/` (Express.js + MongoDB) directories. Documentation files (README, API_INDEX, ROADMAP, DATABASE) are in Vietnamese.

## Development Commands

### Backend (`backend/`)
```bash
npm run dev          # Start dev server with nodemon (port 5000)
npm start            # Start production server
npm run seed:users   # Seed default dev accounts (only if users collection is empty)
npm run seed:all     # Seed all mock data
npm run db:prune-fake-mentors  # Remove orphaned Mentor docs with no matching User
```

### Frontend (`frontend/`)
```bash
npm run dev          # Vite dev server (port 5173), proxies /api → localhost:5000
npm run build        # Production build to dist/
npm run dev:full     # Run frontend + backend concurrently
```

### Dev Accounts (after seeding)
Default password for all dev accounts: `Dev123456`
- `customer@dev.local` — plan: free
- `mentor@dev.local` — role: mentor
- `admin@dev.local` — role: admin

## Environment Setup

**Backend `backend/.env` (required):**
```env
MONGO_URI=mongodb://127.0.0.1:27017/prointerview
JWT_SECRET=<long-secret>
CORS_ORIGIN=http://localhost:5173
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=<from-GCP>
ADMIN_INVITE_CODE=<optional>
```

**Frontend `frontend/.env.local` (optional for dev — Vite proxy handles `/api`):**
```env
VITE_GOOGLE_CLIENT_ID=<same-as-backend>
VITE_API_URL=http://localhost:5000
```

## Architecture

### Backend (`backend/src/`)

**Pattern:** Route → Controller → Service → Mongoose Model

- `index.js` — server entry, mounts all routers
- `routes/` — 6 Express routers: `auth`, `mentors`, `bookings`, `payments`, `plans`, `users`
- `controllers/` — thin handlers that call services and return JSON
- `services/` — business logic: `authService`, `bookingsService`, `dashboardStatsService`, `mentorProfileService`, `mentorsService`, `paymentsService`, `plansService`, `userRoleService`
- `models/` — 15 Mongoose schemas (User, Mentor, Booking, CVAnalysis, InterviewSession, Course, Enrollment, Review, Notification, Payment, Subscription, Report, Activity, CourseQA, MentorPeerReview)
- `middleware/` — `authJwt` (JWT → `req.userId`), `requireAdmin` (role check)
- `db/` — MongoDB connection via `MONGO_URI`
- `scripts/` — one-off utilities (seed, sync, prune)
- `data/` — seed JSON files

**API response format:**
```js
// Success
{ success: true, user: {...} }       // or mentors: [...] etc.
// Error
{ success: false, error: "message" }
```

**Auth:** Bearer JWT in `Authorization` header. Token issued on login/Google-auth. `authJwt` middleware injects `req.userId` (from `sub` claim).

**Roles:** `customer` (default), `mentor`, `admin`. Admin routes protected by `requireAdmin` middleware. `PATCH /api/users/:id/role` — admin cấp quyền role cho user.

### Frontend (`frontend/src/app/`)

- `pages/` — route-based pages organized by domain: `auth/`, `home/`, `cv/`, `interview/`, `mentors/`, `booking/`, `courses/`, `account/`, `mentor/`, `admin/`
- `components/` — feature components (`ui/`, `shared/`, `layout/`, `auth/`, `mentor/`, `interview/`, `cv/`, `courses/`, `figma/`, `home/`, `modals/`)
- `hooks/` — custom hooks (e.g., `useDIDStream.js` for D-ID avatar API)
- `utils/` — API helpers per domain: `auth.js`, `mentorApi.js`, `bookingsApi.js`, `bookings.js`, `bookingMappers.js`, `paymentsApi.js`, `plansApi.js`, `dashboardApi.js`, `aiDialogue.js`, `api.js`, `history.js`, `meetings.js`
- `routes.js` — React Router 7 config
- `App.jsx` — root: calls `restoreSession()` on mount, shows loader until auth state resolves

**Routing:** Hash-based. `AppLayout` wraps user-facing routes; `AdminLayout` wraps `/admin/*`.

**Auth state:** Stored in localStorage keys `prointerview_access_token` and `prointerview_auth`. `restoreSession()` in `App.jsx` reads these and verifies via `GET /api/auth/me`.

### External Integrations (Frontend calls directly, not through backend)

- **Supabase Edge Functions** — CV analysis and JD comparison
- **D-ID Streaming API** — AI avatar for mock interviews
- **Google Identity Services (GIS)** — OAuth; frontend gets ID token, sends to `POST /api/auth/google`

## Key Domain Concepts

**Plans & Quota:** Users have a `plan` field (`free`, `starter_pro`, `elite_pro`) with `planExpiresAt`. Quota fields on User (`cvAnalysisUsed`, `interviewUsed`) track feature usage against plan limits.

**Mentor flow:** A user with `role=mentor` must also have a `Mentor` document (linked by `userId`). The `syncMentorProfiles` script creates missing Mentor docs. Mentor profiles have a separate `publicId` for public-facing URLs.

**Bookings:** Include pricing breakdown (`price`, `platformFee`, `vat`, `totalAmount`), payment status, and a `rescheduleHistory` array.

**Payments:** MoMo and ZaloPay webhook routes exist but payment logic is partially stubbed. See `ROADMAP.md` for planned implementation phases.

## Development Roadmap Context

See `ROADMAP.md` and `API_INDEX.md` for the phased plan. **Phase 1 is complete** (bookings CRUD, payments initiate/webhook/history, plans current/activate/cancel, dashboard-stats). **Phase 2 (current focus)** covers mentor operations: mentor dashboard/schedule/finance/analytics, booking confirm/complete/notes, availability management, reviews, and reports. ~40+ additional endpoints planned but not yet implemented. When adding new endpoints, follow the existing Controller → Service → Model pattern and mount the router in `src/index.js`.