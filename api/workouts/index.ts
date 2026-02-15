import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { cors } from '../_lib/cors';
import connectDB from '../_lib/db';
import { authenticate } from '../_lib/auth';
import { sendError } from '../_lib/errorResponse';
import Workout from '../_lib/models/Workout';
import User from '../_lib/models/User';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  const user = authenticate(req, res);
  if (!user) return;

  await connectDB();

  // GET - List workouts
  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const workouts = await Workout.find({ userId: new mongoose.Types.ObjectId(user.userId) })
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Workout.countDocuments({ userId: new mongoose.Types.ObjectId(user.userId) });

      return res.status(200).json({
        workouts,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error('Get workouts error:', error);
      return sendError(res, 500, 'Failed to fetch workouts');
    }
  }

  // POST - Create workout
  if (req.method === 'POST') {
    try {
      const { date, title, notes, visibility, exercises, duration, tags } = req.body;

      if (!exercises || exercises.length === 0) {
        return sendError(res, 400, 'At least one exercise is required');
      }

      const workout = new Workout({
        userId: new mongoose.Types.ObjectId(user.userId),
        date: date || new Date(),
        title,
        notes,
        visibility: visibility || 'private',
        exercises,
        duration,
        tags: tags || [],
      });

      await workout.save();

      await User.findByIdAndUpdate(user.userId, { $inc: { totalWorkouts: 1 } });

      return res.status(201).json({ message: 'Workout created successfully', workout });
    } catch (error) {
      console.error('Create workout error:', error);
      return sendError(res, 500, 'Failed to create workout');
    }
  }

  return sendError(res, 405, 'Method not allowed');
}
