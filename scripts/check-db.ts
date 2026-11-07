import { prisma } from '../backend/src/config/db.js';

async function check() {
  console.log('--- Checking Database Connection & Records ---');
  const users = await prisma.user.count();
  const subjects = await prisma.subject.count();
  const tasks = await prisma.studyTask.count();
  const plans = await prisma.studyPlan.count();
  const notes = await prisma.note.count();
  const flashcards = await prisma.flashcard.count();
  const quizzes = await prisma.quiz.count();
  const sessions = await prisma.studySession.count();
  const actions = await prisma.agentAction.count();

  console.log('✅ PostgreSQL connection verified successfully on port 5433!');
  console.log(`📊 Record Counts:
  - Users: ${users}
  - Subjects: ${subjects}
  - Study Tasks: ${tasks}
  - Study Plans: ${plans}
  - Notes: ${notes}
  - Flashcards: ${flashcards}
  - Quizzes: ${quizzes}
  - Focus Sessions: ${sessions}
  - Switch Agent Actions: ${actions}
  `);
}

check()
  .catch((err) => {
    console.error('❌ Database check failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
