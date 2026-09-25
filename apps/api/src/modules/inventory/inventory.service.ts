// apps/api/src/modules/inventory/inventory.service.ts
import { db, inventoryItems, inventoryMovements, inventoryCategories, inventoryLocations, products } from '@mavora/database';
import { eq, desc, and, or, isNull } from 'drizzle-orm';

export interface CreateInventoryItemInput {
  sku: string;
  itemCode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  subcategoryId?: string;
  costPrice: number;
  quantityOnHand?: number;
  reorderLevel?: number;
  defaultLocationId?: string;
  defaultDepartmentId?: string;
  performedById: string; // Required for audit trailing
}

export class InventoryService {
  /**
   * Retrieves all active inventory items.
   */
  async getAllItems() {
    return await db
      .select()
      .from(products) // <-- Pointing back to your populated legacy table
      .orderBy(desc(products.createdAt));
  }

  /**
   * Retrieves a specific inventory item by ID.
   */
  async getItemById(id: string) {
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id));

    if (!item) {
      throw { status: 404, message: 'Inventory item not found' };
    }
    return item;
  }

  /**
   * Corporate KPI Aggregation Engine
   * Calculates real-time valuation and stock health metrics.
   */
  async getInventoryMetrics() {
    const allItems = await db
      .select()
      .from(inventoryItems)
      .where(
        or(
          eq(inventoryItems.status, 'ACTIVE'),
          isNull(inventoryItems.status)
        )
      );

    const totalSkus = allItems.length;
    let totalAssetValue = 0;
    let totalPhysicalUnits = 0;
    let lowStockCount = 0;
    let depletedCount = 0;

    const departmentMap: Record<string, { count: number; totalValue: number }> = {};
    const locationMap: Record<string, { count: number; totalValue: number }> = {};

    for (const item of allItems) {
      const price = Number(item.costPrice ?? (item as any).cost_price) || 0;
      const qty = item.quantityOnHand ?? (item as any).quantity_on_hand ?? 0;
      const itemVal = price * qty;

      totalAssetValue += itemVal;
      totalPhysicalUnits += qty;

      const reorderLimit = item.reorderLevel ?? (item as any).reorder_level ?? 5;

      if (qty === 0) {
        depletedCount += 1;
      } else if (qty <= reorderLimit) {
        lowStockCount += 1;
      }

      // Department aggregation
      const dept = item.defaultDepartmentId || (item as any).department || 'Unassigned';
      if (!departmentMap[dept]) {
        departmentMap[dept] = { count: 0, totalValue: 0 };
      }
      departmentMap[dept].count += 1;
      departmentMap[dept].totalValue += itemVal;

      // Location aggregation
      const loc = item.defaultLocationId || (item as any).location || 'Unassigned';
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

  /**
   * Creates a new inventory item in the legacy products table.
   */
  async createItem(data: any) {
    const [existingSku] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.sku, data.sku));
      
    if (existingSku) {
      throw { status: 400, message: 'Item with this SKU already exists' };
    }

    const [newItem] = await db
      .insert(products)
      .values({
        sku: data.sku,
        name: data.name,
        description: data.description || null,
        category: data.category || 'General', 
        location: data.location || 'Nairobi HQ',
        department: data.department || 'Operations',
        costPrice: data.costPrice.toString(),
        stockQuantity: Number(data.stockQuantity ?? data.quantityOnHand ?? 0),
        reorderLevel: Number(data.reorderLevel ?? 5),
      })
      .returning();

    return newItem;
  }

  /**
   * Updates an existing inventory item in the legacy products table.
   */
  async updateItem(id: string, data: any) {
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, id));

    if (!existing) {
      throw { status: 404, message: 'Inventory item not found' };
    }

    const [updatedItem] = await db
      .update(products)
      .set({
        sku: data.sku,
        name: data.name,
        description: data.description || null,
        category: data.category || 'General',
        location: data.location || 'Nairobi HQ',
        department: data.department || 'Operations',
        costPrice: data.costPrice !== undefined ? data.costPrice.toString() : undefined,
        stockQuantity: data.stockQuantity !== undefined ? Number(data.stockQuantity) : undefined,
        reorderLevel: data.reorderLevel !== undefined ? Number(data.reorderLevel) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    return updatedItem;
  }

  /**
   * Deletes an inventory item from the legacy products table.
   */
  async deleteItem(id: string) {
    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, id));

    if (!existing) {
      throw { status: 404, message: 'Inventory item not found' };
    }

    await db
      .delete(products)
      .where(eq(products.id, id));

    return { success: true, message: 'Item deleted successfully' };
  }

  /**
   * Adjusts stock up or down and writes to the immutable movement ledger.
   */
  async adjustStock(id: string, quantityChange: number, performedById: string, reason: string) {
    if (quantityChange === 0) {
      throw { status: 400, message: 'Quantity change must be non-zero' };
    }

    return await db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.id, id));

      if (!item) {
        throw { status: 404, message: 'Inventory item not found' };
      }

      const newQuantity = item.quantityOnHand + quantityChange;
      if (newQuantity < 0) {
        throw { status: 400, message: 'Resulting stock quantity cannot be negative' };
      }

      // Update the master record
      const [updatedItem] = await tx
        .update(inventoryItems)
        .set({ 
          quantityOnHand: newQuantity,
          quantityAvailable: item.quantityAvailable + quantityChange, 
          updatedAt: new Date() 
        })
        .where(eq(inventoryItems.id, id))
        .returning();

      // Log the movement ledger entry
      await tx.insert(inventoryMovements).values({
        inventoryItemId: item.id,
        movementType: quantityChange > 0 ? 'ADJUSTMENT' : 'STOCK_ISSUE',
        quantity: Math.abs(quantityChange),
        quantityBefore: item.quantityOnHand,
        quantityAfter: newQuantity,
        unitCost: item.costPrice,
        fromLocationId: quantityChange < 0 ? item.defaultLocationId : null,
        toLocationId: quantityChange > 0 ? item.defaultLocationId : null,
        performedById,
        reason,
      });

      return updatedItem;
    });
  }
}

export const inventoryService = new InventoryService();