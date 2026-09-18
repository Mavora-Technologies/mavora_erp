// apps/api/src/routes/index.ts
import { Router } from 'express';
import { authModule } from '../modules/auth/auth.module.js';
import { crmModule } from '../modules/crm/crm.module.js';

const router = Router();

// Mount Modules
router.use('/auth', authModule.router);
router.use('/crm', crmModule.router);

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Operation successful',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Mavora ERP API'
    }
  });
});

export default router;