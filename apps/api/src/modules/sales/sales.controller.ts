import { Request, Response, NextFunction } from 'express';
import { salesService } from './sales.service';

export const getDeals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await salesService.getAllDeals();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createDeal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, title, value, currency, stage, probability, expectedCloseDate, notes } = req.body;

    if (!customerId || !title || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customerId, title, and value are required.',
      });
    }

    const newDeal = await salesService.createDeal({
      customerId,
      title,
      value: Number(value),
      currency,
      stage,
      probability: probability ? Number(probability) : undefined,
      expectedCloseDate,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Sales deal created successfully',
      data: newDeal,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const updateDealStage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({ success: false, message: 'Stage field is required' });
    }

    const updatedDeal = await salesService.updateDealStage(id, stage);

    res.json({
      success: true,
      message: `Deal updated to ${stage}${stage === 'Closed Won' ? ' — Customer converted to Client' : ''}`,
      data: updatedDeal,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};