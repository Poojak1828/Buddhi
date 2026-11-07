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
  console.log('=== BUDDHI 7 SPECIFIC CHATBOT TESTS ===\n');

  // Authenticate as student
  const authRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'student@buddhi.ai', password: 'Buddhi2026!' }
  );

  const token = authRes.data?.token;
  console.log(`Authenticated demo student: ${authRes.data?.user?.name} (${authRes.data?.user?.email})`);
  console.log(`Token obtained: ${token ? 'YES' : 'NO'}\n`);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const testCases = [
    {
      id: 1,
      input: 'Hi',
      expectedDesc: 'A natural greeting',
      validate: (reply) => {
        const lower = reply.toLowerCase();
        return (
          (lower.includes('hello') || lower.includes('hi') || lower.includes('welcome')) &&
          !reply.includes('Aarav Sharma') &&
          !reply.includes('SENIOR_SECONDARY_PREP') &&
          !reply.includes('To give you the most targeted and useful guidance')
        );
      },
    },
    {
      id: 2,
      input: 'can u tell 4+4',
      expectedDesc: '"4 + 4 = 8."',
      validate: (reply) => reply.includes('4 + 4 = 8'),
    },
    {
      id: 3,
      input: 'What is 15 multiplied by 6?',
      expectedDesc: '"15 × 6 = 90."',
      validate: (reply) => reply.includes('15 × 6 = 90') || reply.includes('15 x 6 = 90') || reply.includes('90'),
    },
    {
      id: 4,
      input: 'Give me a beginner coding project.',
      expectedDesc: 'A practical beginner-friendly coding project',
      validate: (reply) => {
        const lower = reply.toLowerCase();
        return (
          (lower.includes('project') || lower.includes('track') || lower.includes('stack')) &&
          (lower.includes('beginner') || lower.includes('html') || lower.includes('python') || lower.includes('javascript'))
        );
      },
    },
    {
      id: 5,
      input: 'Explain recursion.',
      expectedDesc: 'A clear explanation of recursion',
      validate: (reply) => {
        const lower = reply.toLowerCase();
        return (
          lower.includes('recursion') &&
          lower.includes('base case') &&
          (lower.includes('recursive step') || lower.includes('calls itself'))
        );
      },
    },
    {
      id: 6,
      input: 'What is the capital of India?',
      expectedDesc: '"New Delhi."',
      validate: (reply) => reply.includes('New Delhi'),
    },
    {
      id: 7,
      input: 'Can you make a quiz on C programming?',
      expectedDesc: 'A relevant response that helps the user create a quiz',
      validate: (reply) => {
        const lower = reply.toLowerCase();
        return (
          (lower.includes('c programming') || lower.includes('quiz') || lower.includes('pointers')) &&
          !reply.includes('To give you the most targeted and useful guidance')
        );
      },
    },
  ];

  let passed = 0;

  for (const tc of testCases) {
    console.log(`--- Test ${tc.id}: "${tc.input}" ---`);
    console.log(`Expected: ${tc.expectedDesc}`);

    const res = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/assistant/chat',
        method: 'POST',
        headers,
      },
      { message: tc.input }
    );

    const reply = res.data?.message?.content || res.data?.response || res.data?.reply || '';
    console.log(`Actual: "${reply.slice(0, 160).replace(/\n/g, ' ')}..."`);

    // Check for forbidden strings
    const hasAarav = reply.includes('Aarav Sharma');
    const hasMenu = reply.includes('To give you the most targeted and useful guidance');
    const hasCoreIntuitionMenu = reply.includes('Core Intuition & Concepts');
    const hasSeniorSec = reply.includes('SENIOR_SECONDARY_PREP');

    let isOk = tc.validate(reply);
    if (hasAarav || hasMenu || hasCoreIntuitionMenu || hasSeniorSec) {
      console.error(`[FAIL] Test ${tc.id} contains forbidden legacy strings!`);
      if (hasAarav) console.error('  - Contains Aarav Sharma');
      if (hasMenu) console.error('  - Contains targeted and useful guidance menu');
      if (hasCoreIntuitionMenu) console.error('  - Contains Core Intuition & Concepts menu');
      if (hasSeniorSec) console.error('  - Contains SENIOR_SECONDARY_PREP');
      isOk = false;
    }

    if (isOk) {
      console.log(`[PASS] Test ${tc.id} passed!\n`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${tc.id} did not match expected criteria.\n`);
    }
  }

  // Also test Switch Hub endpoint (/api/switch/simulate-chat)
  console.log('--- Switch Teammate Hub: "Can u tell 4+4" ---');
  const switchRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/switch/simulate-chat',
      method: 'POST',
      headers,
    },
    { text: 'can u tell 4+4' }
  );

  const switchReply = switchRes.data?.result?.replyText || switchRes.data?.response || '';
  console.log(`Switch output: "${switchReply}"`);
  if (switchReply.includes('4 + 4 = 8') && !switchReply.includes('Aarav Sharma')) {
    console.log('[PASS] Switch Hub arithmetic calculation passed!\n');
    passed++;
  } else {
    console.error('[FAIL] Switch Hub response incorrect.\n');
  }

  console.log(`=== RESULTS: ${passed}/${testCases.length + 1} TESTS PASSED ===`);
  if (passed !== testCases.length + 1) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
