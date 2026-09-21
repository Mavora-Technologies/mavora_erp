// apps/api/src/modules/helpdesk/helpdesk.routes.ts
import { Router } from 'express';
import { getTickets, getTicketById, createTicket, updateTicketStatus } from './helpdesk.controller';

const router = Router();

router.get('/tickets', getTickets);
router.get('/tickets/:id', getTicketById);
router.post('/tickets', createTicket);
router.patch('/tickets/:id/status', updateTicketStatus);

export const helpdeskRoutes = router;