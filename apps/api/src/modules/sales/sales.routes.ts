import { Router } from 'express';
import { getDeals, createDeal, updateDealStage } from './sales.controller';

const router = Router();

// GET /api/v1/sales/deals
router.get('/deals', getDeals);

// POST /api/v1/sales/deals
router.post('/deals', createDeal);

// PATCH /api/v1/sales/deals/:id/stage
router.patch('/deals/:id/stage', updateDealStage);

export default router;