import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cors } from '../_lib/cors';
import { authenticate } from '../_lib/auth';
import { sendError } from '../_lib/errorResponse';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  const user = authenticate(req, res);
  if (!user) return;

  res.status(200).json({ message: 'Authenticated', user });
}
