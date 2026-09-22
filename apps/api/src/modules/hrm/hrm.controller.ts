import { Request, Response } from 'express';
import { hrmService } from './hrm.service.js';

export class HrmController {
  // Employees
  async getEmployees(req: Request, res: Response) {
    try {
      const data = await hrmService.getAllEmployees();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createEmployee(req: Request, res: Response) {
    try {
      const data = await hrmService.createEmployee(req.body);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Departments
  async getDepartments(req: Request, res: Response) {
    try {
      const data = await hrmService.getAllDepartments();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createDepartment(req: Request, res: Response) {
    try {
      const data = await hrmService.createDepartment(req.body);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Leave Requests
  async getLeaveRequests(req: Request, res: Response) {
    try {
      const data = await hrmService.getAllLeaveRequests();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createLeaveRequest(req: Request, res: Response) {
    try {
      const data = await hrmService.createLeaveRequest(req.body);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateLeaveStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, approvedBy } = req.body;
      const data = await hrmService.updateLeaveStatus(id, status, approvedBy);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export const hrmController = new HrmController();