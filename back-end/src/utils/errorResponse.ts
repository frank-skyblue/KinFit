import { Response } from 'express';

/** Send a standardized error response. All API errors use { error: string }. */
export const sendError = (res: Response, status: number, message: string): void => {
  res.status(status).json({ error: message });
};
