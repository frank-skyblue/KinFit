import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
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
        query.$and = [
          { $or: query.$or },
          {
            $or: [
              { primaryMuscleGroups: muscleGroup },
              { secondaryMuscleGroups: muscleGroup },
            ],
          },
        ];
        delete query.$or;
      }

      const exercises = await Exercise.find(query)
        .sort({ name: 1 })
        .limit(500)
        .lean();

      return res.status(200).json({ exercises });
    } catch (error) {
      console.error('Get exercises error:', error);
      return sendError(res, 500, 'Failed to fetch exercises');
    }
  }

  // POST - Create exercise
  if (req.method === 'POST') {
    try {
      const {
        name,
        primaryMuscleGroups,
        secondaryMuscleGroups,
        description,
        category,
        isCustom: isCustomParam,
        isBuiltIn: isBuiltInParam,
      } = req.body;

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

      const primary = primaryMuscleGroups ?? [];
      const secondary = secondaryMuscleGroups ?? [];

      const userDoc = await User.findById(user.userId).select('isAdmin').lean();
      const isAdmin = !!(userDoc as { isAdmin?: boolean } | null)?.isAdmin;
      const wantsBuiltIn = isCustomParam === false || isBuiltInParam === true;
      const isCustom = isAdmin && wantsBuiltIn ? false : true;

      const exercise = new Exercise({
        name,
        primaryMuscleGroups: primary,
        secondaryMuscleGroups: secondary,
        description,
        category: category || 'strength',
        isCustom,
        ...(isCustom && { createdByUserId: new mongoose.Types.ObjectId(user.userId) }),
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

      const isOwner =
        exercise.isCustom && exercise.createdByUserId?.toString() === user.userId;
      const userDoc = await User.findById(user.userId).select('isAdmin').lean();
      const isAdmin = !!(userDoc as { isAdmin?: boolean })?.isAdmin;
      if (
        !isOwner &&
        !(isAdmin && !exercise.isCustom)
      ) {
        return sendError(res, 403, 'You can only edit your own custom exercises or built-in exercises as admin');
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

      const isOwner =
        exercise.isCustom && exercise.createdByUserId?.toString() === user.userId;
      const userDoc = await User.findById(user.userId).select('isAdmin').lean();
      const isAdmin = !!(userDoc as { isAdmin?: boolean })?.isAdmin;
      if (
        !isOwner &&
        !(isAdmin && !exercise.isCustom)
      ) {
        return sendError(res, 403, 'You can only delete your own custom exercises or built-in exercises as admin');
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
