// apps/api/src/modules/inventory/inventory.controller.ts
import { Request, Response, NextFunction } from 'express';
import { inventoryService } from './inventory.service.js';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await inventoryService.getAllProducts();
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

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await inventoryService.getProductById(id);
    res.json({ success: true, data });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sku, name, description, category, location, department, costPrice, stockQuantity, reorderLevel } = req.body;

    if (!sku || !name || costPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sku, name, and costPrice are required.',
      });
    }

    const newProduct = await inventoryService.createProduct({
      sku,
      name,
      description,
      category,
      location,
      department,
      costPrice: Number(costPrice),
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : undefined,
      reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Internal asset registered successfully',
      data: newProduct,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const updateStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { stockQuantity } = req.body;

    if (stockQuantity === undefined) {
      return res.status(400).json({ success: false, message: 'Stock quantity field is required' });
    }

    const updatedProduct = await inventoryService.updateStock(id, Number(stockQuantity));

    res.json({
      success: true,
      message: 'Asset stock level updated successfully',
      data: updatedProduct,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const receiveStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || isNaN(Number(quantity))) {
      return res.status(400).json({ success: false, message: 'Valid received quantity is required' });
    }

    const updatedProduct = await inventoryService.adjustStock(id, Number(quantity));

    res.json({
      success: true,
      message: `Successfully received ${quantity} items into inventory stock`,
      data: updatedProduct,
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};