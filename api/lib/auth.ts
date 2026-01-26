import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'kinfit_default_secret_change_in_production';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
}

export interface AuthenticatedRequest extends VercelRequest {
  user?: TokenPayload;
}

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * Middleware to authenticate requests
 * Returns the user payload if authenticated, or sends 401/403 response
 */
export const authenticate = (
  req: VercelRequest,
  res: VercelResponse
): TokenPayload | null => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return null;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return null;
  }

  return payload;
};
