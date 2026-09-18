// apps/api/src/modules/auth/auth.module.ts
import { Router } from 'express';
import authRoutes from './auth.routes.js';

export class AuthModule {
  public router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.use('/', authRoutes);
  }
}

export const authModule = new AuthModule();