/**
 * Buddhi Switch Agent Standalone CLI Runner & Demo Bridge
 * For Flip the Switch Hackathon 2026 - WeMakeDevs
 */

import { switchService } from './switch.service.js';
import { prisma } from '../config/db.js';

async function runDemo() {
  console.log(`\n=============================================================`);
  console.log(`🚀 BUDDHI SWITCH AGENT RUNNER – FLIP THE SWITCH HACKATHON 2026`);
  console.log(`=============================================================`);
  console.log(`Connecting to Switch Communication Room: 'buddhi-study-room'...`);

  const demoScenarios = [
    {
      step: 1,
      title: 'Student Requests Pending Study Tasks',
      message: 'Hey Buddhi, what are my pending tasks for today?',
    },
    {
      step: 2,
      title: 'Student Reports Falling Behind & Requests Schedule Reorganization',
      message: 'I am feeling overwhelmed with Physics and falling behind. Can you reorganize my schedule?',
    },
    {
      step: 3,
      title: 'Student Requests a Quick Diagnostic Quiz',
      message: 'Can you give me a quick quiz to test my concepts?',
    },
    {
      step: 4,
      title: 'Student Marks a Task as Completed',
      message: 'Completed task #1',
    },
  ];

  for (const scenario of demoScenarios) {
    console.log(`\n-------------------------------------------------------------`);
    console.log(`📍 STEP ${scenario.step}: [${scenario.title}]`);
    console.log(`👤 Student (Mattermost/Switch Room): "${scenario.message}"`);
    console.log(`⚙️  Buddhi Switch Agent processing with Psychological Safety...`);

    const result = await switchService.processRoomMessage({
      text: scenario.message,
      userEmail: 'student@buddhi.ai',
      channelName: 'buddhi-study-room',
      source: 'SWITCH_CONSOLE',
    });

    console.log(`\n🤖 Buddhi Agent Response:`);
    console.log(result.replyText);

    if (result.actionType) {
      console.log(`\n🔄 [Database Sync]: Action '${result.actionType}' recorded in PostgreSQL.`);
    }

    // Small delay between scenarios
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Fetch verified stats
  const totalActions = await prisma.agentAction.count();
  console.log(`\n=============================================================`);
  console.log(`✅ DEMO RUN COMPLETE: ${totalActions} Switch Agent actions verified in DB.`);
  console.log(`🌐 Open Buddhi Web App (http://localhost:5173/switch-hub) to view live sync.`);
  console.log(`=============================================================\n`);
}

runDemo()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
