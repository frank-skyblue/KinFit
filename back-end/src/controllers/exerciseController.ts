import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Exercise from '../models/Exercise';
import { sendError } from '../utils/errorResponse';
import mongoose from 'mongoose';

export const getExercises = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { search, category, muscleGroup } = req.query;

    const query: any = {
      $or: [{ isCustom: false }, { createdByUserId: new mongoose.Types.ObjectId(userId) }],
    };

    if (search) {
      query.$text = { $search: search as string };
    }

    if (category) {
      query.category = category;
    }

    if (muscleGroup) {
      query.muscleGroups = muscleGroup;
    }

    const exercises = await Exercise.find(query).sort({ name: 1 }).limit(500);

    res.status(200).json({ exercises });
  } catch (error) {
    console.error('Get exercises error:', error);
    return sendError(res, 500, 'Failed to fetch exercises');
  }
};

export const createExercise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 401, 'User not authenticated');
    }

    const { name, muscleGroups, description, category } = req.body;

    if (!name) {
      return sendError(res, 400, 'Exercise name is required');
    }

    const existingExercise = await Exercise.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      $or: [{ isCustom: false }, { createdByUserId: new mongoose.Types.ObjectId(userId) }],
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
      createdByUserId: new mongoose.Types.ObjectId(userId),
    });

    await exercise.save();

    res.status(201).json({
      message: 'Exercise created successfully',
      exercise,
    });
  } catch (error) {
    console.error('Create exercise error:', error);
    return sendError(res, 500, 'Failed to create exercise');
  }
};

export const getExerciseById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { exerciseId } = req.params;

    const exercise = await Exercise.findById(exerciseId);

    if (!exercise) {
      return sendError(res, 404, 'Exercise not found');
    }

    res.status(200).json({ exercise });
  } catch (error) {
    console.error('Get exercise error:', error);
    return sendError(res, 500, 'Failed to fetch exercise');
  }
};

export const updateExercise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { exerciseId } = req.params;

    if (!userId) {
      return sendError(res, 401, 'User not authenticated');
    }

    const exercise = await Exercise.findById(exerciseId);

    if (!exercise) {
      return sendError(res, 404, 'Exercise not found');
    }

    if (!exercise.isCustom || exercise.createdByUserId?.toString() !== userId) {
      return sendError(res, 403, 'You can only edit your own custom exercises');
    }

    const { name, muscleGroups, description, category } = req.body;

    if (name) exercise.name = name;
    if (muscleGroups !== undefined) exercise.muscleGroups = muscleGroups;
    if (description !== undefined) exercise.description = description;
    if (category) exercise.category = category;

    await exercise.save();

    res.status(200).json({ message: 'Exercise updated successfully', exercise });
  } catch (error) {
    console.error('Update exercise error:', error);
    return sendError(res, 500, 'Failed to update exercise');
  }
};

export const deleteExercise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { exerciseId } = req.params;

    if (!userId) {
      return sendError(res, 401, 'User not authenticated');
    }

    const exercise = await Exercise.findById(exerciseId);

    if (!exercise) {
      return sendError(res, 404, 'Exercise not found');
    }

    if (!exercise.isCustom || exercise.createdByUserId?.toString() !== userId) {
      return sendError(res, 403, 'You can only delete your own custom exercises');
    }

    await exercise.deleteOne();

    res.status(200).json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Delete exercise error:', error);
    return sendError(res, 500, 'Failed to delete exercise');
  }
};
