// apps/api/src/modules/projects/projects.routes.ts
import { Router } from 'express';
import { projectsController } from './projects.controller.js';
// Optional: import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// Apply middleware if needed: router.use(requireAuth);

router.get('/', projectsController.getProjects);
router.post('/', projectsController.createProject);
router.patch('/:id/status', projectsController.updateProjectStatus);

export default router;