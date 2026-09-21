// apps/api/src/modules/helpdesk/helpdesk.service.ts
import { db, tickets } from '@mavora/database';
import { eq, desc } from 'drizzle-orm';

export interface CreateTicketInput {
  title: string;
  description?: string;
  priority?: string;
  ticketType?: string;
  source?: string;
  clientName?: string;
  companyName?: string;
  category?: string;
  location?: string;
  department?: string;
  requesterName: string;
  assignee?: string;
}

export class HelpdeskService {
  async getAllTickets() {
    return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
  }

  async getTicketById(id: string) {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    if (!ticket) {
      throw { status: 404, message: 'Support ticket not found' };
    }
    return ticket;
  }

  async createTicket(data: CreateTicketInput) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TKT-${new Date().getFullYear()}-${randomNum}`;

    const [newTicket] = await db
      .insert(tickets)
      .values({
        ticketNumber,
        title: data.title,
        description: data.description || null,
        priority: data.priority || 'MEDIUM',
        ticketType: data.ticketType || 'CLIENT',
        source: data.source || 'WEBSITE',
        clientName: data.clientName || null,
        companyName: data.companyName || null,
        category: data.category || 'Software Development',
        location: data.location || 'Nairobi HQ',
        department: data.department || 'Client Services',
        requesterName: data.requesterName,
        assignee: data.assignee || 'Unassigned',
        status: 'OPEN',
      } as any)
      .returning();

    return newTicket;
  }

  async updateTicketStatus(id: string, status: string, assignee?: string) {
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      throw { status: 400, message: 'Invalid ticket status provided' };
    }

    const updateData: any = { status, updatedAt: new Date() };
    if (assignee !== undefined) {
      updateData.assignee = assignee;
    }

    const [updatedTicket] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, id))
      .returning();

    if (!updatedTicket) {
      throw { status: 404, message: 'Support ticket not found' };
    }

    return updatedTicket;
  }
}

export const helpdeskService = new HelpdeskService();