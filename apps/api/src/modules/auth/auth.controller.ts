// apps/api/src/modules/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};