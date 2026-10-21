# TeamMatch — Complete SaaS Platform Folder Structure

```
teammatch/
├── index.html
├── vite.config.js          # @tailwindcss/vite + @vitejs/plugin-react
├── package.json            # frontend
├── .env.example
│
├── src/                    # FRONTEND (React + Vite)
│   ├── main.jsx
│   ├── index.css           # Tailwind v4 + theme (Inter/Poppins)
│   ├── App.jsx             # BrowserRouter + Role-Based Protected Routes
│   │
│   ├── context/
│   │   ├── AuthContext.jsx     # JWT + localStorage + demo fallback
│   │   └── ThemeContext.jsx    # dark/light toggle via html.dark
│   │
│   ├── services/
│   │   └── api.js              # axios instance + mockLogin helper
│   │
│   ├── lib/
│   │   └── mockData.js
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   └── Card.jsx
│   │   ├── landing/            # (Landing sections extracted to pages/Landing.jsx)
│   │   └── dashboard/
│   │       ├── Layout.jsx      # Sidebar + Topbar + Outlet
│   │       ├── Sidebar.jsx     # roleNav (organizer/leader/member/admin)
│   │       └── Topbar.jsx      # search + theme toggle + profile + logout
│   │
│   └── pages/
│       ├── Landing.jsx         # Premium SaaS landing (Hero, Features, etc.)
│       ├── Auth/
│       │   ├── Login.jsx       # email + role quick-switch + demo123
│       │   └── Register.jsx    # organizer / leader / member selector
│       ├── Organizer/
│       │   ├── Dashboard.jsx   # Upload Problem, Team Limits, Participants, Analytics (Recharts)
│       │   └── Analyzer.jsx    # AI Problem Analysis (skills/roles/difficulty)
│       ├── Leader/
│       │   └── Dashboard.jsx   # Create Team, Invites, Accept/Reject
│       ├── Member/
│       │   ├── Dashboard.jsx   # Profile, Skills, Certificates, GitHub, Reliability, Radar
│       │   └── Quizzes.jsx     # MCQ Levels 1-10, Score→Badge (Bronze/Silver/Gold/Platinum)
│       ├── Matching.jsx        # AI Team Matching (match %, missing skills, recommendations)
│       ├── Strength.jsx        # Team Strength Analyzer (coverage, radar, balance)
│       ├── Reviews.jsx         # Leader↔Member reviews + ratings
│       ├── Leaderboard.jsx     # Top Members/Teams/Skills/Reliability
│       └── Admin/
│           └── Dashboard.jsx   # Manage Users/Problems/Quizzes/Certificates + charts
│
└── backend/                # BACKEND (Node.js + Express + MongoDB)
    ├── package.json
    ├── .env                # PORT, MONGO_URI, JWT_SECRET, FRONTEND_URL
    └── src/
        ├── server.js       # express + helmet + cors + morgan + routes
        ├── config/
        │   └── db.js       # mongoose.connect with MOCK fallback
        ├── middleware/
        │   └── auth.js     # protect (Bearer JWT) + authorize(...roles)
        ├── models/
        │   ├── User.js         # skills[], certificates[], quizScores[], reliabilityScore
        │   ├── ProblemStatement.js
        │   ├── Team.js         # coverage, balanceScore, invites[]
        │   ├── Review.js
        │   └── Quiz.js
        ├── services/
        │   ├── aiAnalyzer.js   # keyword extraction → requiredSkills/Roles/Difficulty
        │   └── matchingEngine.js # calculateMatch() + teamCoverage()
        ├── controllers/
        │   ├── authController.js   # register/login/me (DB + mock fallback + demo accounts)
        │   ├── problemController.js
        │   ├── teamController.js
        │   ├── userController.js   # leaderboard, profile, quizSubmit (badge logic)
        │   └── reviewController (in routes/review.js)
        ├── routes/
        │   ├── auth.js     # POST /register, /login, GET /me
        │   ├── problem.js  # GET /, GET /:id, POST /, POST /analyze
        │   ├── team.js     # GET /, POST /, GET /match, GET /:teamId/analyze, POST /:teamId/invite
        │   ├── user.js     # GET /leaderboard, GET /:id, PUT /profile, POST /quiz
        │   └── review.js   # POST /, GET /:userId
        └── utils/
            └── generateToken.js # jwt.sign + asyncHandler

```

## Tech Stack
- **Frontend:** React 19, Vite 8, Tailwind CSS 4, Framer Motion, Lucide, Recharts, React Router v6, Axios, Context API
- **Backend:** Express 5, Mongoose 9, JWT, bcryptjs, Helmet, Morgan, Multer, CORS
- **Auth:** JWT (7d) + Role-Based Access (organizer/leader/member/admin)
- **AI Mock:** Rule-based analyzer + matching engine (no external API required, drop-in for OpenAI)

## Demo Accounts (password: demo123)
- organizer@demo.com / leader@demo.com / member@demo.com / admin@demo.com
