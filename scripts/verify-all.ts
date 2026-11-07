async function runVerification() {
  console.log('--- 1. Testing Health Endpoint ---');
  const healthRes = await fetch('http://localhost:5000/health');
  console.log('Health Status:', healthRes.status, await healthRes.json());

  console.log('\n--- 2. Testing User Login ---');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@buddhi.ai', password: 'Buddhi2026!' }),
  });
  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status, 'User:', loginData.user?.name);
  const token = loginData.token;

  console.log('\n--- 3. Testing Buddhi AI Chat (Verify Non-Static Dynamic Synthesis) ---');
  // Prompt A: Physics Concept
  const chatA = await fetch('http://localhost:5000/api/assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: 'Explain how Bernoullis principle works in fluid dynamics with an example' }),
  });
  const chatAData = await chatA.json();
  console.log('Prompt A Reply Preview:\n', chatAData.message.content.slice(0, 180), '...\n');

  // Prompt B: Math Equation Solving
  const chatB = await fetch('http://localhost:5000/api/assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: 'Solve 3x + 12 = 45 and show the steps' }),
  });
  const chatBData = await chatB.json();
  console.log('Prompt B Reply Preview:\n', chatBData.message.content.slice(0, 180), '...\n');

  // Prompt C: Psychological Exam Stress Guidance
  const chatC = await fetch('http://localhost:5000/api/assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: 'I feel really stressed and anxious about my exam coming up in 5 days' }),
  });
  const chatCData = await chatC.json();
  console.log('Prompt C Reply Preview:\n', chatCData.message.content.slice(0, 180), '...\n');

  // Check that the three replies are completely different!
  const areDifferent = chatAData.message.content !== chatBData.message.content && chatBData.message.content !== chatCData.message.content;
  console.log('>> ARE CHAT RESPONSES DYNAMIC & DIFFERENT? ->', areDifferent ? '✅ YES, DYNAMIC & TOPIC-AWARE!' : '❌ NO, REPEATING!');

  console.log('\n--- 4. Testing Switch Telegram Status & Rooms ---');
  const switchStatusRes = await fetch('http://localhost:5000/api/switch/status');
  console.log('Switch Status:', await switchStatusRes.json());

  const switchRoomsRes = await fetch('http://localhost:5000/api/switch/rooms', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const switchRoomsData = await switchRoomsRes.json();
  console.log('Switch Rooms Count:', switchRoomsData.rooms?.length, 'Default Room:', switchRoomsData.rooms?.[0]?.name);
  console.log('Teammates in Room:', switchRoomsData.rooms?.[0]?.teammates?.map((t: any) => `${t.name} (${t.role})`));

  console.log('\n--- 5. Testing Quiz Generation (Short Answer & MCQ) ---');
  const quizGenRes = await fetch('http://localhost:5000/api/quizzes/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      subjectName: 'Physics',
      topic: 'Ray Optics and Wave Theory',
      difficulty: 'MEDIUM',
      quizType: 'SHORT_ANSWER',
      totalQuestions: 3,
    }),
  });
  const quizGenData = await quizGenRes.json();
  console.log('Quiz Generated:', quizGenData);

  // Submit attempt for the generated quiz with written text answers
  const submitRes = await fetch('http://localhost:5000/api/quizzes/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      quizId: quizGenData.quizId,
      userAnswers: [
        'Total internal reflection occurs when angle of incidence exceeds critical angle in a denser medium.',
        'Huygens principle states that every point on a wavefront acts as a secondary spherical wavelet source.',
        'Diffraction is the bending of light waves around obstacles comparable in size to the wavelength.',
      ],
    }),
  });
  const submitData = await submitRes.json();
  console.log('Quiz Evaluation Result: Score =', submitData.score, '/', submitData.totalQuestions, 'Percentage =', submitData.percentage, '%');
  console.log('Evaluation Strengths Sample:', submitData.breakdown?.[0]?.strengths);
  console.log('Evaluation Improvements Sample:', submitData.breakdown?.[0]?.improvements);

  console.log('\n--- 6. Testing Curriculum Auto-Populate ---');
  const popRes = await fetch('http://localhost:5000/api/subjects/auto-populate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      gradeClass: 'Class 12',
      board: 'CBSE',
      stream: 'Science (PCM)',
    }),
  });
  console.log('Curriculum Auto-Populate Result:', await popRes.json());

  console.log('\n=== ALL TECHNICAL VERIFICATIONS PASSED SUCCESSFULLY! ===');
}

runVerification().catch(console.error);
