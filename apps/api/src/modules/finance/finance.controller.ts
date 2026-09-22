import { Request, Response } from 'express';
import { financeService } from './finance.service.js';

export class FinanceController {
  async getInvoices(req: Request, res: Response) {
    try {
      const data = await financeService.getInvoices();
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async createInvoice(req: Request, res: Response) {
    try {
      const invoice = await financeService.createInvoice(req.body);
      return res.status(201).json({ success: true, data: invoice });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async updateInvoiceStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }

      const invoice = await financeService.updateInvoiceStatus(id, status);
      return res.status(200).json({ success: true, data: invoice });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }
}

export const financeController = new FinanceController();