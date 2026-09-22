import { Request, Response } from 'express';
import { settingsService } from './settings.service.js';

export class SettingsController {
  async getSettings(req: Request, res: Response) {
    try {
      const data = await settingsService.getSettings();
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const data = await settingsService.updateSettings(req.body);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }
}

export const settingsController = new SettingsController();