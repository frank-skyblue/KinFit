import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cors } from '../_lib/cors';
import connectDB from '../_lib/db';
import { authenticate } from '../_lib/auth';
import { sendError } from '../_lib/errorResponse';
import Exercise from '../_lib/models/Exercise';
import User from '../_lib/models/User';

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
      const exercise = await Exercise.findById(exerciseId).lean();

      if (!exercise) {
        return sendError(res, 404, 'Exercise not found');
      }

      return res.status(200).json({ exercise });
    } catch (error) {
      console.error('Get exercise error:', error);
      return sendError(res, 500, 'Failed to fetch exercise');
    }
  }

  // PUT - Update exercise (path: /api/exercises/:exerciseId)
  if (req.method === 'PUT') {
    try {
      const exercise = await Exercise.findById(exerciseId);
      if (!exercise) {
        return sendError(res, 404, 'Exercise not found');
      }

      const isOwner =
        exercise.isCustom && exercise.createdByUserId?.toString() === user.userId;
      const userDoc = await User.findById(user.userId).select('isAdmin').lean();
      const isAdmin = !!(userDoc as { isAdmin?: boolean })?.isAdmin;
      if (!isOwner && !(isAdmin && !exercise.isCustom)) {
        return sendError(
          res,
          403,
          'You can only edit your own custom exercises or built-in exercises as admin'
        );
      }

      const {
        name,
        primaryMuscleGroups,
        secondaryMuscleGroups,
        description,
        category,
      } = req.body;
      if (name) exercise.name = name;
      if (primaryMuscleGroups !== undefined) exercise.primaryMuscleGroups = primaryMuscleGroups;
      if (secondaryMuscleGroups !== undefined) exercise.secondaryMuscleGroups = secondaryMuscleGroups;
      if (description !== undefined) exercise.description = description;
      if (category) exercise.category = category;

      await exercise.save();
      return res.status(200).json({ message: 'Exercise updated successfully', exercise });
    } catch (error) {
      console.error('Update exercise error:', error);
      return sendError(res, 500, 'Failed to update exercise');
    }
  }

  // DELETE - Delete exercise (path: /api/exercises/:exerciseId)
  if (req.method === 'DELETE') {
    try {
      const exercise = await Exercise.findById(exerciseId);
      if (!exercise) {
        return sendError(res, 404, 'Exercise not found');
      }

      const isOwner =
        exercise.isCustom && exercise.createdByUserId?.toString() === user.userId;
      const userDoc = await User.findById(user.userId).select('isAdmin').lean();
      const isAdmin = !!(userDoc as { isAdmin?: boolean })?.isAdmin;
      if (!isOwner && !(isAdmin && !exercise.isCustom)) {
        return sendError(
          res,
          403,
          'You can only delete your own custom exercises or built-in exercises as admin'
        );
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
