// apps/api/src/modules/inventory/inventory.controller.ts
import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service.js';

// Extend Express Request to match the auth.middleware.ts user payload
interface AuthRequest extends Request {
  user?: {
    id: string;
    roleId: string;
  };
}

export const getItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await inventoryService.getAllItems();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getInventoryMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await inventoryService.getInventoryMetrics();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getItemById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await inventoryService.getItemById(id);
    res.json({ success: true, data });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const createItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { 
      sku, 
      itemCode, 
      name, 
      description, 
      categoryId, 
      subcategoryId, 
      costPrice, 
      quantityOnHand, 
      reorderLevel, 
      defaultLocationId, 
      defaultDepartmentId 
    } = req.body;

    // Extract user ID from auth middleware or body payload fallback
    const performedById = req.user?.id || req.body.performedById;

    if (!sku || !name || costPrice === undefined || !performedById) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sku, name, costPrice, and performedById are required.',
      });
    }

    const newItem = await inventoryService.createItem({
      sku,
      itemCode,
      name,
      description,
      categoryId,
      subcategoryId,
      defaultLocationId,
      defaultDepartmentId,
      costPrice: Number(costPrice),
      quantityOnHand: quantityOnHand !== undefined ? Number(quantityOnHand) : undefined,
      reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : undefined,
      performedById,
    });

    res.status(201).json({
      success: true,
      message: 'Inventory item registered successfully',
      data: newItem,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const updateItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updatedItem = await inventoryService.updateItem(id, req.body);
    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: updatedItem,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const deleteItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await inventoryService.deleteItem(id);
    res.json({
      success: true,
      message: 'Inventory item deleted successfully',
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const adjustStock = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { quantityChange, reason } = req.body;
    
    // Extract user ID from auth middleware or body payload fallback
    const performedById = req.user?.id || req.body.performedById;

    if (quantityChange === undefined || isNaN(Number(quantityChange))) {
      return res.status(400).json({ success: false, message: 'Valid quantityChange field is required' });
    }

    if (!performedById || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'performedById and reason are required for audit logging' 
      });
    }

    const updatedItem = await inventoryService.adjustStock(
      id, 
      Number(quantityChange), 
      performedById, 
      reason
    );

    res.json({
      success: true,
      message: 'Inventory stock level adjusted successfully',
      data: updatedItem,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};