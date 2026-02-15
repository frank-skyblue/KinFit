import type { VercelResponse } from '@vercel/node';

/** Send a standardized error response. All API errors use { error: string }. */
export const sendError = (res: VercelResponse, status: number, message: string): VercelResponse =>
  res.status(status).json({ error: message });
