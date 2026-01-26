import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cors } from '../lib/cors';
import connectDB from '../lib/db';
import { authenticate } from '../lib/auth';
import Exercise from '../lib/models/Exercise';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  const user = authenticate(req, res);
  if (!user) return;

  const { exerciseId } = req.query;

  if (!exerciseId || typeof exerciseId !== 'string') {
    return res.status(400).json({ error: 'Exercise ID is required' });
  }

  await connectDB();

  // GET - Get single exercise
  if (req.method === 'GET') {
    try {
      const exercise = await Exercise.findById(exerciseId);

      if (!exercise) {
        return res.status(404).json({ error: 'Exercise not found' });
      }

      return res.status(200).json({ exercise });
    } catch (error) {
      console.error('Get exercise error:', error);
      return res.status(500).json({ error: 'Failed to fetch exercise' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
