import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request type to include our decoded user payload
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        roleId: string;
      };
    }
  }
}

// Fallback to a default string if ENV is missing, mirroring standard JWT setups
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Unauthorized: No token provided' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; roleId: string };
    
    // Map the userId from your auth.service.ts payload to req.user.id
    req.user = {
      id: decoded.userId,
      roleId: decoded.roleId
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Forbidden: Invalid or expired token' 
    });
  }
};