// apps/api/src/routes/index.ts
import { Router } from 'express';
import { authModule } from '../modules/auth/auth.module.js';
import { crmModule } from '../modules/crm/crm.module.js';
import { salesModule } from '../modules/sales/sales.module.js';
import { procurementModule } from '../modules/procurement/procurement.module.js';
import { inventoryModule } from '../modules/inventory/inventory.module.js';
import { helpdeskRoutes } from '../modules/helpdesk/helpdesk.routes.js';
import { hrmModule } from '../modules/hrm/hrm.module.js';
import projectsRoutes from '../modules/projects/projects.routes.js';
import financeRoutes from '../modules/finance/finance.routes.js';
import settingsRoutes from '../modules/settings/settings.routes.js';

const router = Router();

// Mount Modules
router.use('/auth', authModule.router);
router.use('/crm', crmModule.router);
router.use('/sales', salesModule.router);
router.use('/procurement', procurementModule.router);
router.use('/inventory', inventoryModule.router);
router.use('/helpdesk', helpdeskRoutes);
router.use('/hrm', hrmModule.router);
router.use('/projects', projectsRoutes);
router.use('/finance', financeRoutes);
router.use('/settings', settingsRoutes);

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