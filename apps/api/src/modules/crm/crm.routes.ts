// apps/api/src/modules/crm/crm.routes.ts
import { Router } from 'express';
import { getCustomers, getCustomerById, createCustomer } from './crm.controller.js';
// Optional: import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// Apply middleware if needed: router.use(requireAuth);

router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerById);
router.post('/customers', createCustomer);

export default router;