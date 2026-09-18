import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes/index.js'; // Note the .js extension for NodeNext resolution
import { errorHandler } from './middleware/error.middleware.js';

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' }));
app.use(express.json());

// API Routes
app.use('/api/v1', routes);

// Centralized Error Handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Server] Mavora ERP API is running on http://localhost:${PORT}`);
});