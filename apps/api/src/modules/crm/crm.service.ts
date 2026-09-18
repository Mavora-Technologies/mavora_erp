import { db, customers } from '@mavora/database';
import { eq } from 'drizzle-orm';

export interface CreateCustomerInput {
  name: string;
  email: string;
  contact_person?: string;
  phone?: string;
  status?: string;
  company?: string;
}

export class CrmService {
  async getCustomers() {
    return await db.select().from(customers);
  }

  async getCustomerById(id: string) {
    if (!id) {
      throw { status: 400, message: 'Customer ID is required' };
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!customer) {
      throw { status: 404, message: 'Customer not found' };
    }

    return customer;
  }

  async createCustomer(data: CreateCustomerInput) {
    const { name, email, contact_person, phone, company, status } = data;

    if (!name || !email) {
      throw { status: 400, message: 'Name and email are required' };
    }

    const [newCustomer] = await db
      .insert(customers)
      .values({
        name,
        email,
        contact_person,
        phone,
        company,
        status: status || 'Lead',
        createdAt: new Date(),
      })
      .returning();

    return newCustomer;
  }
}

export const crmService = new CrmService();