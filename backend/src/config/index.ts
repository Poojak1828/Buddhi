import dotenv from 'dotenv';
import path from 'path';

// Search root and backend dirs for .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres@127.0.0.1:5433/buddhi_db?schema=public',
  jwtSecret: process.env.JWT_SECRET || 'buddhi_hackathon_super_secret_jwt_2026_devs',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  aiProvider: process.env.AI_PROVIDER || 'demo',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  switchWebhookSecret: process.env.SWITCH_WEBHOOK_SECRET || 'buddhi_switch_secret_token_2026',
  switchAgentName: process.env.SWITCH_AGENT_NAME || 'Buddhi Study Agent',
  switchRoomName: process.env.SWITCH_ROOM_NAME || 'buddhi-study-room',
  mattermostWebhookUrl: process.env.MATTERMOST_WEBHOOK_URL || '',
};
