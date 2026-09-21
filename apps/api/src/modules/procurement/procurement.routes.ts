// apps/api/src/modules/procurement/procurement.routes.ts
import { Router } from 'express';
import {
  getSuppliers,
  createSupplier,
  getPurchaseOrders,
  createPurchaseOrder,
  updateStatus,
} from './procurement.controller';

const router = Router();

// Supplier Routes
router.get('/suppliers', getSuppliers);
router.post('/suppliers', createSupplier);

// Purchase Order Routes
router.get('/purchase-orders', getPurchaseOrders);
router.post('/purchase-orders', createPurchaseOrder);
router.patch('/purchase-orders/:id/status', updateStatus);

export default router;