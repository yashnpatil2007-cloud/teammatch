# TeamMatch – AI-Powered Teammate Discovery & Hackathon Platform

[![Frontend Build](https://img.shields.io/badge/Frontend-Vite%20%2B%20React%2019-646CFF?logo=vite)](https://teammatch.netlify.app)
[![Backend API](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js)](https://teammatch-api.onrender.com)
[![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb)](https://mongodb.com)
[![Deployment](https://img.shields.io/badge/Deployment-Render%20%2B%20Netlify-00C7B7?logo=render)](https://github.com/yashnpatil2007-cloud/teammatch)

**TeamMatch** is a modern, comprehensive AI-powered platform for teammate discovery, complementary team formation, assessment intelligence, collaborative project workspaces, and hackathon project evaluation.

---

## 🚀 Key Platform Features

### 1. Smart Teammate Matching & Compatibility Engine 2.0
- **Multi-Dimensional Compatibility Scoring:**
  - *Technical Skill Fit (30%):* Weighted technical alignment against required problem technologies.
  - *Team Gap Closing Synergy (20%):* Prioritizes complementary skill closure over identical skill clones.
  - *Working-Style Chemistry (20%):* Balances team archetypes (e.g., pairing *Systems Architects* with *Fast Prototypers* and *Reliable Anchors*).
  - *Aptitude Acumen (15%):* Quantitative logical reasoning and problem-solving metrics.
  - *Platform Reliability (10%):* Verified badges, peer reviews, and certificate credentials.
  - *Active Availability (5%):* Weekly committed hours and capacity bandwidth.
- **Explainable AI Rationales:** Transparent natural language explanations justifying why a candidate complements the team.
- **Alternative Strategic Lineups:** Generates *Balanced All-Rounder*, *Fast Prototyping Velocity*, and *Architectural Depth* team formations.
- **Team Synergy & Redundancy Warnings:** Visual 360° radar balance chart, vacancy detector, and duplicate concentration alerts.

### 2. Assessment Intelligence & Skill Verification
- **Aptitude & Logical Reasoning:** 10 timed questions assessing Deductive Logic, Numerical Reasoning, and Pattern Recognition with server-side objective grading and badge awards (`Bronze`, `Silver`, `Gold`, `Platinum`).
- **Personality & Working-Style:** 10 situational workplace scenarios evaluating Execution, Innovation, Empathy, Leadership, and Quality Assurance, classifying candidates into 5 core archetypes.
- **Technical Skill Verification:** Multi-domain question bank covering React, Python, Node.js, Machine Learning, UI/UX Design, DevOps, and Algorithms.

### 3. Team Collaboration Workspace
- **Kanban Task Board:** Interactive drag-and-drop / status progression (`To Do`, `In Progress`, `Completed`), priorities (`Low`, `Medium`, `High`), and member assignment.
- **Milestone Tracker:** Project deadlines and delivery phase checkpoints.
- **Shared Resource Hub:** Collaborative links for Figma, GitHub repositories, documentation, and cloud assets.
- **Audit Activity Timeline:** Bounded circular audit trail recording all project events.
- **Team Discussion Feed:** Real-time team messaging channel with 10-second polling and member-only security.

### 4. Project Submission & Evaluation Engine
- **Leader Project Submission:** Draft saving (`status: 'draft'`) and final submission (`status: 'submitted'`) tracking title, description, GitHub URL, live demo, presentation slides, and attachments.
- **Secure File Storage Abstraction:** Supports multi-format uploads up to 20MB (`PDF`, `PPT`, `PPTX`, `DOC`, `DOCX`, `ZIP`, `PNG`, `JPG`, `WEBP`) with automatic AWS S3 and Cloudinary cloud detection.
- **Organizer & Admin Evaluation Queue:** Comprehensive review modal featuring 0–100 grading, written feedback, revision requests, and instant approval workflows.

### 5. Notifications & Real Database Analytics
- **Topbar Notification Drawer:** Real-time in-app notification drawer with 30-second polling, unread badges, and 10-minute duplicate suppression.
- **Admin Analytics Dashboard:** 100% database-derived analytics (zero synthetic metrics), tracking real registration growth, role distributions, submission pipelines, and team collaboration statistics.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, React Router 7, Recharts, Framer Motion, Lucide React, Axios |
| **Backend API** | Node.js (>=18), Express 5, Mongoose 9, Multer 2, Bcryptjs, JSON Web Tokens (JWT), Express Rate Limit, Helmet |
| **Database** | MongoDB Atlas (Native Mongoose collections) + Resilient local fallback store (`store.js`) |
| **File Storage** | AWS S3 / Cloudinary cloud storage abstraction (`storageService.js`) with safe URL resolver |
| **Hosting** | Render (Express Web Service) + Netlify (React SPA) |

---

## 📦 Project Structure

```
teammatch/
├── backend/
│   ├── src/
│   │   ├── config/             # Database connection & MongoDB options
│   │   ├── controllers/        # Request handlers (auth, team, matching, workspace, submission, stats)
│   │   ├── data/               # Seed data, store abstraction, migration script
│   │   ├── middleware/         # JWT authentication, role authorization, file uploads
│   │   ├── models/             # Mongoose schemas (User, Team, Problem, Task, Message, Submission, Notification)
│   │   ├── routes/             # Express API route declarations
│   │   ├── services/           # Matching Engine 2.0, Storage Service abstraction
│   │   ├── utils/              # Token generation, notifications dispatcher
│   │   └── server.js           # Express app entry point
│   ├── package.json
│   └── .env.example
├── src/
│   ├── components/             # Reusable UI components (Navbar, Sidebar, Topbar, Modals, Cards)
│   ├── pages/                  # Route views (Landing, Matching, Workspace, Assessment, Admin, Organizer)
│   ├── services/               # Axios API client modules
│   ├── App.jsx                 # Route declarations & lazy-loaded view definitions
│   └── main.jsx
├── public/
├── render.yaml                 # Render infrastructure-as-code deployment configuration
├── netlify.toml                # Netlify SPA build and redirect rules
└── package.json
```

---

## 💻 Local Development Setup

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- (Optional) MongoDB local or MongoDB Atlas connection string

### 1. Clone the repository
```bash
git clone https://github.com/yashnpatil2007-cloud/teammatch.git
cd teammatch
```

### 2. Configure Environment Variables
Copy the example environment files:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Configure `backend/.env`:
```env
PORT=5000
NODE_ENV=development
USE_MONGO=false
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/teammatch?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

### 3. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 4. Start the Application
Run the backend and frontend development servers:

```bash
# In terminal 1 (Backend):
cd backend
npm run dev

# In terminal 2 (Frontend):
npm run dev
```

Frontend will run at `http://localhost:5173` and Backend API at `http://localhost:5000`.

---

## 🧪 Testing & Verification

Run the platform verification test suites:

```bash
# Run Step 5 Real Admin Analytics Tests
node scratch/test_step5_analytics.cjs

# Run Step 3 & 4 Submissions & Notifications Tests
node scratch/test_step3_step4.cjs

# Run Step 1 & 2 Workspace & Collaboration Tests
node scratch/test_step1_step2.cjs

# Run Phase 4 Matching & Synergy Tests
node scratch/test_phase4.cjs

# Run Phase 3 Assessment Intelligence Tests
node scratch/test_phase3.cjs

# Run Full System Regression Suite
node scratch/test_full_suite.cjs
```

---

## 🌐 Production Deployment

### Backend (Render)
1. Fork or push repository to GitHub.
2. In Render, create a new **Web Service** connected to the repository.
3. Configuration:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
4. Set Environment Variables:
   - `NODE_ENV=production`
   - `USE_MONGO=true`
   - `MONGO_URI=<your-mongodb-atlas-uri>`
   - `JWT_SECRET=<long-random-secret>`
   - `JWT_EXPIRE=7d`
   - `FRONTEND_URL=https://teammatch.netlify.app`
   - (Optional S3): `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
   - (Optional Cloudinary): `CLOUDINARY_URL`

### Frontend (Netlify)
1. In Netlify, create a new site from the GitHub repository.
2. Build Settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
3. Environment Variables:
   - `VITE_API_URL=https://teammatch-api.onrender.com/api`

---

## 🔒 Security Best Practices
- Strict CORS validation restricting cross-origin requests to configured origins.
- Rate limiting on authentication endpoints (`/api/auth`).
- Native bcrypt password hashing.
- Role-Based Access Control (`admin`, `organizer`, `leader`, `member`).
- Ephemeral filesystem prevention via cloud storage abstraction.
- Zero secret exposure: `.env` and sensitive credentials ignored in git.

---

## 📄 License
MIT License. Built for university innovation challenges and hackathons.
