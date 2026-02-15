import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cors } from '../_lib/cors';
import connectDB from '../_lib/db';
import { authenticate } from '../_lib/auth';
import { sendError } from '../_lib/errorResponse';
import Exercise from '../_lib/models/Exercise';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  const user = authenticate(req, res);
  if (!user) return;

  const { exerciseId } = req.query;

  if (!exerciseId || typeof exerciseId !== 'string') {
    return sendError(res, 400, 'Exercise ID is required');
  }

  await connectDB();

  // GET - Get single exercise
  if (req.method === 'GET') {
    try {
      const exercise = await Exercise.findById(exerciseId);

      if (!exercise) {
        return sendError(res, 404, 'Exercise not found');
      }

      return res.status(200).json({ exercise });
    } catch (error) {
      console.error('Get exercise error:', error);
      return sendError(res, 500, 'Failed to fetch exercise');
    }
  }

  return sendError(res, 405, 'Method not allowed');
}
