import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const SECRET = process.env.JWT_SECRET || 'fallback_secret';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  roleId: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN as any });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, SECRET) as JwtPayload;
};