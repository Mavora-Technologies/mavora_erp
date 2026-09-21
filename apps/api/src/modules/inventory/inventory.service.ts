import { db, products } from '@mavora/database';
import { eq, desc } from 'drizzle-orm';

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  location?: string;
  department?: string;
  costPrice: number;
  stockQuantity?: number;
  reorderLevel?: number;
}

export class InventoryService {
  async getAllProducts() {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProductById(id: string) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) {
      throw { status: 404, message: 'Internal asset not found' };
    }
    return product;
  }

  async createProduct(data: CreateProductInput) {
    const [existingSku] = await db.select({ id: products.id }).from(products).where(eq(products.sku, data.sku));
    if (existingSku) {
      throw { status: 400, message: 'Asset with this SKU already exists' };
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        sku: data.sku,
        name: data.name,
        description: data.description || null,
        category: data.category || 'General Supplies',
        location: data.location || 'Nairobi HQ',
        department: data.department || 'Operations',
        costPrice: data.costPrice.toString(),
        stockQuantity: data.stockQuantity ?? 0,
        reorderLevel: data.reorderLevel ?? 5,
      } as any)
      .returning();

    return newProduct;
  }

  async updateStock(id: string, stockQuantity: number) {
    if (stockQuantity < 0) {
      throw { status: 400, message: 'Stock quantity cannot be negative' };
    }

    const [updatedProduct] = await db
      .update(products)
      .set({ stockQuantity, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (!updatedProduct) {
      throw { status: 404, message: 'Asset not found' };
    }

    return updatedProduct;
  }

  // Increment stock when items are received (e.g. via LPO/Delivery)
  async adjustStock(id: string, quantityChange: number) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) {
      throw { status: 404, message: 'Asset not found' };
    }

    const newQuantity = product.stockQuantity + quantityChange;
    if (newQuantity < 0) {
      throw { status: 400, message: 'Resulting stock quantity cannot be negative' };
    }

    const [updatedProduct] = await db
      .update(products)
      .set({ stockQuantity: newQuantity, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    return updatedProduct;
  }
}

export const inventoryService = new InventoryService();