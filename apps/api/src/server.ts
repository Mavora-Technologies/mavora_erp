// apps/api/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes/index.js'; 
import { errorHandler } from './middleware/error.middleware.js';

// Load env from root (Vercel ignores this since it injects env vars directly)
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// Use an array of allowed origins to support local dev, staging, and production
const allowedOrigins = [
  'http://localhost:3000',
  'https://erp.mavoratechnologies.com',
  'https://mavora-erp.pages.dev',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/v1', routes);

// Centralized Error Handling
app.use(errorHandler);

// ONLY listen if not running in Vercel's serverless environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[Server] Mavora ERP API is running on http://localhost:${PORT}`);
  });
}

// CRITICAL: Export the app so Vercel can invoke it
export default app;