// apps/api/src/modules/inventory/inventory.routes.ts
import { Router } from 'express';
import {
  getItems,
  getInventoryMetrics,
  getItemById,
  createItem,
  updateItem, // <-- Import update
  deleteItem, // <-- Import delete
  adjustStock,
} from './inventory.controller.js';

const router = Router();

// Metrics endpoint (defined before :id to prevent 'metrics' from being parsed as an ID)
router.get('/items/metrics', getInventoryMetrics);

// Core inventory item endpoints
router.get('/items', getItems);
router.get('/items/:id', getItemById);
router.post('/items', createItem);
router.put('/items/:id', updateItem);     // <-- Added PUT route
router.delete('/items/:id', deleteItem); // <-- Added DELETE route

// Ledger-backed stock adjustment endpoint
router.post('/items/:id/adjust', adjustStock);

// Backward compatibility aliases for legacy endpoints
router.get('/products', getItems);
router.get('/products/metrics', getInventoryMetrics);
router.get('/products/:id', getItemById);
router.post('/products', createItem);
router.put('/products/:id', updateItem);     // <-- Added legacy PUT route
router.delete('/products/:id', deleteItem); // <-- Added legacy DELETE route
router.post('/products/:id/adjust', adjustStock);

export default router;