import { Router } from 'express';
import { usersController } from './users.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js'; // Adjust path to your auth middleware

const router = Router();

// Ensure all requests to /users/me require a valid JWT token
router.patch('/me', requireAuth, usersController.updateMe);

export default router;