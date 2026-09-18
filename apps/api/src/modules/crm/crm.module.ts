// apps/api/src/modules/crm/crm.module.ts
import { Router } from 'express';
import crmRoutes from './crm.routes.js';

export class CrmModule {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // You can mount multiple route files here if the CRM module expands (e.g., leads, opportunities)
    this.router.use('/', crmRoutes);
  }
}

export const crmModule = new CrmModule();