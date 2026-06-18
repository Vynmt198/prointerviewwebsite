# API clients (`src/app/api/`)

Gọi HTTP tới backend Express (`/api/*`). Dùng `authFetch` từ `utils/auth/auth.js` cho route cần JWT.

| File | Domain |
|:-----|:-------|
| `http.js` | `API_BASE_URL`, `apiUrl()`, `apiGet()` |
| `bookingsApi.js` | Bookings |
| `mentorApi.js` | Mentors |
| `courseApi.js` | Courses |
| `cvApi.js` | CV analyses / quota |
| `adminApi.js` | Admin |
| `paymentsApi.js` | Payments / transfer |
| `plansApi.js` | Subscription plans |
| `enrollmentApi.js` | Enrollments |
| `interviewsApi.js` | AI interview sessions |
| `notificationApi.js` | Notifications |
| `dashboardApi.js` | Dashboard stats |
| `uploadApi.js` | File upload |
| `reviewsApi.js` / `reportsApi.js` | Reviews & reports |
| `achievementsApi.js` | Achievements |
