import { Request, Response, NextFunction } from 'express';
import { procurementService } from './procurement.service';

export const getSuppliers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await procurementService.getAllSuppliers();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, contactPerson, email, phone, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name and email are required for suppliers.',
      });
    }

    const newSupplier = await procurementService.createSupplier({
      name,
      contactPerson,
      email,
      phone,
      address,
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: newSupplier,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getPurchaseOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await procurementService.getAllPurchaseOrders();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createPurchaseOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { supplierId, poNumber, currency, expectedDate, notes, items } = req.body;
    
    // Extract user ID from authenticated request session (middleware dependent)
    // Fallbacks to req.body.createdById if testing explicitly without middleware context
    const createdById = (req as any).user?.id || req.body.createdById;

    if (!supplierId || !poNumber || !createdById || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: supplierId, poNumber, createdById (or auth session), and an items array are required.',
      });
    }

    const newPo = await procurementService.createPurchaseOrder({
      supplierId,
      poNumber,
      currency,
      expectedDate,
      notes,
      createdById,
      items,
    });

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully with database product mapping and audit trails',
      data: newPo,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status field is required' });
    }

    const updatedPo = await procurementService.updatePOStatus(id, status);

    res.json({
      success: true,
      message: `Purchase order status updated to ${status}`,
      data: updatedPo,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};