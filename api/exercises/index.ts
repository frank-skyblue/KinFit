import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { cors } from '../lib/cors';
import connectDB from '../lib/db';
import { authenticate } from '../lib/auth';
import Exercise from '../lib/models/Exercise';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  const user = authenticate(req, res);
  if (!user) return;

  await connectDB();

  // GET - List exercises
  if (req.method === 'GET') {
    try {
      const { search, category, muscleGroup } = req.query;

      const query: any = {
        $or: [{ isCustom: false }, { createdByUserId: new mongoose.Types.ObjectId(user.userId) }],
      };

      if (search) {
        query.name = { $regex: search as string, $options: 'i' };
      }

      if (category) {
        query.category = category;
      }

      if (muscleGroup) {
        query.muscleGroups = muscleGroup;
      }

      const exercises = await Exercise.find(query).sort({ name: 1 }).limit(100);

      return res.status(200).json({ exercises });
    } catch (error) {
      console.error('Get exercises error:', error);
      return res.status(500).json({ error: 'Failed to fetch exercises' });
    }
  }

  // POST - Create exercise
  if (req.method === 'POST') {
    try {
      const { name, muscleGroups, description, category } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Exercise name is required' });
      }

      const existingExercise = await Exercise.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        $or: [{ isCustom: false }, { createdByUserId: new mongoose.Types.ObjectId(user.userId) }],
      });

      if (existingExercise) {
        return res.status(400).json({ error: 'Exercise already exists' });
      }

      const exercise = new Exercise({
        name,
        muscleGroups: muscleGroups || [],
        description,
        category: category || 'strength',
        isCustom: true,
        createdByUserId: new mongoose.Types.ObjectId(user.userId),
      });

      await exercise.save();

      return res.status(201).json({ message: 'Exercise created successfully', exercise });
    } catch (error) {
      console.error('Create exercise error:', error);
      return res.status(500).json({ error: 'Failed to create exercise' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
