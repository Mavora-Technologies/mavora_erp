import { Router } from 'express';
import { hrmController } from './hrm.controller.js';

const router = Router();

// Employee Endpoints
router.get('/employees', hrmController.getEmployees);
router.post('/employees', hrmController.createEmployee);

// Department Endpoints
router.get('/departments', hrmController.getDepartments);
router.post('/departments', hrmController.createDepartment);

// Leave Request Endpoints
router.get('/leave-requests', hrmController.getLeaveRequests);
router.post('/leave-requests', hrmController.createLeaveRequest);
router.patch('/leave-requests/:id/status', hrmController.updateLeaveStatus);

export const hrmRoutes = router;