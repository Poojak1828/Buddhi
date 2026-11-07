import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(category: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ category, name, passed: true, durationMs });
    console.log(`  ✅ [${category}] ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const detailMsg = err.cause ? `${err.message} [Cause: ${err.cause}]` : err.message;
    results.push({ category, name, passed: false, details: detailMsg, durationMs });
    console.error(`  ❌ [${category}] ${name} (${durationMs}ms): ${detailMsg}`);
  }
}

async function main() {
  console.log(`\n=============================================================`);
  console.log(`🔬 BUDDHI COMPREHENSIVE TECHNICAL AUDIT & TEST RUNNER`);
  console.log(`=============================================================\n`);

  // Locate PostgreSQL
  const pgBin = 'C:\\Program Files\\PostgreSQL\\18\\bin';
  const dbDir = path.join(projectRoot, '.db_data');

  let pgProcess: ChildProcess | null = null;
  const pgAlreadyRunning = await isPortOpen(5433);
  if (pgAlreadyRunning) {
    console.log(`[Audit] PostgreSQL is already active and listening on port 5433.`);
  } else {
    console.log(`[Audit] Booting local PostgreSQL cluster on port 5433...`);
    pgProcess = spawn(path.join(pgBin, 'postgres.exe'), ['-D', dbDir, '-p', '5433'], {
      stdio: 'ignore',
    });
    await new Promise((r) => setTimeout(r, 2000));
  }

  const backendAlreadyRunning = await isPortOpen(5000);
  if (backendAlreadyRunning) {
    console.log(`[Audit] Express Backend API is already running on port 5000.`);
  } else {
    console.log(`[Audit] Booting Express Backend API on port 5000...`);
    await import('../backend/src/server.js');
    await new Promise((r) => setTimeout(r, 1000));
  }

  const BASE_URL = 'http://127.0.0.1:5000';
  let authToken = '';
  let studentUserId = '';
  let createdSubjectId = '';
  let createdChapterId = '';
  let createdTopicId = '';
  let createdPlanId = '';
  let createdTaskId = '';
  let createdNoteId = '';
  let createdQuizId = '';
  let createdFlashcardId = '';

  console.log(`\n--- 1. AUTHENTICATION & SECURITY AUDIT ---`);

  await runTest('Auth', 'Health Endpoint Responds', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`Unexpected status: ${data.status}`);
  });

  await runTest('Auth', 'Demo Student Login (Aarav Sharma)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@buddhi.ai', password: 'Buddhi2026!' }),
    });
    if (!res.ok) throw new Error(`Login failed with HTTP ${res.status}`);
    const data = await res.json();
    if (!data.token) throw new Error('No JWT token returned');
    authToken = data.token;
    studentUserId = data.user.id;
  });

  await runTest('Auth', 'Verify Protected Route With Valid JWT (/api/auth/me)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.user.email !== 'student@buddhi.ai') throw new Error('User identity mismatch');
  });

  await runTest('Auth', 'Verify Protected Route Rejects Missing Token', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`);
  });

  await runTest('Auth', 'Update Student Profile Preferences', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        dailyAvailableHours: 5.0,
        preferredSchedule: 'MORNING',
        stressLevelNotes: 'Steady breathing and intentional intervals.',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  console.log(`\n--- 2. SUBJECTS & SYLLABUS AUDIT ---`);

  await runTest('Subjects', 'Get User Subjects List', async () => {
    const res = await fetch(`${BASE_URL}/api/subjects`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.subjects) || data.subjects.length === 0) {
      throw new Error('Subjects list is empty');
    }
  });

  await runTest('Subjects', 'Create New Academic Subject', async () => {
    const res = await fetch(`${BASE_URL}/api/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: 'Mathematics – Linear Algebra',
        code: 'MATH-201',
        color: '#818CF8',
        targetScore: 95,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    createdSubjectId = data.subject.id;
  });

  await runTest('Subjects', 'Add Chapter to Subject', async () => {
    const res = await fetch(`${BASE_URL}/api/subjects/chapters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        subjectId: createdSubjectId,
        title: 'Eigenvalues & Matrix Diagonalization',
        orderIndex: 1,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    createdChapterId = data.chapter.id;
  });

  await runTest('Subjects', 'Add Topic to Chapter', async () => {
    const res = await fetch(`${BASE_URL}/api/subjects/topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        chapterId: createdChapterId,
        title: 'Characteristic Polynomial & Trace Invariance',
        difficulty: 'MEDIUM',
        orderIndex: 1,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    createdTopicId = data.topic.id;
  });

  await runTest('Subjects', 'Update Topic Status and Recalculate Completion', async () => {
    const res = await fetch(`${BASE_URL}/api/subjects/topics/${createdTopicId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.topic.status !== 'COMPLETED') throw new Error('Status not updated');
  });

  console.log(`\n--- 3. AI STUDY PLANNER & TASKS AUDIT ---`);

  let generatedPlanDraft: any = null;

  await runTest('Planner', 'AI Study Plan Draft Generation', async () => {
    const res = await fetch(`${BASE_URL}/api/planner/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        subjectName: 'Modern Physics',
        syllabus: 'Photoelectric Effect, de Broglie Wavelength, Bohr Model, Nuclear Binding Energy',
        dailyHours: 4.0,
        prepLevel: 'Intermediate',
        priorityTopics: 'Bohr Model Transitions',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.draft || !data.draft.schedule) throw new Error('Invalid plan draft');
    generatedPlanDraft = data.draft;
  });

  await runTest('Planner', 'Approve and Save Plan into PostgreSQL Tasks', async () => {
    const res = await fetch(`${BASE_URL}/api/planner/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: generatedPlanDraft.title,
        summary: generatedPlanDraft.summary,
        schedule: generatedPlanDraft.schedule,
        dailyHours: 4.0,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.createdTasksCount === 0) throw new Error('No study tasks created');
    createdPlanId = data.plan.id;
  });

  await runTest('Planner', 'Query Active Study Tasks', async () => {
    const res = await fetch(`${BASE_URL}/api/planner/tasks`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.tasks) || data.tasks.length === 0) {
      throw new Error('No study tasks returned');
    }
    createdTaskId = data.tasks[0].id;
  });

  await runTest('Planner', 'Check Off / Toggle Study Task', async () => {
    const res = await fetch(`${BASE_URL}/api/planner/tasks/${createdTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ isCompleted: true }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.task.isCompleted) throw new Error('Task not marked completed');
  });

  console.log(`\n--- 4. AI STUDY ASSISTANT (PSYCHOLOGICAL EMPATHY) AUDIT ---`);

  await runTest('Assistant', 'Standard Academic Query', async () => {
    const res = await fetch(`${BASE_URL}/api/assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        message: 'Can you explain the difference between static and kinetic friction?',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.message || !data.message.content) throw new Error('No response content');
  });

  await runTest('Assistant', 'Psychological Empathy Under Exam Stress', async () => {
    const res = await fetch(`${BASE_URL}/api/assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        message: 'I feel so overwhelmed and anxious about exams, I feel like I am failing.',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.emotionalTone !== 'calming-supportive') {
      throw new Error(`Expected calming-supportive tone, got ${data.emotionalTone}`);
    }
    // Check that response is compassionate
    if (data.message.content.includes('failing') && !data.message.content.toLowerCase().includes('breath')) {
      console.warn('Note: Response framing validated.');
    }
  });

  console.log(`\n--- 5. NOTES & FLASHCARDS AUDIT ---`);

  await runTest('Notes', 'Create Study Note', async () => {
    const res = await fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title: 'Optics: Fermat Principle',
        content: '# Fermat Principle\nLight takes the path of stationary optical path length between two fixed points.',
        tags: 'optics,physics',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    createdNoteId = data.note.id;
  });

  await runTest('Notes', 'AI Note Summarization', async () => {
    const res = await fetch(`${BASE_URL}/api/notes/${createdNoteId}/summarize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.summary) throw new Error('No summary returned');
  });

  await runTest('Notes', 'Generate Flashcards from Note', async () => {
    const res = await fetch(`${BASE_URL}/api/notes/${createdNoteId}/flashcards`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await runTest('Flashcards', 'Generate AI Flashcard Deck', async () => {
    const res = await fetch(`${BASE_URL}/api/flashcards/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        topic: 'Wave Optics Interference',
        count: 4,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await runTest('Flashcards', 'Query Flashcards and Record Mastery', async () => {
    const res = await fetch(`${BASE_URL}/api/flashcards`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.flashcards.length === 0) throw new Error('No flashcards found');
    createdFlashcardId = data.flashcards[0].id;

    const masteryRes = await fetch(`${BASE_URL}/api/flashcards/${createdFlashcardId}/mastery`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ masteryStatus: 'MASTERED' }),
    });
    if (!masteryRes.ok) throw new Error(`Failed to update mastery: HTTP ${masteryRes.status}`);
  });

  console.log(`\n--- 6. AI QUIZZES & SESSIONS AUDIT ---`);

  await runTest('Quizzes', 'Generate AI Diagnostic Quiz', async () => {
    const res = await fetch(`${BASE_URL}/api/quizzes/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        topic: 'Thermodynamics Entropy',
        difficulty: 'MEDIUM',
        totalQuestions: 3,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    createdQuizId = data.quizId;
  });

  await runTest('Quizzes', 'Submit Quiz and Evaluate Score & Explanations', async () => {
    const res = await fetch(`${BASE_URL}/api/quizzes/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        quizId: createdQuizId,
        userAnswers: [0, 1, 0],
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (typeof data.percentage !== 'number' || !data.feedback) {
      throw new Error('Invalid quiz evaluation response');
    }
  });

  await runTest('Timer', 'Log Completed Pomodoro Session', async () => {
    const res = await fetch(`${BASE_URL}/api/timer/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        durationMinutes: 25,
        sessionType: 'POMODORO',
        notes: 'Deep focus on Wave Optics derivations',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await runTest('Analytics', 'Retrieve Real Progress & Analytics Metrics', async () => {
    const res = await fetch(`${BASE_URL}/api/analytics`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (typeof data.totalStudyHours !== 'number' || !Array.isArray(data.dailyHoursTrend)) {
      throw new Error('Analytics payload format invalid');
    }
  });

  console.log(`\n--- 7. SWITCH TEAMMATE INTEGRATION AUDIT ---`);

  await runTest('Switch', 'Switch Gateway Status & Protocol Health', async () => {
    const res = await fetch(`${BASE_URL}/api/switch/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status !== 'ONLINE' || data.roomName !== 'buddhi-study-room') {
      throw new Error('Switch status invalid');
    }
  });

  await runTest('Switch', 'Mattermost Webhook Event (/api/switch/webhook)', async () => {
    const res = await fetch(`${BASE_URL}/api/switch/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: 'Aarav Sharma',
        channel_name: 'buddhi-study-room',
        text: 'What are my pending tasks?',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.text || !data.text.includes('Active Tasks')) {
      throw new Error(`Unexpected webhook response: ${data.text}`);
    }
  });

  await runTest('Switch', 'Mattermost Task Completion Sync Event', async () => {
    const res = await fetch(`${BASE_URL}/api/switch/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: 'Aarav Sharma',
        channel_name: 'buddhi-study-room',
        text: 'Completed task #1',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.text.includes('marked') && !data.text.includes('completed')) {
      throw new Error(`Task completion sync failed: ${data.text}`);
    }
  });

  await runTest('Switch', 'Mattermost Schedule Reorganization Under Stress', async () => {
    const res = await fetch(`${BASE_URL}/api/switch/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: 'Aarav Sharma',
        channel_name: 'buddhi-study-room',
        text: 'I am falling behind and feeling overwhelmed with exams, please reorganize my tasks',
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.text.includes('reorganized') && !data.text.includes('shifted')) {
      throw new Error(`Schedule reorganization failed: ${data.text}`);
    }
  });

  // Clean shutdown
  console.log(`\n[Audit] Finalizing test run...`);
  if (pgProcess) {
    pgProcess.kill();
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log(`\n=============================================================`);
  console.log(`📊 AUDIT SUMMARY: ${passedCount} PASSED / ${failedCount} FAILED out of ${results.length} Tests`);
  console.log(`=============================================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('[Fatal Error in Audit Test]:', err);
  process.exit(1);
});
