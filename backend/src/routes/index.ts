import { Router } from 'express';
import { authenticateJwt } from '../middleware/auth.js';

// Controllers
import * as authController from '../controllers/auth.controller.js';
import * as subjectController from '../controllers/subject.controller.js';
import * as plannerController from '../controllers/planner.controller.js';
import * as assistantController from '../controllers/assistant.controller.js';
import * as notesController from '../controllers/notes.controller.js';
import * as flashcardsController from '../controllers/flashcards.controller.js';
import * as quizzesController from '../controllers/quizzes.controller.js';
import * as timerController from '../controllers/timer.controller.js';
import * as analyticsController from '../controllers/analytics.controller.js';
import * as switchController from '../controllers/switch.controller.js';

const router = Router();

// ==========================================
// 1. Authentication & Profile Routes
// ==========================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateJwt, authController.getMe);
router.put('/auth/profile', authenticateJwt, authController.updateProfile);

// ==========================================
// 2. Subject & Syllabus Management Routes
// ==========================================
router.get('/subjects', authenticateJwt, subjectController.getSubjects);
router.get('/subjects/:id', authenticateJwt, subjectController.getSubjectById);
router.post('/subjects', authenticateJwt, subjectController.createSubject);
router.post('/subjects/auto-populate', authenticateJwt, subjectController.autoPopulateCurriculum);
router.put('/subjects/:id', authenticateJwt, subjectController.updateSubject);
router.delete('/subjects/:id', authenticateJwt, subjectController.deleteSubject);
router.post('/subjects/chapters', authenticateJwt, subjectController.createChapter);
router.post('/subjects/topics', authenticateJwt, subjectController.createTopic);
router.put('/subjects/topics/:id', authenticateJwt, subjectController.updateTopic);
router.delete('/subjects/topics/:id', authenticateJwt, subjectController.deleteTopic);

// ==========================================
// 3. AI Study Planner & Tasks Routes
// ==========================================
router.post('/planner/generate', authenticateJwt, plannerController.generatePlanDraft);
router.post('/planner/save', authenticateJwt, plannerController.saveApprovedPlan);
router.get('/planner/plans', authenticateJwt, plannerController.getPlans);
router.get('/planner/tasks', authenticateJwt, plannerController.getTasks);
router.post('/planner/tasks', authenticateJwt, plannerController.createTask);
router.put('/planner/tasks/:id', authenticateJwt, plannerController.updateTask);
router.delete('/planner/tasks/:id', authenticateJwt, plannerController.deleteTask);

// ==========================================
// 4. AI Study Assistant Routes
// ==========================================
router.post('/assistant/chat', authenticateJwt, assistantController.chatWithAssistant);
router.post('/ai/chat', authenticateJwt, assistantController.chatWithAssistant);
router.get('/assistant/history', authenticateJwt, assistantController.getConversationHistory);
router.delete('/assistant/conversations/:id', authenticateJwt, assistantController.clearConversation);

// ==========================================
// 5. Notes Management Routes
// ==========================================
router.get('/notes', authenticateJwt, notesController.getNotes);
router.get('/notes/:id', authenticateJwt, notesController.getNoteById);
router.post('/notes', authenticateJwt, notesController.createNote);
router.put('/notes/:id', authenticateJwt, notesController.updateNote);
router.delete('/notes/:id', authenticateJwt, notesController.deleteNote);
router.post('/notes/:id/summarize', authenticateJwt, notesController.summarizeNote);
router.post('/notes/:id/flashcards', authenticateJwt, notesController.generateFlashcardsFromNote);

// ==========================================
// 6. AI Flashcards Routes
// ==========================================
router.get('/flashcards', authenticateJwt, flashcardsController.getFlashcards);
router.post('/flashcards/generate', authenticateJwt, flashcardsController.generateAIFlashcards);
router.post('/flashcards', authenticateJwt, flashcardsController.createFlashcard);
router.put('/flashcards/:id', authenticateJwt, flashcardsController.updateFlashcard);
router.put('/flashcards/:id/mastery', authenticateJwt, flashcardsController.updateMastery);
router.delete('/flashcards/:id', authenticateJwt, flashcardsController.deleteFlashcard);

// ==========================================
// 7. AI Quizzes Routes
// ==========================================
router.get('/quizzes', authenticateJwt, quizzesController.getQuizzes);
router.get('/quizzes/history', authenticateJwt, quizzesController.getQuizHistory);
router.get('/quizzes/:id', authenticateJwt, quizzesController.getQuizById);
router.post('/quizzes/generate', authenticateJwt, quizzesController.generateQuiz);
router.post('/quizzes/submit', authenticateJwt, quizzesController.submitQuizAttempt);
router.post('/quizzes/evaluate-answer', authenticateJwt, quizzesController.evaluateSingleAnswer);

// ==========================================
// 8. Focus Timer & Sessions Routes
// ==========================================
router.post('/timer/sessions', authenticateJwt, timerController.logSession);
router.get('/timer/sessions', authenticateJwt, timerController.getSessionHistory);

// ==========================================
// 9. Progress Analytics Routes
// ==========================================
router.get('/analytics', authenticateJwt, analyticsController.getAnalytics);

// ==========================================
// 10. Switch Teammate Integration Routes
// ==========================================
// Public/Webhook endpoint called by Telegram Bot or Switch Connector
router.post('/switch/telegram-webhook', switchController.handleTelegramWebhook);
router.post('/switch/webhook', switchController.handleSwitchWebhook);
// Interactive simulation endpoint for demo & testing
router.post('/switch/simulate-chat', authenticateJwt, switchController.simulateSwitchChat);
// Status & health of Switch integration
router.get('/switch/status', switchController.getSwitchStatus);
router.get('/switch/actions', switchController.getSwitchActions);
router.post('/switch/approve-action', switchController.approveAction);
// Room & Teammate management
router.get('/switch/rooms', authenticateJwt, switchController.getSwitchRooms);
router.post('/switch/rooms', authenticateJwt, switchController.createSwitchRoom);
router.post('/switch/rooms/:roomId/teammates', authenticateJwt, switchController.addSwitchTeammate);
router.delete('/switch/teammates/:teammateId', authenticateJwt, switchController.deleteSwitchTeammate);

export default router;
