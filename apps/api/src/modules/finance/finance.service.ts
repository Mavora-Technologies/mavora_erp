import { db, invoices, customers } from '@mavora/database';
import { eq, desc } from 'drizzle-orm';

export interface CreateInvoiceInput {
  invoiceNumber: string;
  customerId: string;
  projectId?: string;
  amount: number | string;
  status?: string;
  issueDate?: string | Date;
  dueDate?: string | Date;
  notes?: string;
}

export class FinanceService {
  async getInvoices() {
    return await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        customerId: invoices.customerId,
        customerName: customers.name,
        projectId: invoices.projectId,
        amount: invoices.amount,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoiceById(id: string) {
    if (!id) {
      throw { status: 400, message: 'Invoice ID is required' };
    }

    const result = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    const invoice = result[0];
    if (!invoice) {
      throw { status: 404, message: 'Invoice not found' };
    }

    return invoice;
  }

  async createInvoice(data: CreateInvoiceInput) {
    const { invoiceNumber, customerId, projectId, amount, status, issueDate, dueDate, notes } = data;

    if (!invoiceNumber || !customerId || !amount) {
      throw { status: 400, message: 'Invoice number, customer ID, and amount are required' };
    }

    const result = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        customerId,
        projectId: projectId || null,
        amount: amount.toString(),
        status: status || 'Draft',
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
      })
      .returning();

    return result[0];
  }

  async updateInvoiceStatus(id: string, status: string) {
    const validStatuses = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      throw { status: 400, message: 'Invalid invoice status' };
    }

    const result = await db
      .update(invoices)
      .set({ status, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();

    if (!result.length) {
      throw { status: 404, message: 'Invoice not found' };
    }

    return result[0];
  }
}

export const financeService = new FinanceService();