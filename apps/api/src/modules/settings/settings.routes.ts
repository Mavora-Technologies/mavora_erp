// apps/api/src/modules/settings/settings.routes.ts
import { Router } from 'express';
import { settingsController } from './settings.controller.js';
// Optional: import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// Apply middleware if needed: router.use(requireAuth);

router.get('/', settingsController.getSettings);
router.patch('/', settingsController.updateSettings);

export default router;