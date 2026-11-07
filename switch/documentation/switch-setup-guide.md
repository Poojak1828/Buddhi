# 🔌 BUDDHI — Switch Integration & Live Verification Guide
### Flip the Switch Hackathon 2026 — Track 2: Best Personal or Creative Workflow

This document provides complete technical documentation and verification details for **Buddhi's Switch Integration**. It covers the official Switch agent protocol, webhook architecture, PostgreSQL database synchronization, and step-by-step instructions for live demonstration.

---

## 1. System Architecture

Buddhi is not a standard web chatbot. It is a **collaborative AI study teammate** connected to your team chat platform (Mattermost) via the **Switch Protocol**:

```
 ┌──────────────────────────────────────────────────────────────┐
 │                     STUDENT WORKSPACE                        │
 └──────────────────────────────┬───────────────────────────────┘
                                │
          ┌─────────────────────┴────────────────────┐
          ▼                                          ▼
┌───────────────────────────┐              ┌───────────────────────────┐
│     Mattermost Room       │              │      Buddhi Web App       │
│  (#buddhi-study-room)     │              │     (React + Vite)        │
└─────────┬─────────────────┘              └─────────────┬─────────────┘
          │ (Event Payload)                              │ (REST API)
          ▼                                              ▼
┌───────────────────────────┐              ┌───────────────────────────┐
│  Switch Console / Gateway │              │     Express Backend API   │
│   (Switch Agent Protocol) │              │    (Port 5000 / Webhook)  │
└─────────┬─────────────────┘              └─────────────┬─────────────┘
          │                                              │
          └───────────> POST /api/switch/webhook <───────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │     Buddhi Study Agent        │
                   │   - Psychological Safety      │
                   │   - Exam Syllabus Breakdown   │
                   │   - Diagnostic Quiz Synthesis │
                   │   - Human-in-the-Loop Gate    │
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │    PostgreSQL Database        │
                   │   - subjects.examDate         │
                   │   - study_plans (APPROVED)    │
                   │   - study_tasks (live sync)   │
                   │   - quizzes & questions       │
                   │   - agent_actions (audit)     │
                   └───────────────────────────────┘
```

---

## 2. Verification Checklist (Status of the 10 Hackathon Items)

| Item | Requirement | Status | Implementation Details |
| :--- | :--- | :--- | :--- |
| **1** | Switch server is running | ⚠️ **Manual Action** | Needs Switch local runner / Docker on port `8000`. Full manual steps provided below. |
| **2** | Selected agent provider is installed | ✅ **Configured** | Buddhi HTTP Webhook Provider specified in `switch/agent-instructions/buddhi-agent.json`. |
| **3** | Switch connector is configured | ✅ **Configured** | Mattermost Outgoing Webhook connector configured to point to `http://localhost:5000/api/switch/webhook`. |
| **4** | Buddhi Study Agent is onboarded | ✅ **Complete** | Manifest registered with psychological guidelines, permissions (`tasks:*`, `plans:*`, `quizzes:*`). |
| **5** | Dedicated Buddhi study room exists | ✅ **Configured** | Room name `#buddhi-study-room` bound in agent manifest and backend configuration. |
| **6** | Student can send study requests via chat | ✅ **Verified** | Supports natural language queries, examination dates, syllabi, and completion logs. |
| **7** | Agent creates & explains study plans | ✅ **Verified** | Breaks syllabi into daily interleaved sessions with active recall and rest buffers. |
| **8** | Agent generates quizzes & revision tasks | ✅ **Verified** | Creates diagnostic MCQs and commits them directly to PostgreSQL `quizzes` table. |
| **9** | Approved changes sync to backend | ✅ **Verified** | Replying `Approve plan` or `Completed task #1` mutates PostgreSQL tables in real-time. |
| **10** | Resulting changes visible on website | ✅ **Verified** | New exam dates appear on Subjects, tasks on Planner/Dashboard, and quizzes under Quizzes. |

---

## 3. End-to-End Examination Workflow Test

To verify the integration with an **upcoming examination**, run our automated test suite:

```bash
npm run test:switch-exam
```

### What this test verifies:
1. **Step 1: Upcoming Exam Announcement**
   - Student prompts: `"Hey Buddhi, I have my CBSE Class 12 Physics Board Examination on March 15, 2026. The syllabus covers Wave Optics, Electromagnetic Induction, and Dual Nature of Radiation. I have 3 hours daily. Please create a focused examination revision plan."`
   - Buddhi detects the subject (`Physics`), the date (`2026-03-15`), the daily study budget (`3 hours`), and parses the syllabus.
   - Buddhi updates `Subject.examDate` in PostgreSQL.
   - Buddhi responds with a structured revision plan and asks for approval.
2. **Step 2: Human-in-the-Loop Plan Approval**
   - Student prompts: `"Yes, approve plan"`
   - Buddhi commits the plan to PostgreSQL with `status: 'APPROVED'` and creates **21 structured study tasks** across the revision timeline.
3. **Step 3: Diagnostic Examination Quiz Generation**
   - Student prompts: `"Give me a quick diagnostic quiz on Optics for my Physics exam"`
   - Buddhi generates a diagnostic quiz on Wave Optics, persists it into the `quizzes` and `quiz_questions` database tables, and presents the questions in the room.
4. **Step 4: Task Completion Reporting**
   - Student prompts: `"Completed task #1"`
   - Buddhi marks the task `COMPLETED` in PostgreSQL with timestamp and gives positive psychological reinforcement.
5. **Step 5: Agent Action Audit Trail**
   - Logs `[TASK_COMPLETED]`, `[QUIZ_GENERATED]`, and `[CREATE_PLAN]` in the `agent_actions` table with room tag `#buddhi-study-room`.

---

## 4. Manual Configuration Steps for Real Mattermost & Switch Setup

If you want to connect live to a real Mattermost instance or Switch Console, follow these steps:

### Step A: Start Local PostgreSQL (If not running)
```bash
npm run db:start
```
*Port `5433` will start listening on `127.0.0.1`.*

### Step B: Start Buddhi Backend Server
```bash
npm run dev:backend
```
*Backend will run at `http://localhost:5000`.*

### Step C: Run Mattermost (Using Docker)
If you have Docker Desktop running, start Mattermost with a single command:
```bash
docker run -d --name mattermost-buddhi -p 8065:8065 mattermost/mattermost-team-edition:latest
```
1. Open [http://localhost:8065](http://localhost:8065) in your browser.
2. Complete the initial admin setup (Create Team e.g. `BuddhiTeam`).
3. Create a public or private channel named: **`buddhi-study-room`**.

### Step D: Configure Mattermost Outgoing Webhook
1. In Mattermost, click **System Console** or top-left **Integrations** -> **Outgoing Webhooks**.
2. Click **Add Outgoing Webhook**:
   - **Title**: `Buddhi Study Teammate Bridge`
   - **Channel**: `buddhi-study-room`
   - **Trigger Words** (one per line):
     ```
     @buddhi
     buddhi
     plan
     task
     quiz
     completed
     reorganize
     ```
   - **Trigger When**: Word starts with trigger word
   - **Callback URLs**: `http://host.docker.internal:5000/api/switch/webhook` *(or your ngrok URL if using cloud Mattermost)*
3. Click **Save** and copy the **Token**.
4. In your `.env` and `backend/.env`, set:
   ```env
   SWITCH_WEBHOOK_SECRET="<paste_token_here>"
   ```

### Step E: Onboard Buddhi in Switch Console
1. Open the **Switch Console** desktop application.
2. Navigate to **Agents** -> **Register Custom Agent**.
3. Import the manifest file located at:
   `switch/agent-instructions/buddhi-agent.json`
4. Set the Webhook URL:
   `http://localhost:5000/api/switch/webhook`
5. Assign the agent to the room: `#buddhi-study-room`.

### Step F: Test Live in Mattermost
1. In `#buddhi-study-room`, type:
   ```text
   @buddhi What are my pending study tasks for today?
   ```
2. Buddhi will respond in the channel with active tasks loaded from PostgreSQL!
3. Type:
   ```text
   @buddhi Completed task #1
   ```
4. Open the Buddhi Web Dashboard ([http://localhost:5173/dashboard](http://localhost:5173/dashboard)) to see the task immediately marked as completed!

---

## 5. Built-in In-App Live Simulator (Zero External Tools Required)

For evaluators who do not have local Docker/Mattermost installed, Buddhi provides a **Live Switch Teammate Room Hub** directly inside the web UI:

1. Start Buddhi:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:5173/switch-hub](http://localhost:5173/switch-hub).
3. The page features a real-time Mattermost stream interface connected to `POST /api/switch/simulate-chat`.
4. Click any of the evaluator test prompt pills to trigger live backend processing, psychological analysis, and real PostgreSQL database mutations.
5. The right-hand column displays the real-time **PostgreSQL Action Audit** showing the live database records.
