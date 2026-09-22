// apps/api/src/modules/finance/finance.routes.ts
import { Router } from 'express';
import { financeController } from './finance.controller.js';
// Optional: import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// Apply middleware if needed: router.use(requireAuth);

router.get('/invoices', financeController.getInvoices);
router.post('/invoices', financeController.createInvoice);
router.patch('/invoices/:id/status', financeController.updateInvoiceStatus);

export default router;