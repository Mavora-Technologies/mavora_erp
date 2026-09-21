import { db, suppliers, purchaseOrders, purchaseOrderItems, products, users } from '@mavora/database';
import { eq, desc, inArray } from 'drizzle-orm';

export interface CreateSupplierInput {
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface PurchaseOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number; // Optional: falls back to product cost price if not specified
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  poNumber: string;
  currency?: string;
  expectedDate?: Date | string;
  notes?: string;
  createdById: string; // ID of the user creating the LPO
  items: PurchaseOrderItemInput[];
}

export class ProcurementService {
  async getAllSuppliers() {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async createSupplier(data: CreateSupplierInput) {
    const [newSupplier] = await db.insert(suppliers).values(data).returning();
    return newSupplier;
  }

  /**
   * Fetch all purchase orders joined with supplier details, creator details, and line items
   */
  async getAllPurchaseOrders() {
    const pos = await db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        totalAmount: purchaseOrders.totalAmount,
        currency: purchaseOrders.currency,
        status: purchaseOrders.status,
        expectedDate: purchaseOrders.expectedDate,
        notes: purchaseOrders.notes,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        supplier: {
          id: suppliers.id,
          name: suppliers.name,
          contactPerson: suppliers.contactPerson,
          email: suppliers.email,
          phone: suppliers.phone,
        },
        createdBy: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .leftJoin(users, eq(purchaseOrders.createdById, users.id))
      .orderBy(desc(purchaseOrders.createdAt));

    // Fetch items for each PO to give a complete response structure
    const poIds = pos.map((p) => p.id);
    if (poIds.length === 0) return [];

    const items = await db
      .select({
        id: purchaseOrderItems.id,
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        quantity: purchaseOrderItems.quantity,
        unitPrice: purchaseOrderItems.unitPrice,
        totalPrice: purchaseOrderItems.totalPrice,
        product: {
          id: products.id,
          sku: products.sku,
          name: products.name,
          category: products.category,
        },
      })
      .from(purchaseOrderItems)
      .innerJoin(products, eq(purchaseOrderItems.productId, products.id))
      .where(inArray(purchaseOrderItems.purchaseOrderId, poIds));

    // Map items back to their parent purchase orders
    return pos.map((po) => ({
      ...po,
      items: items.filter((item) => item.purchaseOrderId === po.id),
    }));
  }

  async createPurchaseOrder(data: CreatePurchaseOrderInput) {
    // 1. Verify supplier exists
    const [supplierExists] = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.id, data.supplierId));

    if (!supplierExists) {
      throw { status: 404, message: 'Associated supplier record not found' };
    }

    if (!data.items || data.items.length === 0) {
      throw { status: 400, message: 'Purchase order must contain at least one product item.' };
    }

    // 2. Fetch products from database to get accurate pricing/details
    const productIds = data.items.map((item) => item.productId);
    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let calculatedTotal = 0;
    const processedItems = data.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw { status: 404, message: `Product with ID ${item.productId} not found in database.` };
      }

      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : Number(product.costPrice);
      const totalPrice = unitPrice * item.quantity;
      calculatedTotal += totalPrice;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: unitPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
      };
    });

    // 3. Insert new PO sequentially (Compatible with Neon HTTP driver)
    const [newPo] = await db
      .insert(purchaseOrders)
      .values({
        supplierId: data.supplierId,
        createdById: data.createdById,
        poNumber: data.poNumber,
        totalAmount: calculatedTotal.toFixed(2),
        currency: data.currency || 'USD',
        status: 'Draft',
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
        notes: data.notes || null,
      } as any)
      .returning();

    // 4. Insert corresponding purchase order line items
    const poItemsValues = processedItems.map((item) => ({
      purchaseOrderId: newPo.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    await db.insert(purchaseOrderItems).values(poItemsValues);

    return {
      ...newPo,
      items: processedItems,
    };
  }

  async updatePOStatus(id: string, status: string) {
    const validStatuses = ['Draft', 'Sent', 'Approved', 'Received', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      throw { status: 400, message: 'Invalid purchase order status' };
    }

    // 1. Fetch existing PO to check its previous status (prevents duplicate stock increments)
    const [existingPo] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id));

    if (!existingPo) {
      throw { status: 404, message: 'Purchase order not found' };
    }

    const previousStatus = existingPo.status;

    // 2. Update the Purchase Order status
    const [updatedPo] = await db
      .update(purchaseOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();

    // 3. CRITICAL FEATURE: If status is newly changed to 'Received', increase database stock quantities
    if (status === 'Received' && previousStatus !== 'Received') {
      const poItems = await db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, id));

      for (const item of poItems) {
        // Fetch current product record
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (product) {
          // Determine current stock supporting all possible schema naming conventions
          const currentStock = Number(
            (product as any).stockQuantity ??
            (product as any).stock_quantity ??
            (product as any).stock ??
            (product as any).stockLevel ??
            0
          );
          const newStock = currentStock + Number(item.quantity);

          // Build dynamic update payload matching the correct existing schema property
          const updatePayload: any = {};
          if ('stockQuantity' in product) {
            updatePayload.stockQuantity = newStock;
          } else if ('stock_quantity' in product) {
            updatePayload.stock_quantity = newStock;
          } else if ('stock' in product) {
            updatePayload.stock = newStock;
          } else if ('stockLevel' in product) {
            updatePayload.stockLevel = newStock;
          } else {
            // Safe fallback to 'stockQuantity' or 'stock_quantity'
            updatePayload.stockQuantity = newStock;
          }
          updatePayload.updatedAt = new Date();

          // Update product stock quantity in database
          await db
            .update(products)
            .set(updatePayload)
            .where(eq(products.id, item.productId));
        }
      }
    }

    return updatedPo;
  }
}

export const procurementService = new ProcurementService();