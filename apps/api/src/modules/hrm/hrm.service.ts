import { db, employees, departments, leaveRequests, users } from '@mavora/database';
import { eq } from 'drizzle-orm';

export class HrmService {
  // --- Employees ---
  async getAllEmployees() {
    return await db
      .select({
        id: employees.id,
        employeeNumber: employees.employeeNumber,
        jobTitle: employees.jobTitle,
        employmentType: employees.employmentType,
        status: employees.status,
        hireDate: employees.hireDate,
        salary: employees.salary,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        departmentName: departments.name,
      })
      .from(employees)
      .leftJoin(users, eq(employees.userId, users.id))
      .leftJoin(departments, eq(employees.departmentId, departments.id));
  }

  async createEmployee(data: any) {
    // Ensure hireDate is converted to a Date object if it's a string
    const payload = {
      ...data,
      hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
      salary: data.salary ? data.salary : null,
    };

    const [newEmployee] = await db.insert(employees).values(payload).returning();
    return newEmployee;
  }

  // --- Departments ---
  async getAllDepartments() {
    return await db.select().from(departments);
  }

  async createDepartment(data: typeof departments.$inferInsert) {
    const [newDept] = await db.insert(departments).values(data).returning();
    return newDept;
  }

  // --- Leave Requests ---
  async getAllLeaveRequests() {
    return await db
      .select({
        id: leaveRequests.id,
        leaveType: leaveRequests.leaveType,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        createdAt: leaveRequests.createdAt,
        employeeId: leaveRequests.employeeId,
      })
      .from(leaveRequests);
  }

  async createLeaveRequest(data: typeof leaveRequests.$inferInsert) {
    const [newRequest] = await db.insert(leaveRequests).values(data).returning();
    return newRequest;
  }

  async updateLeaveStatus(id: string, status: string, approvedBy: string) {
    const [updated] = await db
      .update(leaveRequests)
      .set({ status, approvedBy, updatedAt: new Date() })
      .where(eq(leaveRequests.id, id))
      .returning();
    return updated;
  }
}

export const hrmService = new HrmService();