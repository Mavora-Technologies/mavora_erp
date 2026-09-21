import { db, deals, customers } from '@mavora/database';
import { eq } from 'drizzle-orm';
import { CrmService } from '../crm/crm.service';

export interface CreateDealInput {
  customerId: string;
  title: string;
  value: number;
  currency?: string;
  stage?: string;
  probability?: number;
  expectedCloseDate?: Date | string;
  notes?: string;
}

export class SalesService {
  private crmService: CrmService;

  constructor() {
    this.crmService = new CrmService();
  }

  /**
   * Fetch all deals joined with primary customer details
   */
  async getAllDeals() {
    const records = await db
      .select({
        id: deals.id,
        title: deals.title,
        value: deals.value,
        currency: deals.currency,
        stage: deals.stage,
        probability: deals.probability,
        expectedCloseDate: deals.expectedCloseDate,
        notes: deals.notes,
        createdAt: deals.createdAt,
        updatedAt: deals.updatedAt,
        customer: {
          id: customers.id,
          name: customers.name,
          contactPerson: customers.contactPerson,
          email: customers.email,
          lifecycleStage: customers.lifecycleStage,
        },
      })
      .from(deals)
      .leftJoin(customers, eq(deals.customerId, customers.id));

    return records;
  }

  /**
   * Create a new sales deal linked to an existing customer
   */
  async createDeal(data: CreateDealInput) {
    // 1. Verify customer exists
    const [customerExists] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.id, data.customerId));

    if (!customerExists) {
      throw { status: 404, message: 'Associated customer record not found' };
    }

    // 2. Insert new deal
    const [newDeal] = await db
      .insert(deals)
      .values({
        customerId: data.customerId,
        title: data.title,
        value: data.value,
        currency: data.currency || 'USD',
        stage: data.stage || 'Discovery',
        probability: data.probability ?? 20,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        notes: data.notes || null,
      })
      .returning();

    return newDeal;
  }

  /**
   * Update deal stage with automated Lifecycle Conversion Hook
   */
  async updateDealStage(dealId: string, stage: string) {
    const validStages = ['Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

    if (!validStages.includes(stage)) {
      throw { status: 400, message: 'Invalid deal pipeline stage' };
    }

    // 1. Update the deal stage
    const [updatedDeal] = await db
      .update(deals)
      .set({ stage, updatedAt: new Date() })
      .where(eq(deals.id, dealId))
      .returning();

    if (!updatedDeal) {
      throw { status: 404, message: 'Deal not found' };
    }

    // 2. CONVERSION HOOK: Convert Customer to 'Client' upon 'Closed Won'
    if (stage === 'Closed Won' && updatedDeal.customerId) {
      await this.crmService.updateCustomerStage(updatedDeal.customerId, 'Client');
    }

    return updatedDeal;
  }
}

export const salesService = new SalesService();