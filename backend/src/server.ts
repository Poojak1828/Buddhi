import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

const app = express();

// Middlewares
app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Buddhi Full-Stack AI Study Companion API',
    switchStatus: 'READY',
  });
});

// Mount API routes
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🧠 BUDDHI BACKEND SERVER RUNNING`);
  console.log(`📡 URL: http://localhost:${config.port}`);
  console.log(`🔗 API Base: http://localhost:${config.port}/api`);
  console.log(`🤖 Switch Webhook: http://localhost:${config.port}/api/switch/webhook`);
  console.log(`📊 AI Provider Mode: ${config.aiProvider}`);
  console.log(`=======================================================`);
});

export default app;
