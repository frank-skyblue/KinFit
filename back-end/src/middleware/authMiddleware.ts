import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../services/authenticationService';
import { sendError } from '../utils/errorResponse';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return sendError(res, 401, 'Access token required');
    }

    const payload = verifyToken(token);

    if (!payload) {
      return sendError(res, 403, 'Invalid or expired token');
    }

    req.user = payload;
    next();
  } catch (error) {
    return sendError(res, 403, 'Token verification failed');
  }
};

