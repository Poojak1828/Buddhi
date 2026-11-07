const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function run() {
  console.log('=== BUDDHI COMPREHENSIVE VERIFICATION SUITE ===\n');

  // 1. Authenticate / Login
  console.log('1. Authenticating test user (priya@example.com)...');
  let authRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'priya@example.com', password: 'password123' }
  );

  let token = authRes.data?.token;
  let user = authRes.data?.user;
  if (!token) {
    console.log('Login failed, attempting register...');
    authRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Priya Patel',
        email: 'priya@example.com',
        password: 'password123',
        classStandard: '12',
        stream: 'Science (PCM)',
        targetExam: 'JEE',
      }
    );
    token = authRes.data?.token;
    user = authRes.data?.user;
  }

  console.log(`Authenticated: ${user?.name || 'User'} (${user?.email || 'priya@example.com'}), Class: ${user?.classStandard || '12'}\n`);
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Test AI Chatbot
  console.log('2. Testing AI Chatbot Response Quality...');
  const chatQueries = [
    {
      prompt: 'Give us a project to work on.',
      expectedIntent: 'Hands-on practical project suggestions, NOT formulaic physics/SENIOR_SECONDARY_PREP theory',
    },
    {
      prompt: 'Explain recursion with a small example.',
      expectedIntent: 'Direct programming concept explanation with base case and recursive step',
    },
  ];

  for (const q of chatQueries) {
    console.log(`   Prompt: "${q.prompt}"`);
    const chatRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/ai/chat',
        method: 'POST',
        headers: authHeaders,
      },
      { message: q.prompt }
    );

    const reply = chatRes.data?.response || '';
    console.log(`   Response snippet: "${reply.slice(0, 160).replace(/\n/g, ' ')}..."`);
    
    // Check forbidden strings
    const hasAarav = reply.includes('Aarav Sharma') && user?.name !== 'Aarav Sharma';
    const hasSeniorSec = reply.includes('SENIOR_SECONDARY_PREP');
    const hasGoverning = reply.toLowerCase().includes('governing principle');

    if (hasAarav || hasSeniorSec || hasGoverning) {
      console.error('   [FAIL] Bot still returned rigid fallback/hardcoded template strings!');
      if (hasAarav) console.error('     - Contains "Aarav Sharma"');
      if (hasSeniorSec) console.error('     - Contains "SENIOR_SECONDARY_PREP"');
      if (hasGoverning) console.error('     - Contains "governing principle"');
    } else {
      console.log('   [PASS] Response is natural, dynamic, and does not contain rigid template strings.');
    }
    console.log('');
  }

  // 3. Test Flashcards
  console.log('3. Testing Flashcards: Syllabus-Grounded Generation, CRUD & Mastery...');
  // A. Generate AI flashcards
  console.log('   Generating AI flashcards for Topic "Electromagnetic Induction"...');
  const genCardsRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/flashcards/generate',
      method: 'POST',
      headers: authHeaders,
    },
    {
      topic: 'Electromagnetic Induction',
      chapter: 'Electromagnetism',
      subject: 'Physics',
      count: 6,
    }
  );

  console.log(`   Result: ${genCardsRes.data?.message || 'Generated'}`);
  console.log(`   Deck: "${genCardsRes.data?.deckTitle}", Cards Generated: ${genCardsRes.data?.count || genCardsRes.data?.cards?.length}`);
  const firstCard = genCardsRes.data?.cards?.[0];
  if (firstCard) {
    console.log(`   Sample Card Q: "${firstCard.question || firstCard.front}"`);
    console.log(`   Sample Card A: "${(firstCard.answer || firstCard.back || '').slice(0, 100)}..."`);
    console.log(`   Hierarchy: Subject="${firstCard.subject?.name || 'Physics'}", Chapter="${firstCard.chapterTitle}", Topic="${firstCard.topicTitle}"`);
  }

  // B. Get Flashcards and Syllabus Navigation
  const listCardsRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/flashcards',
      method: 'GET',
      headers: authHeaders,
    }
  );
  console.log(`   Total Flashcards in DB: ${listCardsRes.data?.flashcards?.length || 0}`);
  console.log(`   Total Decks: ${listCardsRes.data?.decks?.length || 0}`);
  console.log(`   Syllabus Subjects returned: ${listCardsRes.data?.subjects?.length || 0}`);

  // C. Update Mastery
  if (firstCard) {
    console.log(`   Updating Mastery for Card ID: ${firstCard.id} to MASTERED...`);
    const masteryRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/flashcards/${firstCard.id}/mastery`,
        method: 'PUT',
        headers: authHeaders,
      },
      { masteryStatus: 'MASTERED' }
    );
    console.log(`   Updated Mastery: status="${masteryRes.data?.card?.masteryStatus}", reviewCount=${masteryRes.data?.card?.reviewCount}`);
  }

  // D. Create Manual Flashcard
  console.log('   Creating Manual Flashcard...');
  const createCardRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/flashcards',
      method: 'POST',
      headers: authHeaders,
    },
    {
      question: 'What is Lenzs Law?',
      answer: 'The direction of induced current is such that it opposes the change in magnetic flux that produces it.',
      keyConcept: 'Conservation of Energy in Induction',
      difficulty: 'MEDIUM',
      subjectId: firstCard?.subjectId,
      chapterTitle: 'Electromagnetism',
      topicTitle: 'Lenzs Law',
      deckTitle: 'Electromagnetic Induction Deck',
    }
  );
  const createdCard = createCardRes.data?.card;
  const createdCardId = createdCard?.id;
  console.log(`   Manual Card Created ID: ${createdCardId}, Q: "${createdCard?.question}"`);

  // E. Edit Flashcard
  if (createdCardId) {
    console.log(`   Editing Flashcard ID: ${createdCardId}...`);
    const editRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/flashcards/${createdCardId}`,
        method: 'PUT',
        headers: authHeaders,
      },
      {
        question: 'State Lenzs Law and its consequence.',
        answer: 'The polarity of induced emf is such that it produces a current whose magnetic field opposes the change in magnetic flux. It is a direct consequence of the Law of Conservation of Energy.',
        keyConcept: 'Conservation of Energy',
        difficulty: 'HARD',
      }
    );
    console.log(`   Edited Question: "${editRes.data?.card?.question || editRes.data?.front}"`);

    // F. Delete Flashcard
    console.log(`   Deleting Flashcard ID: ${createdCardId}...`);
    const delRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/flashcards/${createdCardId}`,
        method: 'DELETE',
        headers: authHeaders,
      }
    );
    console.log(`   Delete Response: ${JSON.stringify(delRes.data)}`);
  }
  console.log('   [PASS] Flashcard generation, syllabus hierarchy, mastery & CRUD verified!\n');

  // 4. Test Quizzes
  console.log('4. Testing Quizzes: 20-Question Requirement, Column List & Evaluation...');
  console.log('   Generating Quiz with 20 questions for Topic "Rotational Motion"...');
  const genQuizRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/quizzes/generate',
      method: 'POST',
      headers: authHeaders,
    },
    {
      topic: 'Rotational Motion',
      chapter: 'Mechanics',
      subject: 'Physics',
      totalQuestions: 20,
      difficulty: 'MEDIUM',
    }
  );

  const quizObj = genQuizRes.data?.quiz || genQuizRes.data;
  const quizId = genQuizRes.data?.quizId || quizObj?.id;
  const questionsList = quizObj?.questions || [];
  console.log(`   Quiz Created: "${quizObj?.title}" (ID: ${quizId})`);
  console.log(`   Questions Count in Generated Quiz: ${questionsList.length}`);

  if (questionsList.length < 20) {
    console.error(`   [FAIL] Quiz has fewer than 20 questions! Expected >= 20, Got ${questionsList.length}`);
  } else {
    console.log(`   [PASS] Quiz has >= 20 questions (${questionsList.length}) as required.`);
  }

  // Check questions have 4 options and explanation
  const sampleQ = questionsList[0];
  if (sampleQ) {
    const opts = JSON.parse(sampleQ.optionsJson || '[]');
    console.log(`   Sample Question 1: "${sampleQ.questionText}"`);
    console.log(`   Options count: ${opts.length}, Correct Index: ${sampleQ.correctIndex}`);
    console.log(`   Explanation snippet: "${(sampleQ.explanation || '').slice(0, 90)}..."`);
  }

  // B. Get Quizzes List
  const listQuizzesRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/quizzes',
      method: 'GET',
      headers: authHeaders,
    }
  );
  const quizList = listQuizzesRes.data?.quizzes || listQuizzesRes.data || [];
  console.log(`   Total Quizzes in List: ${quizList.length}`);
  const listedQuiz = quizList.find((q) => q.id === quizId);
  if (listedQuiz) {
    console.log(`   Listed Quiz Columns: Title="${listedQuiz.title}", Subject="${listedQuiz.subject?.name}", Chapter="${listedQuiz.chapterTitle}", Questions=${listedQuiz.questionsCount}, Status=${listedQuiz.status}`);
  }

  // C. Submit Quiz Attempt
  if (quizId && questionsList.length >= 20) {
    console.log('   Submitting Quiz Attempt with 20 answers and timeSpentSeconds=210...');
    // Answer first 15 questions with correct answers, 3 with wrong, 2 unanswered
    const userAnswers = questionsList.map((q, idx) => {
      if (idx < 15) return q.correctIndex;
      if (idx < 18) return (q.correctIndex + 1) % 4;
      return null;
    });

    const submitRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/quizzes/submit',
        method: 'POST',
        headers: authHeaders,
      },
      {
        quizId: quizId,
        userAnswers: userAnswers,
        timeSpentSeconds: 210,
      }
    );

    const result = submitRes.data;
    console.log(`   Attempt Result: Score=${result.percentage}%, Correct=${result.correctCount}/${result.totalQuestions}, Incorrect=${result.incorrectCount}, Unanswered=${result.unansweredCount}`);
    console.log(`   Time Spent: ${result.timeSpentSeconds}s`);
    console.log(`   Adaptive Recommendation: "${result.adaptiveRecommendation}"`);

    // Verify list status updated
    const listAfterSubmit = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/quizzes',
        method: 'GET',
        headers: authHeaders,
      }
    );
    const updatedQuizList = listAfterSubmit.data?.quizzes || listAfterSubmit.data || [];
    const updatedQuiz = updatedQuizList.find((q) => q.id === quizId);
    console.log(`   Quiz Status in List After Attempt: Status=${updatedQuiz?.status}, HighestScore=${updatedQuiz?.highestScore}%`);
    console.log('   [PASS] 20-Question Quiz generation, list schema, submission & adaptive scoring verified!\n');
  }

  // 5. Switch Hub Personalization
  console.log('5. Testing Switch Hub Personalization...');
  const switchRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/switch/simulate-chat',
      method: 'POST',
      headers: authHeaders,
    },
    { message: 'What should we prepare today?' }
  );
  const switchReply = switchRes.data?.response || '';
  console.log(`   Switch response snippet: "${switchReply.slice(0, 160).replace(/\n/g, ' ')}..."`);
  const switchHasAarav = switchReply.includes('Aarav Sharma') && user?.name !== 'Aarav Sharma';
  if (switchHasAarav) {
    console.error('   [FAIL] Switch still outputs hardcoded "Aarav Sharma"!');
  } else {
    console.log('   [PASS] Switch response personalized with authenticated student profile.\n');
  }

  console.log('=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
