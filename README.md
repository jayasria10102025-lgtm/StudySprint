# StudySprint – Full-Stack Focused Study Session Tracker

StudySprint is a commercial-grade, full-stack productivity web application designed for students and self-learners to track their actual focused study time across academic subjects and goals.

The application features a dark-themed React dashboard with purple and cyan accents, persistent MongoDB data storage, JWT authentication, and timestamp-based study timer accuracy.

---

## 1. Project Directory Structure

```text
studysprint/
├── backend/
│   ├── config/
│   │   └── db.js                       # Mongoose connection & in-memory fallback
│   ├── controllers/
│   │   ├── authController.js           # Register, Login, Me
│   │   ├── subjectController.js        # Subject CRUD & Safe Deletion
│   │   ├── goalController.js           # Goal CRUD & Progress Computation
│   │   ├── sessionController.js        # Active Timer Lifecycle (start/pause/resume/complete/cancel)
│   │   ├── noteController.js           # Subject-wise Notes & Keyword Search
│   │   ├── analyticsController.js      # Daily, Weekly, Monthly, Subject & Goals stats
│   │   └── userController.js           # Profile & Password Updates
│   ├── middleware/
│   │   ├── auth.js                     # JWT verification & req.user attachment
│   │   ├── errorHandler.js             # Centralized JSON error response handler
│   │   └── validate.js                 # express-validator execution middleware
│   ├── models/
│   │   ├── User.js                     # User Schema with bcrypt hashing
│   │   ├── Subject.js                  # Subject Schema with compound unique index
│   │   ├── StudyGoal.js                # Goal Schema with planned durations & dates
│   │   ├── StudySession.js             # Session Schema with status & timestamp math
│   │   └── StudyNote.js                # Notes Schema with search index
│   ├── routes/
│   │   ├── authRoutes.js               # /api/auth routes
│   │   ├── subjectRoutes.js            # /api/subjects routes
│   │   ├── goalRoutes.js               # /api/goals routes
│   │   ├── sessionRoutes.js            # /api/sessions routes
│   │   ├── noteRoutes.js               # /api/notes routes
│   │   ├── analyticsRoutes.js          # /api/analytics routes
│   │   └── userRoutes.js               # /api/users routes
│   ├── validators/
│   │   ├── authValidators.js           # Registration & login validation
│   │   ├── subjectValidators.js        # Subject validation rules
│   │   ├── goalValidators.js           # Goal duration & target date validation
│   │   ├── sessionValidators.js        # Session payload validation
│   │   ├── noteValidators.js           # Note content validation
│   │   └── userValidators.js           # Profile & password validation
│   ├── .env.example
│   ├── package.json
│   ├── server.js                       # Express app bootstrap & healthcheck
│   └── test-backend.js                 # Automated end-to-end backend test runner
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx        # Dark theme modal with safe cascade confirmation
│   │   │   ├── EmptyState.jsx          # Illustrated empty states for zero-data views
│   │   │   ├── Sidebar.jsx             # Responsive dashboard sidebar with live session pill
│   │   │   ├── StatCard.jsx            # Modern dark charcoal dashboard cards
│   │   │   └── TopHeader.jsx           # Sticky header with quick timer controls & avatar
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # User auth state, token persistence, login/logout
│   │   │   └── TimerContext.jsx        # Global timer engine with timestamp-accurate ticker
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx     # Authenticated layout with responsive drawer
│   │   ├── pages/
│   │   │   ├── AnalyticsPage.jsx       # Recharts (Daily, Weekly, Monthly, Planned vs Completed)
│   │   │   ├── DashboardPage.jsx       # Main overview with real MongoDB statistics
│   │   │   ├── FocusTimerPage.jsx      # Digital clock, circular ring, start/pause/complete
│   │   │   ├── GoalsPage.jsx           # Planned vs completed goals with live progress meters
│   │   │   ├── LandingPage.jsx         # Hero section, feature breakdown, marketing landing
│   │   │   ├── LoginPage.jsx           # Authentication with password toggle
│   │   │   ├── NotFoundPage.jsx        # 404 page
│   │   │   ├── NotesPage.jsx           # Searchable notes by subject
│   │   │   ├── RegisterPage.jsx        # Signup with duplicate email protection
│   │   │   ├── SettingsPage.jsx        # Profile and password update
│   │   │   └── SubjectsPage.jsx        # Subjects management with safe cascade protection
│   │   ├── services/
│   │   │   └── api.js                  # Axios instance with Bearer token interceptor
│   │   ├── utils/
│   │   │   └── formatters.js           # Time, duration, and date formatters
│   │   ├── App.jsx                     # Router configuration & context providers
│   │   ├── index.css                   # Tailwind dark theme directives
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── .gitignore
├── package.json                        # Root workspace scripts
└── README.md
```

---

## 2. Features Implemented

### Authentication & Security
- **JWT-based Authentication**: Secure HTTP Bearer tokens with 7-day expiration.
- **bcrypt Password Hashing**: Passwords salted with 10 rounds before saving.
- **Login Rate Limiting**: `express-rate-limit` prevents brute-force attacks on auth endpoints.
- **Ownership Verification**: Every query enforces `userId: req.user._id` to prevent unauthorized cross-user access.
- **express-validator**: Rigorous input sanitization, Mongo ID validation, and schema checks.

### Focus Timer with Timestamp Precision
- **Zero Timer Drift**: Time is computed by `accumulatedDuration + Math.floor((now - lastResumedAt) / 1000)`. Page reloads or browser suspensions never desynchronize elapsed study time.
- **Global Timer Context**: The timer continues running seamlessly across all pages without interruptions.
- **Single Active Session Constraint**: Prevents starting multiple overlapping sessions simultaneously.
- **State Controls**: Start, Pause, Resume, Complete, and Cancel.
- **Cancelled Session Safety**: Cancelled sessions set duration to 0 and are omitted from all study analytics.

### Study Goals with Live Progress
- Configure targets as Daily, Weekly, or Milestone.
- Compares planned minutes with verified study session duration from MongoDB.
- Automatically marks goals as completed when total recorded time reaches or exceeds planned target.

### Academic Subjects with Safe Deletion Protection
- Unique subject name per user.
- Color badges for visual distinction.
- Aggregated real-time metrics: Total hours studied, completed sessions, and active goals.
- **Safe Deletion Strategy**: If a user attempts to delete a subject that has linked goals, sessions, or notes, the API returns `409 Conflict` with exact counts. The frontend presents an explicit **Cascade Confirmation Dialog** to eliminate accidental orphaned records.

### Study Notes with Instant Search
- Organized by subject.
- Full-text search across note titles and content.
- Filterable by subject dropdown.

### Analytics & Visual Data (Recharts)
- **Timezone-Aware**: Automatically utilizes the client's local timezone offset to group daily study hours without offset bugs.
- **Daily Study Progress**: Bar chart of focus minutes across continuous dates.
- **Weekly Productivity**: 8-week history of study hours.
- **Subject-Wise Distribution**: Donut/Pie chart displaying percentage share of study time.
- **Planned vs Completed**: Bar chart comparing targeted duration vs actual completed study hours.
- **Filters**: Today, Last 7 Days, Last 30 Days, All Time.

---

## 3. REST API Endpoint Documentation

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Service health status and uptime | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & retrieve JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/subjects` | List subjects with aggregate stats | Yes |
| `POST` | `/api/subjects` | Create a new subject | Yes |
| `PUT` | `/api/subjects/:id` | Update subject name/description | Yes |
| `DELETE`| `/api/subjects/:id` | Safe delete subject (`?cascade=true` for cascade) | Yes |
| `GET` | `/api/goals` | List study goals with live progress % | Yes |
| `POST` | `/api/goals` | Create a study goal | Yes |
| `PUT` | `/api/goals/:id` | Update goal details or status | Yes |
| `DELETE`| `/api/goals/:id` | Delete study goal (unlinks sessions) | Yes |
| `GET` | `/api/sessions` | List recorded study sessions | Yes |
| `GET` | `/api/sessions/active` | Retrieve current running/paused session | Yes |
| `POST` | `/api/sessions/start` | Start a new study sprint session | Yes |
| `PATCH`| `/api/sessions/:id/pause` | Pause active study timer | Yes |
| `PATCH`| `/api/sessions/:id/resume`| Resume paused study timer | Yes |
| `PATCH`| `/api/sessions/:id/complete`| Complete session and record duration | Yes |
| `PATCH`| `/api/sessions/:id/cancel`| Cancel session (0 duration recorded) | Yes |
| `GET` | `/api/notes` | List notes with `?search=` and `?subjectId=` | Yes |
| `POST` | `/api/notes` | Create a new subject note | Yes |
| `PUT` | `/api/notes/:id` | Update note title or content | Yes |
| `DELETE`| `/api/notes/:id` | Delete note | Yes |
| `GET` | `/api/analytics/overview` | Overall dashboard metrics & recent sessions | Yes |
| `GET` | `/api/analytics/daily` | Daily breakdown for requested range | Yes |
| `GET` | `/api/analytics/weekly` | 8-week productivity summary | Yes |
| `GET` | `/api/analytics/monthly` | 6-month study timeline | Yes |
| `GET` | `/api/analytics/subjects` | Subject time distribution & percentages | Yes |
| `GET` | `/api/analytics/planned-vs-completed` | Goal & subject target comparison | Yes |
| `PUT` | `/api/users/profile` | Update user name and email | Yes |
| `PUT` | `/api/users/change-password` | Verify current password and update | Yes |

---

## 4. MongoDB Database Schemas

### `users` Collection
- `name`: String (required, 2-60 chars)
- `email`: String (required, unique, lowercase, regex-validated)
- `password`: String (required, bcrypt hashed)
- `timestamps`: `createdAt`, `updatedAt`

### `subjects` Collection
- `userId`: ObjectId -> `users` (required, indexed)
- `name`: String (required, 1-80 chars)
- `description`: String (max 300 chars)
- `color`: String (hex code)
- `indexes`: Compound unique index `{ userId: 1, name: 1 }`
- `timestamps`: `createdAt`, `updatedAt`

### `studygoals` Collection
- `userId`: ObjectId -> `users` (required, indexed)
- `subjectId`: ObjectId -> `subjects` (required, indexed)
- `title`: String (required, 1-120 chars)
- `description`: String (max 500 chars)
- `plannedDuration`: Number (in minutes, min: 1)
- `targetDate`: Date (required)
- `goalType`: String enum `['daily', 'weekly', 'custom']`
- `status`: String enum `['in_progress', 'completed']`
- `timestamps`: `createdAt`, `updatedAt`

### `studysessions` Collection
- `userId`: ObjectId -> `users` (required, indexed)
- `subjectId`: ObjectId -> `subjects` (required, indexed)
- `goalId`: ObjectId -> `studygoals` (optional, indexed)
- `title`: String (required, 1-120 chars)
- `description`: String (max 500 chars)
- `startTime`: Date (required)
- `endTime`: Date (null while running)
- `duration`: Number (seconds saved upon completion)
- `status`: String enum `['active', 'paused', 'completed', 'cancelled']`
- `accumulatedDuration`: Number (accumulated seconds from earlier paused segments)
- `lastResumedAt`: Date (timestamp used for drift-free elapsed math)
- `timestamps`: `createdAt`, `updatedAt`

### `studynotes` Collection
- `userId`: ObjectId -> `users` (required, indexed)
- `subjectId`: ObjectId -> `subjects` (required, indexed)
- `title`: String (required, 1-150 chars)
- `content`: String (required)
- `indexes`: Text index on `{ title: 'text', content: 'text' }`
- `timestamps`: `createdAt`, `updatedAt`

---

## 5. Environment Variables

### Backend (`backend/.env`)
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/studysprint
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```
*(Note: If no local MongoDB is running, the backend automatically boots a built-in memory runner for development and automated test suites).*

### Frontend (`frontend/.env`)
```ini
VITE_API_URL=http://localhost:5000/api
```

---

## 6. Local Setup and Execution Instructions

### Prerequisites
- Node.js (v18, v20, or higher)
- npm (v9 or higher)

### Option A: Quickstart from Root
1. Install all dependencies:
   ```bash
   npm run install:all
   ```
2. Start the Backend API:
   ```bash
   npm run backend
   ```
3. In a separate terminal, start the Frontend:
   ```bash
   npm run frontend
   ```
4. Open your browser at:
   ```text
   http://localhost:5173
   ```

### Option B: Running Directories Individually
1. **Backend**:
   ```bash
   cd backend
   npm install
   npm start
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 7. Verification and Testing

Execute the automated backend verification suite covering all 12 core acceptance checks:
```bash
npm run test:backend
```

**Verification Results:**
- `✓ Health check endpoint`: Status 200 OK
- `✓ User registration`: JWT token returned, password hashed
- `✓ Duplicate email rejection`: HTTP 409
- `✓ Login authentication`: Verified invalid & valid password check
- `✓ Protected /api/auth/me`: Authenticated user identity retrieved
- `✓ Subject creation`: Created with color & compound index
- `✓ Duplicate subject rejection`: HTTP 409
- `✓ Study Goal creation`: Weekly milestone established
- `✓ Focus Timer lifecycle`: start -> active check -> pause -> resume -> complete
- `✓ Study Notes`: Created & searched via regex / text indexing
- `✓ Analytics calculations`: Overview, Daily 7-day timeline, Subject share, Planned vs Completed
- `✓ Safe Subject Deletion protection`: HTTP 409 returned when relations exist; clean cascade deletion when confirmed

To verify the frontend production build:
```bash
cd frontend
npm run build
```
*(Builds with 0 errors and optimized bundle split into vendor, recharts, icons, and page assets).*

---

## 8. Deployment Preparation

### A. Cloud Database: MongoDB Atlas
1. Create a free M0 cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Network Access**, add `0.0.0.0/0` (or Render's outbound IPs).
3. Under **Database Access**, create an application database user and password.
4. Obtain the connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/studysprint?retryWrites=true&w=majority`.

### B. Cloud Hosting: Render.com
#### Deploying Backend
1. Connect your GitHub repository to Render and choose **New Web Service**.
2. **Root Directory**: `backend`
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   - `JWT_SECRET`: `<Strong random 64-char secret>`
   - `ALLOWED_ORIGINS`: `https://your-frontend-app.onrender.com`

#### Deploying Frontend
1. In Render, choose **New Static Site**.
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Publish Directory**: `dist`
5. **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend-app.onrender.com/api`
6. Add Rewrite Rule: Source: `/*`, Destination: `/index.html` (for React client-side routing).

