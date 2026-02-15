import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import { cors } from '../_lib/cors';
import connectDB from '../_lib/db';
import { authenticate } from '../_lib/auth';
import { sendError } from '../_lib/errorResponse';
import Exercise from '../_lib/models/Exercise';

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

      const exercises = await Exercise.find(query).sort({ name: 1 }).limit(500);

      return res.status(200).json({ exercises });
    } catch (error) {
      console.error('Get exercises error:', error);
      return sendError(res, 500, 'Failed to fetch exercises');
    }
  }

  // POST - Create exercise
  if (req.method === 'POST') {
    try {
      const { name, muscleGroups, description, category } = req.body;

      if (!name) {
        return sendError(res, 400, 'Exercise name is required');
      }

      const existingExercise = await Exercise.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        $or: [{ isCustom: false }, { createdByUserId: new mongoose.Types.ObjectId(user.userId) }],
      });

      if (existingExercise) {
        return sendError(res, 400, 'Exercise already exists');
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
      return sendError(res, 500, 'Failed to create exercise');
    }
  }

  // PUT - Update exercise
  if (req.method === 'PUT') {
    try {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return sendError(res, 400, 'Exercise ID is required');
      }

      const exercise = await Exercise.findById(id);
      if (!exercise) {
        return sendError(res, 404, 'Exercise not found');
      }

      if (!exercise.isCustom || exercise.createdByUserId?.toString() !== user.userId) {
        return sendError(res, 403, 'You can only edit your own custom exercises');
      }

      const { name, muscleGroups, description, category } = req.body;
      if (name) exercise.name = name;
      if (muscleGroups !== undefined) exercise.muscleGroups = muscleGroups;
      if (description !== undefined) exercise.description = description;
      if (category) exercise.category = category;

      await exercise.save();
      return res.status(200).json({ message: 'Exercise updated successfully', exercise });
    } catch (error) {
      console.error('Update exercise error:', error);
      return sendError(res, 500, 'Failed to update exercise');
    }
  }

  // DELETE - Delete exercise
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return sendError(res, 400, 'Exercise ID is required');
      }

      const exercise = await Exercise.findById(id);
      if (!exercise) {
        return sendError(res, 404, 'Exercise not found');
      }

      if (!exercise.isCustom || exercise.createdByUserId?.toString() !== user.userId) {
        return sendError(res, 403, 'You can only delete your own custom exercises');
      }

      await exercise.deleteOne();
      return res.status(200).json({ message: 'Exercise deleted successfully' });
    } catch (error) {
      console.error('Delete exercise error:', error);
      return sendError(res, 500, 'Failed to delete exercise');
    }
  }

  return sendError(res, 405, 'Method not allowed');
}
