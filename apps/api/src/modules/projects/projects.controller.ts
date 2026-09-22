import { Request, Response } from 'express';
import { projectsService } from './projects.service';

export class ProjectsController {
  async getProjects(req: Request, res: Response) {
    try {
      const data = await projectsService.getProjects();
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async createProject(req: Request, res: Response) {
    try {
      const project = await projectsService.createProject(req.body);
      return res.status(201).json({ success: true, data: project });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }

  async updateProjectStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }

      const project = await projectsService.updateProjectStatus(id, status);
      return res.status(200).json({ success: true, data: project });
    } catch (error: any) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
      });
    }
  }
}

export const projectsController = new ProjectsController();