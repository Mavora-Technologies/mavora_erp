// apps/api/src/modules/inventory/inventory.service.ts
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

  // --- Corporate KPI Aggregation Engine ---
  async getInventoryMetrics() {
    const allProducts = await db.select().from(products);

    const totalSkus = allProducts.length;
    let totalAssetValue = 0;
    let totalPhysicalUnits = 0;
    let lowStockCount = 0;
    let depletedCount = 0;

    const departmentMap: Record<string, { count: number; totalValue: number }> = {};
    const locationMap: Record<string, { count: number; totalValue: number }> = {};

    for (const item of allProducts) {
      const price = Number(item.costPrice) || 0;
      const qty = item.stockQuantity || 0;
      const itemVal = price * qty;

      totalAssetValue += itemVal;
      totalPhysicalUnits += qty;

      if (qty === 0) {
        depletedCount += 1;
      } else if (qty <= item.reorderLevel) {
        lowStockCount += 1;
      }

      // Department aggregation
      const dept = item.department || 'Unassigned';
      if (!departmentMap[dept]) {
        departmentMap[dept] = { count: 0, totalValue: 0 };
      }
      departmentMap[dept].count += 1;
      departmentMap[dept].totalValue += itemVal;

      // Location aggregation
      const loc = item.location || 'Unassigned';
      if (!locationMap[loc]) {
        locationMap[loc] = { count: 0, totalValue: 0 };
      }
      locationMap[loc].count += 1;
      locationMap[loc].totalValue += itemVal;
    }

    const averageUnitCost = totalSkus > 0 ? totalAssetValue / (totalPhysicalUnits || 1) : 0;

    return {
      totalAssetValue,
      totalSkus,
      totalPhysicalUnits,
      lowStockCount,
      depletedCount,
      healthyStockCount: totalSkus - (lowStockCount + depletedCount),
      averageUnitCost,
      departmentBreakdown: Object.entries(departmentMap).map(([department, data]) => ({
        department,
        ...data,
      })),
      locationBreakdown: Object.entries(locationMap).map(([location, data]) => ({
        location,
        ...data,
      })),
    };
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