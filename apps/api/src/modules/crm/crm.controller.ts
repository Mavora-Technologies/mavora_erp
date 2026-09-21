// apps/api/src/modules/crm/crm.controller.ts
import { Request, Response, NextFunction } from 'express';
import { crmService } from './crm.service.js';

export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await crmService.getCustomers();

    res.json({
      success: true,
      message: 'Customers retrieved successfully',
      data: result
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await crmService.getCustomerById(req.params.id);

    res.json({
      success: true,
      message: 'Customer retrieved successfully',
      data: result
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await crmService.createCustomer(req.body);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: result
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const updateCustomerStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;
    
    const result = await crmService.updateCustomerStage(id, stage);

    res.json({
      success: true,
      message: `Customer successfully advanced to ${stage}`,
      data: result
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};