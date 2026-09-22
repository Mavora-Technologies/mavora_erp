import { db, projects, customers } from '@mavora/database';
import { eq, desc } from 'drizzle-orm';

export interface CreateProjectInput {
  name: string;
  description?: string;
  customerId: string;
  managerId?: string;
  status?: string;
  priority?: string;
  budget?: number | string;
  startDate?: string | Date;
  dueDate?: string | Date;
}

export class ProjectsService {
  async getProjects() {
    return await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        customerId: projects.customerId,
        customerName: customers.name,
        status: projects.status,
        priority: projects.priority,
        budget: projects.budget,
        startDate: projects.startDate,
        dueDate: projects.dueDate,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .leftJoin(customers, eq(projects.customerId, customers.id))
      .orderBy(desc(projects.createdAt));
  }

  async getProjectById(id: string) {
    if (!id) {
      throw { status: 400, message: 'Project ID is required' };
    }

    const projectResult = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    const project = projectResult[0];

    if (!project) {
      throw { status: 404, message: 'Project not found' };
    }

    return project;
  }

  async createProject(data: CreateProjectInput) {
    const { name, customerId, description, managerId, status, priority, budget, startDate, dueDate } = data;

    if (!name || !customerId) {
      throw { status: 400, message: 'Project name and customer ID are required' };
    }

    const result = await db
      .insert(projects)
      .values({
        name,
        description: description || null,
        customerId,
        managerId: managerId || null,
        status: status || 'Planning',
        priority: priority || 'Medium',
        budget: budget ? budget.toString() : null,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
      })
      .returning();

    return result[0];
  }

  async updateProjectStatus(id: string, status: string) {
    const validStatuses = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      throw { status: 400, message: 'Invalid project status' };
    }

    const result = await db
      .update(projects)
      .set({ status, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    if (!result.length) {
      throw { status: 404, message: 'Project not found' };
    }

    return result[0];
  }
}

export const projectsService = new ProjectsService();