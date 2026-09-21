// apps/api/src/modules/helpdesk/helpdesk.controller.ts
import { Request, Response, NextFunction } from 'express';
import { helpdeskService } from './helpdesk.service';

export const getTickets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await helpdeskService.getAllTickets();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await helpdeskService.getTicketById(id);
    res.json({ success: true, data });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      description,
      priority,
      ticketType,
      source,
      clientName,
      companyName,
      category,
      location,
      department,
      requesterName,
      assignee,
    } = req.body;

    if (!title || !requesterName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title and requesterName are mandatory.',
      });
    }

    const newTicket = await helpdeskService.createTicket({
      title,
      description,
      priority,
      ticketType,
      source,
      clientName,
      companyName,
      category,
      location,
      department,
      requesterName,
      assignee,
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket logged successfully',
      data: newTicket,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const updateTicketStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, assignee } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status field is required' });
    }

    const updatedTicket = await helpdeskService.updateTicketStatus(id, status, assignee);

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      data: updatedTicket,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};