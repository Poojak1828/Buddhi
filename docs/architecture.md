# BUDDHI – System Architecture & Switch Workflow Documentation

Flip the Switch Hackathon 2026 – WeMakeDevs  
Track 2: Best Personal or Creative Workflow  

---

## 1. High-Level Architecture Diagram

Buddhi operates across two interconnected human-agent workflows that share a unified PostgreSQL database:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STUDENT / USER WORKFLOW                           │
└───────────────────────┬─────────────────────────────┬───────────────────────┘
                        │                             │
                        ▼                             ▼
        ┌───────────────────────────────┐     ┌───────────────────────────────┐
        │       Buddhi Web App          │     │    Mattermost Study Room      │
        │    (Vite + React + TS)        │     │  (Channel: buddhi-study-room) │
        └───────────────┬───────────────┘     └───────────────┬───────────────┘
                        │                             │
                        │                             ▼
                        │                     ┌───────────────────────────────┐
                        │                     │        Switch Console         │
                        │                     │ (Agent Protocol & Router)     │
                        │                     └───────────────┬───────────────┘
                        │                                     │
                        │ REST / JSON                         │ Webhook Event
                        ▼                                     ▼
        ┌─────────────────────────────────────────────────────────────────────┐
        │                        Express.js Backend API                       │
        │                                                                     │
        │  ├── /api/auth          ├── /api/subjects      ├── /api/planner     │
        │  ├── /api/assistant     ├── /api/notes         ├── /api/flashcards  │
        │  ├── /api/quizzes       ├── /api/timer         ├── /api/analytics   │
        │  └── /api/switch/webhook (Switch Teammate Protocol)                 │
        │                                                                     │
        │  [ AI Engine: Gemini 1.5 Flash / Modular + Psychological Guardrails] │
        └──────────────────────────────────┬──────────────────────────────────┘
                                           │
                                           ▼ (Prisma ORM)
        ┌─────────────────────────────────────────────────────────────────────┐
        │                         PostgreSQL Database                         │
        │                                                                     │
        │  • Users & Profiles       • Subjects & Topics     • Study Plans     │
        │  • Study Tasks            • Notes & Flashcards    • Quizzes         │
        │  • Focus Sessions         • AI Conversations      • Agent Actions   │
        └─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dual Workflow Information Sharing

### Workflow A: The Web Dashboard Workflow
```
Student → Buddhi Frontend (Vite+React) → Express REST API → PostgreSQL
```
1. The student logs into the Buddhi web application.
2. The student manages subjects, reviews daily study goals, reads concept notes, uses the Pomodoro timer, and takes diagnostic quizzes.
3. Changes (e.g. creating notes, completing flashcards, logging focus sessions) write directly to PostgreSQL.

### Workflow B: The Switch Communication Room Workflow
```
Student → Mattermost → Switch → Buddhi Study Agent → Backend Webhook → PostgreSQL
```
1. The student is chatting inside their team communication workspace (Mattermost / Switch room).
2. The student queries their pending tasks: `"Hey Buddhi, what are my tasks for today?"`
3. Switch triggers the Buddhi webhook at `/api/switch/webhook`.
4. The agent fetches active tasks from PostgreSQL and responds directly in the Mattermost channel.
5. If the student reports: `"Completed task #1"`, the Buddhi Study Agent marks the task completed in PostgreSQL and logs an `AgentAction`.
6. When the student opens their Buddhi Web Dashboard, the task is **already marked as completed** in real time!

### Schedule Reorganization Under Stress (Psychological Safety)
1. If the student messages: `"I'm falling behind and feeling overwhelmed with Physics"`.
2. The Buddhi Study Agent detects emotional fatigue and applies psychological decompression:
   - Softens deadlines (+2 day buffer).
   - Inserts deliberate rest checkpoints.
   - Commits the updated plan to PostgreSQL without guilt or shame.

---

## 3. Database Schema Overview (Prisma ORM)

| Entity | Description | Relationships |
|---|---|---|
| `User` | Student credentials and account data | Has one `UserProfile`, many `Subjects`, `StudyTasks`, `Notes`, `Quizzes` |
| `UserProfile` | Academic level (Class 1-10, 11-12, Degree), daily study hours, goals, streak | Belongs to `User` |
| `Subject` | Academic courses (Physics, Chemistry, etc.) with color code and target score | Has many `Chapters`, `StudyTasks`, `Flashcards`, `Quizzes` |
| `Chapter` | Modules within a subject | Belongs to `Subject`, has many `Topics` |
| `Topic` | Micro-concepts with completion status and difficulty | Belongs to `Chapter` |
| `StudyPlan` | Adaptive study plan generated by AI | Has many `StudyTasks` |
| `StudyTask` | Actionable daily study tasks (duration, priority, due date, status) | Belongs to `StudyPlan` and `User` |
| `Note` | Markdown formatted concept summaries | Belongs to `Subject` and `User` |
| `Flashcard` | Active recall cards with 3D flip card review and mastery tracking | Belongs to `Subject` and `User` |
| `Quiz` | Multiple choice diagnostic quizzes generated by AI | Has many `QuizQuestions` and `QuizAttempts` |
| `QuizQuestion` | Question text, 4 choices, correct index, and concept explanation | Belongs to `Quiz` |
| `QuizAttempt` | User answers, calculated percentage, and supportive feedback | Belongs to `Quiz` and `User` |
| `StudySession` | Completed Pomodoro focus cycles and break durations | Belongs to `User` |
| `AgentAction` | Audit log of actions executed by the Switch agent from chat rooms | Belongs to `User` |

---

## 4. Psychological Guardrails & Safety Architecture

Students preparing for high-stakes examinations (e.g. Boards, JEE, NEET, University Degrees) face severe burnout and performance anxiety. Traditional tools exacerbate this by showing aggressive red warnings ("You are falling behind!").

Buddhi's AI engine is conditioned with strict psychological guidelines:
1. **Zero Guilt & Shame Prevention**: The agent never scolds or uses accusatory language.
2. **Cognitive Fatigue Detection**: Keywords like *"stress"*, *"overwhelmed"*, *"behind"*, or *"failing"* trigger warm emotional validation and micro-pacing recommendations.
3. **Actionable Micro-Steps**: Heavy syllabi are divided into non-threatening 15–25 minute goals.
4. **Approval Requirement**: The agent never overwrites existing plans or deletes tasks without explicit student confirmation.
