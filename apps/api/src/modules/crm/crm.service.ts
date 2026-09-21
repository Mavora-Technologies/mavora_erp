import { db, customers } from '@mavora/database';
import { eq, desc } from 'drizzle-orm';

export interface CreateCustomerInput {
  name: string;
  contact_person?: string;
  email: string;
  phone?: string;
  company?: string;
  status?: string;
}

export class CrmService {
  async getCustomers() {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomerById(id: string) {
    if (!id) {
      throw { status: 400, message: 'Customer ID is required' };
    }

    const customerResult = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    const customer = customerResult[0];

    if (!customer) {
      throw { status: 404, message: 'Customer not found' };
    }

    return customer;
  }

  async createCustomer(data: CreateCustomerInput) {
    const { name, contact_person, email, phone, company, status } = data;

    if (!name || !email) {
      throw { status: 400, message: 'Name and email are required' };
    }

    const result = await db
      .insert(customers)
      .values({
        name,
        contactPerson: contact_person,
        email,
        phone,
        company,
        status: status || 'Lead',
      })
      .returning();

    return result[0];
  }

  async updateCustomerStage(id: string, stage: string) {
    const validStages = ['Lead', 'Prospect', 'Opportunity', 'Client', 'Advocate'];
    
    if (!validStages.includes(stage)) {
      throw { status: 400, message: 'Invalid lifecycle stage' };
    }

    const result = await db
      .update(customers)
      .set({ lifecycleStage: stage, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();

    if (!result.length) {
      throw { status: 404, message: 'Customer not found' };
    }

    return result[0];
  }
}

export const crmService = new CrmService();