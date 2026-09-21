import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateStock, receiveStock } from './inventory.controller.js';

const router = Router();

router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.post('/products', createProduct);
router.patch('/products/:id/stock', updateStock);
router.post('/products/:id/receive', receiveStock);

export default router;