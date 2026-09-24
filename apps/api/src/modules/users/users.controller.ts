import { Request, Response } from 'express';
import { usersService } from './users.service.js';

export class UsersController {
  async updateMe(req: Request, res: Response) {
    try {
      // req.user should be populated by your requireAuth middleware
      const userId = (req as any).user?.id; 

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: User ID missing from token' });
      }

      const data = await usersService.updateProfile({
        userId,
        ...req.body
      });

      return res.status(200).json({ 
        success: true, 
        message: 'Profile updated successfully',
        data 
      });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }
}

export const usersController = new UsersController();