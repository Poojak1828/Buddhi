# 🧠 BUDDHI – Your Personal AI Study Companion

> **Flip the Switch Hackathon 2026 – WeMakeDevs**  
> **Track 2: Best Personal or Creative Workflow**  
> *"Buddhi is not merely an AI chatbot. It is an AI study teammate that collaborates with students through Switch-connected communication rooms, plans tasks, generates learning material, adapts schedules with psychological empathy, and synchronizes live with a full-stack web application."*

---

## 🌟 Executive Summary & Problem Statement

Students preparing for examinations (Class 1–10 school boards, Class 11–12 NEET/JEE entrance tests, or college degrees) face severe cognitive fragmentation:
- **Tool Sprawl**: Notes in one app, flashcards in another, calendar deadlines scattered across spreadsheets, and study timers on their phones.
- **Academic Burnout & Shame**: Traditional productivity trackers induce guilt when students fall behind, triggering anxiety and avoidance.
- **Isolation**: Studying in solitude lacks the collaborative accountability of an active teammate.

**BUDDHI solves this by uniting a full-stack learning platform with an empathetic AI teammate powered by Switch.**

---

## 🚀 Key Features

| Feature | Description |
|---|---|
| 🌐 **Modern SaaS Landing Page** | High-converting dark-themed landing page explaining the platform, interactive previews, and Switch workflow showcase. |
| 🔐 **Authentication & Security** | JWT authentication, bcrypt password hashing, session recovery, and a **1-click Demo Login** for hackathon judges (`student@buddhi.ai` / `Buddhi2026!`). |
| 🎓 **Student Onboarding** | Multi-step personalization capturing academic level (School, NEET/JEE, Degree), target exams, daily study hours, and psychological goals. |
| 📊 **Command Center Dashboard** | Today's study action items, 8-day streak tracker, countdown to upcoming exam dates, weekly focus hours chart, and syllabus mastery bars. |
| 📚 **Subject & Syllabus Manager** | Hierarchical chapter and topic manager with difficulty ratings, completion toggles, and real-time syllabus percentage calculations. |
| 📅 **AI Adaptive Study Planner** | Takes course syllabi, exam dates, and available hours; divides them into manageable daily tasks with built-in revision checkpoints. |
| 🧠 **AI Assistant (Psychological Empathy)** | Conversational AI tutor conditioned with student counseling principles. Detects exam fatigue, never shames, and breaks down concepts into intuitive mental models. |
| 📝 **Notes & Markdown Repository** | Rich notes manager with full-text search, subject tagging, **AI Note Summarization**, and **1-click Flashcard generation from notes**. |
| 🗂️ **AI Flashcard Deck & 3D Recall** | Interactive 3D flip card study session with "I Knew This" (Mastered) vs "Needs Practice" (Review) cognitive tracking. |
| ❓ **AI Diagnostic Quizzes** | Generates tailored MCQs with answer navigation, instant scoring, supportive feedback, and concept explanations. |
| ⏱️ **Pomodoro Focus Timer** | 25m Focus / 5m Short Break / 15m Long Break intervals with audio/confetti triggers, logging sessions directly to PostgreSQL. |
| 📈 **Progress & Analytics** | Dynamic analytics computing total study hours, past-7-days focus trends, quiz accuracy, and task completion rates using live database data. |
| 🤖 **Switch Teammate Hub** | Interactive live simulator and webhook gateway connecting **Mattermost** and **Switch Console** directly to the Buddhi database! |
| ⚙️ **Settings & Learning Profile** | Edit profile, academic track, routine preferences, target scores, and API key configuration. |

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Lucide React icons, Canvas Confetti.
- **Backend**: Node.js, Express.js, TypeScript, REST API architecture, JWT, bcryptjs, Zod.
- **Database**: PostgreSQL 18, Prisma ORM, migrations, and comprehensive seed data.
- **AI Engine**: Modular AI Service supporting Google Gemini API (`@google/generative-ai`), OpenAI compatibility, and an Intelligent Clinical Fallback Engine for zero-friction demoing.
- **Switch Protocol**: Switch Console Desktop, Mattermost room connector, Switch Agent manifest, and webhook synchronization bridge (`POST /api/switch/webhook`).

---

## 🏗️ Dual Workflow Architecture

```
Student ────> Buddhi Frontend (Vite + React) ────> Express REST API ────> PostgreSQL
   │                                                    ▲
   └──> Mattermost Room ───> Switch Console ──(Webhook)─┘
```

1. **Web Workflow**: The student manages subjects, generates flashcards, and checks off daily tasks on the web dashboard.
2. **Switch Teammate Workflow**: The student chats with `@buddhi` inside a Mattermost study room (`#buddhi-study-room`).
3. **Information Sharing**: When the student reports `"Completed task #1"` in Mattermost, the Switch agent marks the task completed in PostgreSQL. When the student opens the Buddhi Web Dashboard, the task is **already checked off** in real time!
4. **Empathetic Rescheduling**: When a student reports feeling overwhelmed, the Switch agent automatically reorganizes the schedule (+2 day rest buffer) and logs an `AgentAction`.

---

## 🏁 Quickstart & Installation

### Prerequisites
- Node.js v18+ (tested on v22.20.0)
- PostgreSQL (local instance or port 5433 zero-config cluster)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-username/buddhi.git
cd buddhi

# Install all dependencies across monorepo
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and `backend/.env`:
```bash
cp .env.example .env
cp .env.example backend/.env
```

*(By default, `.env` is pre-configured to connect to the local PostgreSQL database on port 5433 with user `postgres` and trust authentication).*

### 3. Initialize & Seed Database
```bash
# 1. Start the PostgreSQL cluster
npm run db:start

# 2. Push schema to database
npm run db:migrate

# 3. Seed demo student Aarav Sharma with subjects, tasks, and analytics
npm run db:seed
```

### 4. Run Frontend and Backend Concurrently
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:5000/api`
- **Switch Webhook**: `http://localhost:5000/api/switch/webhook`

---

## ⚡ 1-Click Demo Login for Evaluators

You don't need to create an account from scratch:
1. Open `http://localhost:5173/login`.
2. Click the **"⚡ Demo Login"** button.
3. Credentials:
   - **Email**: `student@buddhi.ai`
   - **Password**: `Buddhi2026!`
4. You are immediately placed into Aarav Sharma's command center with 3 subjects, 8-day streak, active tasks, flashcards, and analytics charts!

---

## 🤖 Switch Teammate Demo & Verification

You can verify the Switch integration using three methods:

### Method 1: The Automated End-to-End Examination Test (Recommended)
Run the dedicated examination workflow test:
```bash
npm run test:switch-exam
```
This tests:
1. Student announces upcoming CBSE Class 12 Physics Board Examination.
2. Agent detects subject, parses syllabus, calculates milestone tasks, and updates exam date in PostgreSQL.
3. Student approves plan in chat (`"Yes, approve plan"`).
4. Agent activates 21 structured tasks into the database.
5. Student requests practice quiz (`"Give me a quick diagnostic quiz on Optics"`), which is generated and persisted directly into PostgreSQL.
6. Student marks task completed (`"Completed task #1"`), which live-syncs the student's streak and progress.

### Method 2: The Built-in Switch Web Hub
1. Navigate to `http://localhost:5173/switch-hub` on the Buddhi web app.
2. Click any of the pre-set test prompts in the live simulator:
   - *"What are my pending tasks?"*
   - *"I am falling behind in Physics, please reorganize my schedule"*
   - *"Give me a quick quiz to test my concepts"*
   - *"Completed task #1"*
3. Watch the Buddhi Study Teammate respond in real time and see the database audit table update immediately!

### Method 3: The Standalone Switch CLI Runner
Run the interactive Switch demonstration script in your terminal:
```bash
npm run switch:demo
```
This executes `backend/src/switch/demo-runner.ts` and steps through the 4 core hackathon workflow stages directly against PostgreSQL.

---

## 📁 Repository Structure

```
buddhi/
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI widgets
│   │   ├── contexts/         # AuthContext with session & demo login
│   │   ├── layouts/          # DashboardLayout with sidebar & header
│   │   ├── pages/            # 11 complete application pages
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   ├── OnboardingPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── SubjectsPage.tsx
│   │   │   ├── StudyPlannerPage.tsx
│   │   │   ├── AIAssistantPage.tsx
│   │   │   ├── NotesPage.tsx
│   │   │   ├── FlashcardsPage.tsx
│   │   │   ├── QuizzesPage.tsx
│   │   │   ├── FocusTimerPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   ├── SwitchHubPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── services/         # Centralized API service (api.ts)
│   │   └── types/            # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── ai/               # AI Service with psychological empathy & Gemini
│   │   ├── config/           # Database & environment configuration
│   │   ├── controllers/      # 10 Express REST controllers
│   │   ├── middleware/       # JWT auth & error handling
│   │   ├── routes/           # REST API endpoints
│   │   ├── switch/           # Switch Agent Service & CLI Runner
│   │   └── server.ts         # Express server entry point
│   ├── prisma/
│   │   ├── schema.prisma     # Relational database models
│   │   └── seed.ts           # Demo student database seed
│   └── package.json
│
├── switch/
│   ├── agent-instructions/   # Switch agent manifest & system prompt
│   └── documentation/        # Switch & Mattermost setup guide
│
├── docs/
│   └── architecture.md       # High-level architecture & dual workflow diagrams
│
├── scripts/
│   └── db-manage.js          # PostgreSQL cluster management script
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

---

## 🧪 Tests Performed & Verification

| Test Case | Method | Result |
|---|---|---|
| PostgreSQL Connectivity | User-space database cluster initialized on port 5433 | `PASSED` (DB created, schema loaded) |
| Prisma Schema & Migrations | `npx prisma db push` | `PASSED` (All 15 relational tables created) |
| Database Seeding | `npx tsx prisma/seed.ts` | `PASSED` (Demo student, 3 subjects, tasks, flashcards created) |
| Backend TypeScript Build | `tsc -p backend/tsconfig.json --noEmit` | `PASSED` (0 errors) |
| Backend Server Startup | `tsx watch src/server.ts` | `PASSED` (Listening on port 5000, `/health` HTTP 200) |
| REST API Authentication | JWT login & protected `/api/analytics` query | `PASSED` (Token verified, user stats returned) |
| Switch CLI Runner | `npm run switch:demo` | `PASSED` (4 workflow stages executed, tasks synced in DB) |
| Switch Webhook Protocol | `POST /api/switch/webhook` | `PASSED` (Mattermost format payload processed) |
| Frontend TypeScript & Vite Build | `npm --prefix frontend run build` | `PASSED` (Vite v6.4 built production assets in 10s) |
| Frontend Server | Vite dev server on `http://localhost:5173` | `PASSED` (HTTP 200 OK) |

---

## 🏆 Flip the Switch Hackathon Demonstration Workflow

When presenting to hackathon judges:
1. **Show the Problem & Landing Page**: Open `http://localhost:5173` to demonstrate the value proposition and SaaS aesthetic.
2. **Demo Login**: Click *"⚡ Demo Login"* to immediately enter Aarav Sharma's live dashboard.
3. **Review Syllabus & Tasks**: Showcase the 3 subjects, progress bars, and check off a task (watching confetti and real-time database update).
4. **Generate an AI Study Plan**: Go to `/planner`, select a subject, and click *"Synthesize Study Schedule"*. Approve the plan to show tasks being created in PostgreSQL.
5. **Demonstrate Psychological Empathy**: Open `/assistant` and send: *"I'm feeling so anxious about exams and falling behind"*. Notice the supportive, non-shaming coaching.
6. **Showcase Switch Integration**: Open `/switch-hub` and trigger *"What are my pending tasks?"* and *"Completed task #1"*. Explain how Switch bridges Mattermost with the Buddhi database.
7. **Run the CLI Demo**: Execute `npm run switch:demo` in terminal to show the command-line agent communication bridge in action.

---

## 📄 License
This project is open-source under the MIT License for the **Flip the Switch Hackathon 2026**.
