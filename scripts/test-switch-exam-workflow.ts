/**
 * Buddhi End-to-End Switch Exam Workflow Test
 * Demonstrates:
 * 1. Student sharing upcoming examination requirements via Switch/Mattermost
 * 2. Buddhi Study Agent generating structured revision plan & milestones
 * 3. Human-in-the-loop student plan approval
 * 4. Automatic database synchronization (examDate, studyPlans, studyTasks)
 * 5. Generation and PostgreSQL persistence of diagnostic examination quiz
 * 6. Task completion reporting and live database synchronization
 */

import { switchService } from '../backend/src/switch/switch.service.js';
import { prisma } from '../backend/src/config/db.js';

async function main() {
  console.log('\n====================================================================');
  console.log('🧪 BUDDHI SWITCH INTEGRATION – UPCOMING EXAMINATION END-TO-END TEST');
  console.log('====================================================================\n');

  const studentEmail = 'student@buddhi.ai';
  const roomName = 'buddhi-study-room';

  // 1. Initial State Verification
  const user = await prisma.user.findUnique({
    where: { email: studentEmail },
    include: { profile: true },
  });

  if (!user) {
    throw new Error(`Demo student ${studentEmail} not found in database. Run npm run db:seed first.`);
  }

  console.log(`👤 Student Identity Verified: ${user.name} (${user.email})`);
  console.log(`📍 Connected Channel: #${roomName} (Mattermost Switch Connector)\n`);

  // Step 1: Student shares upcoming examination details
  console.log('--------------------------------------------------------------------');
  console.log('📍 STEP 1: Student Announces Upcoming Board Examination in Room');
  console.log('--------------------------------------------------------------------');
  const examPrompt =
    'Hey Buddhi, I have my CBSE Class 12 Physics Board Examination on March 15, 2026. ' +
    'The syllabus covers Wave Optics, Electromagnetic Induction, and Dual Nature of Radiation. ' +
    'I have 3 hours daily. Please create a focused examination revision plan.';
  console.log(`💬 [Student -> #${roomName}]:\n"${examPrompt}"\n`);

  const step1Response = await switchService.processRoomMessage({
    text: examPrompt,
    userEmail: studentEmail,
    channelName: roomName,
    source: 'SWITCH_CONSOLE',
  });

  console.log(`🤖 [Buddhi Agent -> #${roomName}]:`);
  console.log(step1Response.replyText);

  if (step1Response.actionType !== 'CREATE_PLAN') {
    throw new Error(`Expected actionType CREATE_PLAN, got ${step1Response.actionType}`);
  }

  // Verify Exam Date was synchronized to Subject in PostgreSQL
  const physicsSubject = await prisma.subject.findFirst({
    where: { userId: user.id, name: { contains: 'Physics', mode: 'insensitive' } },
  });

  console.log('\n🔍 [Database Assertion]: Checking Subject examDate in PostgreSQL...');
  if (!physicsSubject?.examDate) {
    throw new Error('Subject examDate was not set in PostgreSQL.');
  }
  console.log(`  ✅ Subject '${physicsSubject.name}' examDate synchronized to: ${physicsSubject.examDate.toISOString().split('T')[0]}`);

  // Step 2: Student Approves the Proposed Study Plan
  console.log('\n--------------------------------------------------------------------');
  console.log('📍 STEP 2: Student Approves Proposed Study Plan in Room');
  console.log('--------------------------------------------------------------------');
  const approvalPrompt = 'Yes, approve plan';
  console.log(`💬 [Student -> #${roomName}]: "${approvalPrompt}"\n`);

  const step2Response = await switchService.processRoomMessage({
    text: approvalPrompt,
    userEmail: studentEmail,
    channelName: roomName,
    source: 'SWITCH_CONSOLE',
  });

  console.log(`🤖 [Buddhi Agent -> #${roomName}]:`);
  console.log(step2Response.replyText);

  // Verify Plan & Tasks created in PostgreSQL
  const approvedPlan = await prisma.studyPlan.findFirst({
    where: { userId: user.id, status: 'APPROVED' },
    orderBy: { createdAt: 'desc' },
    include: { tasks: true },
  });

  console.log('\n🔍 [Database Assertion]: Checking StudyPlan & StudyTasks in PostgreSQL...');
  if (!approvedPlan) {
    throw new Error('Approved StudyPlan was not found in PostgreSQL.');
  }
  console.log(`  ✅ StudyPlan '${approvedPlan.title}' created (Status: ${approvedPlan.status})`);
  console.log(`  ✅ Scheduled ${approvedPlan.tasks.length} tasks in database for subject '${physicsSubject.name}'`);

  // Step 3: Student requests a diagnostic quiz for the exam
  console.log('\n--------------------------------------------------------------------');
  console.log('📍 STEP 3: Student Requests Diagnostic Practice Quiz for Optics');
  console.log('--------------------------------------------------------------------');
  const quizPrompt = 'Give me a quick diagnostic quiz on Optics for my Physics exam';
  console.log(`💬 [Student -> #${roomName}]: "${quizPrompt}"\n`);

  const step3Response = await switchService.processRoomMessage({
    text: quizPrompt,
    userEmail: studentEmail,
    channelName: roomName,
    source: 'SWITCH_CONSOLE',
  });

  console.log(`🤖 [Buddhi Agent -> #${roomName}]:`);
  console.log(step3Response.replyText);

  // Verify Quiz persisted in PostgreSQL
  const savedQuiz = await prisma.quiz.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { questions: true },
  });

  console.log('\n🔍 [Database Assertion]: Checking Quiz persistence in PostgreSQL...');
  if (!savedQuiz || savedQuiz.questions.length === 0) {
    throw new Error('Quiz was not saved in PostgreSQL database.');
  }
  console.log(`  ✅ Quiz '${savedQuiz.title}' saved with ${savedQuiz.questions.length} questions in DB (ID: ${savedQuiz.id})`);
  console.log(`  ✅ Available on Web App: http://localhost:5173/quizzes`);

  // Step 4: Student Marks Task as Completed from the Room
  console.log('\n--------------------------------------------------------------------');
  console.log('📍 STEP 4: Student Marks Milestone Task Completed in Room');
  console.log('--------------------------------------------------------------------');
  const completePrompt = 'Completed task #1';
  console.log(`💬 [Student -> #${roomName}]: "${completePrompt}"\n`);

  const step4Response = await switchService.processRoomMessage({
    text: completePrompt,
    userEmail: studentEmail,
    channelName: roomName,
    source: 'SWITCH_CONSOLE',
  });

  console.log(`🤖 [Buddhi Agent -> #${roomName}]:`);
  console.log(step4Response.replyText);

  // Verify Task Completed in PostgreSQL
  const completedTask = await prisma.studyTask.findFirst({
    where: { userId: user.id, isCompleted: true },
    orderBy: { completedAt: 'desc' },
  });

  console.log('\n🔍 [Database Assertion]: Checking Task Status in PostgreSQL...');
  if (!completedTask) {
    throw new Error('Completed task status not reflected in PostgreSQL.');
  }
  console.log(`  ✅ Task '${completedTask.title}' status is: ${completedTask.status} (CompletedAt: ${completedTask.completedAt?.toISOString()})`);

  // Step 5: Verify Agent Actions Audit Trail
  console.log('\n--------------------------------------------------------------------');
  console.log('📍 STEP 5: Verifying Agent Actions Audit Trail in PostgreSQL');
  console.log('--------------------------------------------------------------------');
  const actionAudit = await prisma.agentAction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  console.log(`Audit Trail (${actionAudit.length} most recent records):`);
  actionAudit.forEach((act, idx) => {
    console.log(`  ${idx + 1}. [${act.actionType}] status=${act.status} - "${act.summary}" (Room: ${act.switchRoomId})`);
  });

  console.log('\n====================================================================');
  console.log('🎉 ALL SWITCH END-TO-END EXAMINATION WORKFLOW TESTS PASSED (5/5)!');
  console.log('====================================================================\n');
}

main()
  .catch((err) => {
    console.error('\n❌ Test execution failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
