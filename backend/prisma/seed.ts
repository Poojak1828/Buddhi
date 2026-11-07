import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding database with demo student data...');

  // 1. Create or update demo student user
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Buddhi2026!', salt);

  const user = await prisma.user.upsert({
    where: { email: 'student@buddhi.ai' },
    update: {
      name: 'Student',
      passwordHash,
    },
    create: {
      email: 'student@buddhi.ai',
      name: 'Student',
      passwordHash,
      role: 'STUDENT',
    },
  });

  // 2. User Profile
  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: {
      academicLevel: 'SENIOR_SECONDARY_PREP',
      courseOrDegree: 'Science (PCM) – Senior Secondary',
      targetExams: 'JEE Advanced & CBSE Board Examinations 2026',
      dailyAvailableHours: 4.5,
      studyGoals: 'Maintain top 1% conceptual mastery with balanced mental endurance and error minimization.',
      preferredSchedule: 'EVENING',
      stressLevelNotes: 'Calm and steady. Practicing intentional focus intervals.',
      streakCount: 8,
      lastActiveDate: new Date(),
    },
    create: {
      userId: user.id,
      academicLevel: 'SENIOR_SECONDARY_PREP',
      courseOrDegree: 'Science (PCM) – Senior Secondary',
      targetExams: 'JEE Advanced & CBSE Board Examinations 2026',
      dailyAvailableHours: 4.5,
      studyGoals: 'Maintain top 1% conceptual mastery with balanced mental endurance and error minimization.',
      preferredSchedule: 'EVENING',
      stressLevelNotes: 'Calm and steady. Practicing intentional focus intervals.',
      streakCount: 8,
      lastActiveDate: new Date(),
    },
  });

  // 3. Subjects
  const physics = await prisma.subject.create({
    data: {
      userId: user.id,
      name: 'Physics',
      code: 'PHY-101',
      color: '#38BDF8', // Sky Blue
      icon: 'zap',
      targetScore: 95.0,
      syllabusCompletion: 68.0,
      examDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // in 28 days
    },
  });

  const chemistry = await prisma.subject.create({
    data: {
      userId: user.id,
      name: 'Chemistry',
      code: 'CHEM-102',
      color: '#34D399', // Mint Green
      icon: 'flask-conical',
      targetScore: 92.0,
      syllabusCompletion: 74.0,
      examDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    },
  });

  const mathematics = await prisma.subject.create({
    data: {
      userId: user.id,
      name: 'Mathematics',
      code: 'MATH-103',
      color: '#818CF8', // Indigo
      icon: 'calculator',
      targetScore: 98.0,
      syllabusCompletion: 82.0,
      examDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Chapters & Topics for Physics
  const chapter1 = await prisma.chapter.create({
    data: {
      subjectId: physics.id,
      title: 'Rotational Mechanics & Moment of Inertia',
      orderIndex: 1,
    },
  });

  await prisma.topic.createMany({
    data: [
      {
        chapterId: chapter1.id,
        title: 'Center of Mass & Rigid Body Equilibrium',
        status: 'COMPLETED',
        difficulty: 'MEDIUM',
        orderIndex: 1,
      },
      {
        chapterId: chapter1.id,
        title: 'Parallel & Perpendicular Axes Theorems',
        status: 'COMPLETED',
        difficulty: 'EASY',
        orderIndex: 2,
      },
      {
        chapterId: chapter1.id,
        title: 'Rolling Motion Without Slipping & Energy Conservation',
        status: 'IN_PROGRESS',
        difficulty: 'HARD',
        orderIndex: 3,
      },
      {
        chapterId: chapter1.id,
        title: 'Angular Momentum Conservation in Collisions',
        status: 'NOT_STARTED',
        difficulty: 'HARD',
        orderIndex: 4,
      },
    ],
  });

  // Chemistry Chapters
  const chemChapter = await prisma.chapter.create({
    data: {
      subjectId: chemistry.id,
      title: 'Chemical Kinetics & Catalysis',
      orderIndex: 1,
    },
  });

  await prisma.topic.createMany({
    data: [
      {
        chapterId: chemChapter.id,
        title: 'Rate Law & Reaction Orders (0th, 1st, 2nd)',
        status: 'COMPLETED',
        difficulty: 'EASY',
        orderIndex: 1,
      },
      {
        chapterId: chemChapter.id,
        title: 'Arrhenius Equation & Activation Energy',
        status: 'COMPLETED',
        difficulty: 'MEDIUM',
        orderIndex: 2,
      },
      {
        chapterId: chemChapter.id,
        title: 'Collision Theory & Steady State Approximation',
        status: 'IN_PROGRESS',
        difficulty: 'MEDIUM',
        orderIndex: 3,
      },
    ],
  });

  // 5. Study Plan
  const plan = await prisma.studyPlan.create({
    data: {
      userId: user.id,
      subjectId: physics.id,
      title: 'Sprint: 3-Week Advanced Physics Mastery',
      description: 'Focus on high-yield rotational mechanics, electrostatics, and revision milestones.',
      dailyHours: 4.5,
      currentPrepLevel: 'Intermediate-Advanced',
      status: 'APPROVED',
      planSummary: 'Targeted daily micro-sessions with built-in revision checkpoints and deliberate recovery pauses.',
    },
  });

  // 6. Study Tasks
  const today = new Date();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.studyTask.createMany({
    data: [
      {
        userId: user.id,
        studyPlanId: plan.id,
        subjectId: physics.id,
        title: 'Derive Rolling Motion Equations & Pure Rolling on Inclined Plane',
        description: 'Complete 4 problem variations from advanced problem set. Focus on friction force direction.',
        priority: 'HIGH',
        status: 'PENDING',
        durationMin: 50,
        dueDate: today,
        isCompleted: false,
      },
      {
        userId: user.id,
        studyPlanId: plan.id,
        subjectId: chemistry.id,
        title: 'Arrhenius Equation Numerical Problem Set (Questions 1-8)',
        description: 'Calculate activation energy from rate constant variation with temperature.',
        priority: 'MEDIUM',
        status: 'PENDING',
        durationMin: 40,
        dueDate: today,
        isCompleted: false,
      },
      {
        userId: user.id,
        studyPlanId: plan.id,
        subjectId: mathematics.id,
        title: 'Definite Integration by Substitution & Properties of Integrals',
        description: 'Review Leibniz integral rule and apply King property to 5 trigonometric integrands.',
        priority: 'URGENT',
        status: 'COMPLETED',
        durationMin: 60,
        dueDate: today,
        isCompleted: true,
        completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        userId: user.id,
        studyPlanId: plan.id,
        subjectId: physics.id,
        title: 'Active Recall: Rotational Inertia Formulas of Standard Symmetrical Bodies',
        description: 'Write out all 10 moment of inertia formulas from memory without reference notes.',
        priority: 'MEDIUM',
        status: 'PENDING',
        durationMin: 30,
        dueDate: tomorrow,
        isCompleted: false,
      },
    ],
  });

  // 7. Notes
  await prisma.note.create({
    data: {
      userId: user.id,
      subjectId: physics.id,
      title: 'Rotational Motion – Key Theorems & Pitfalls',
      content: `# Rotational Motion First Principles

## 1. Parallel Axis Theorem
For any planar or 3D rigid body:
$$I = I_{cm} + M d^2$$
*Crucial Condition*: The first term **must** be evaluated about the center of mass axis, not an arbitrary secondary axis.

## 2. Work-Energy in Pure Rolling
$$E_{total} = \\frac{1}{2} M v_{cm}^2 + \\frac{1}{2} I_{cm} \\omega^2$$
For an object rolling without slipping:
$$v_{cm} = R \\omega$$

## 3. Kinetic Friction Trap
In pure rolling with zero slip, static friction does **zero** net mechanical work on the body because the instantaneous point of contact is momentarily at rest!`,
      isPinned: true,
      tags: 'mechanics,formulas,exam-tips',
    },
  });

  await prisma.note.create({
    data: {
      userId: user.id,
      subjectId: chemistry.id,
      title: 'Chemical Kinetics Quick Review',
      content: `# Chemical Kinetics Summary

### 1st Order Reaction Law
$$\\ln [A]_t = -kt + \\ln [A]_0$$
$$t_{1/2} = \\frac{\\ln 2}{k} \\approx \\frac{0.693}{k}$$

*Key Takeaway*: Half-life for a first-order reaction is completely independent of initial reactant concentration.`,
      isPinned: false,
      tags: 'physical-chemistry,kinetics',
    },
  });

  // 8. Flashcards
  await prisma.flashcard.createMany({
    data: [
      {
        userId: user.id,
        subjectId: physics.id,
        deckTitle: 'Rotational Dynamics Mastery',
        question: 'Under what exact condition is the Perpendicular Axis Theorem strictly applicable?',
        answer: 'It applies ONLY to planar (two-dimensional laminar) bodies lying in the xy plane: Iz = Ix + Iy.',
        keyConcept: 'Laminar Geometry Restriction',
        difficulty: 'MEDIUM',
        reviewCount: 3,
        masteryStatus: 'MASTERED',
      },
      {
        userId: user.id,
        subjectId: physics.id,
        deckTitle: 'Rotational Dynamics Mastery',
        question: 'Does static friction perform net mechanical work during pure rolling?',
        answer: 'No. The point of contact with the ground is instantaneously stationary (velocity = 0), so work done is zero.',
        keyConcept: 'Zero Instantaneous Contact Velocity',
        difficulty: 'HARD',
        reviewCount: 4,
        masteryStatus: 'LEARNING',
      },
      {
        userId: user.id,
        subjectId: chemistry.id,
        deckTitle: 'Reaction Kinetics & Energetics',
        question: 'What is the physical meaning of the pre-exponential factor A in Arrhenius Equation (k = A e^(-Ea/RT))?',
        answer: 'Frequency factor: represents the collision frequency of molecules possessing the appropriate steric orientation.',
        keyConcept: 'Collision Steric Frequency',
        difficulty: 'MEDIUM',
        reviewCount: 2,
        masteryStatus: 'MASTERED',
      },
    ],
  });

  // 9. Quizzes
  const quiz = await prisma.quiz.create({
    data: {
      userId: user.id,
      subjectId: physics.id,
      title: 'Mechanics: Rotational Equilibrium Diagnostic',
      topic: 'Rigid Body Dynamics',
      difficulty: 'MEDIUM',
      totalQuestions: 3,
    },
  });

  await prisma.quizQuestion.createMany({
    data: [
      {
        quizId: quiz.id,
        questionText: 'A solid cylinder and a hollow cylinder of equal mass and radius roll down an inclined plane from rest. Which reaches the bottom first?',
        optionsJson: JSON.stringify([
          'The solid cylinder',
          'The hollow cylinder',
          'Both reach simultaneously',
          'Depends on the coefficient of static friction',
        ]),
        correctIndex: 0,
        explanation: 'The solid cylinder has a smaller moment of inertia (1/2 M R^2 vs M R^2), so a larger fraction of potential energy converts into translational kinetic energy, resulting in higher acceleration.',
        orderIndex: 1,
      },
      {
        quizId: quiz.id,
        questionText: 'If the net external torque acting on a rotating system is zero, which quantity is strictly conserved?',
        optionsJson: JSON.stringify([
          'Linear momentum only',
          'Total mechanical energy',
          'Total angular momentum of the system',
          'Total rotational kinetic energy',
        ]),
        correctIndex: 2,
        explanation: 'By Newton second law in rotational form (Torque = dL/dt), zero net torque directly implies that dL/dt = 0, meaning angular momentum is conserved.',
        orderIndex: 2,
      },
      {
        quizId: quiz.id,
        questionText: 'What is the radius of gyration of a uniform circular disc of radius R about its central perpendicular axis?',
        optionsJson: JSON.stringify([
          'R / 2',
          'R / sqrt(2)',
          'R * sqrt(2)',
          '2 * R / 3',
        ]),
        correctIndex: 1,
        explanation: 'Since I = 1/2 M R^2 and I = M k^2, we have k^2 = R^2 / 2, which gives k = R / sqrt(2).',
        orderIndex: 3,
      },
    ],
  });

  // Quiz Attempt
  await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId: user.id,
      score: 3,
      totalQuestions: 3,
      percentage: 100.0,
      userAnswersJson: JSON.stringify([0, 2, 1]),
      feedback: 'Outstanding mastery! You clearly grasp the interplay between moment of inertia, energy partitioning, and conservation laws.',
    },
  });

  // 10. Study Sessions for the past 7 days (Pomodoro logs for realistic analytics charts)
  for (let i = 6; i >= 0; i--) {
    const sessionDate = new Date();
    sessionDate.setDate(sessionDate.getDate() - i);

    const minutes = [45, 60, 50, 75, 45, 90, 60][6 - i];
    await prisma.studySession.create({
      data: {
        userId: user.id,
        subjectId: i % 2 === 0 ? physics.id : chemistry.id,
        durationMinutes: minutes,
        sessionType: 'POMODORO',
        notes: `Deep focus cycle on ${i % 2 === 0 ? 'Physics derivations' : 'Chemistry numerical practice'}.`,
        completedAt: sessionDate,
      },
    });
  }

  // 11. Switch Agent Action Record
  await prisma.agentAction.create({
    data: {
      userId: user.id,
      studyPlanId: plan.id,
      actionType: 'SCHEDULE_REORGANIZED',
      source: 'SWITCH_MATTERMOST',
      summary: 'Reorganized revision milestone via Switch Mattermost room: Shifted electrostatics quiz to Friday after Aarav requested 2 additional days for Rotational Mechanics.',
      payloadJson: JSON.stringify({
        channel: 'buddhi-study-room',
        userRequest: 'I need more time on Rotational mechanics before testing electrostatics',
        actionTaken: 'Shifted electrostatics tasks +2 days; created extra 45m active recall block',
      }),
      status: 'APPROVED',
      switchRoomId: 'buddhi-study-room-channel-1',
    },
  });

  console.log('[Seed] Seeding completed successfully!');
  console.log('[Seed] Demo credentials -> Email: student@buddhi.ai | Password: Buddhi2026!');
}

main()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
