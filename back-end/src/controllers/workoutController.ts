import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Workout from '../models/Workout';
import { sendError } from '../utils/errorResponse';
import User from '../models/User';
import mongoose from 'mongoose';

export const createWorkout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 401, 'User not authenticated');
    }

    const { date, title, notes, visibility, exercises, duration, tags } = req.body;

    // Validation
    if (!exercises || exercises.length === 0) {
      return sendError(res, 400, 'At least one exercise is required');
    }

    // Create workout
    const workout = new Workout({
      userId: new mongoose.Types.ObjectId(userId),
      date: date || new Date(),
      title,
      notes,
      visibility: visibility || 'private',
      exercises,
      duration,
      tags: tags || [],
    });

    await workout.save();

    // Update user's total workouts
    await User.findByIdAndUpdate(userId, {
      $inc: { totalWorkouts: 1 },
    });

    res.status(201).json({
      message: 'Workout created successfully',
      workout,
    });
  } catch (error) {
    console.error('Create workout error:', error);
    return sendError(res, 500, 'Failed to create workout');
  }
};

export const getWorkouts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 401, 'User not authenticated');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const workouts = await Workout.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('exercises.exerciseId', 'name');

    const total = await Workout.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });

    res.status(200).json({
      workouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get workouts error:', error);
    return sendError(res, 500, 'Failed to fetch workouts');
  }
};

export const getWorkoutById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { workoutId } = req.params;

    if (!userId) {
      return sendError(res, 401, 'User not authenticated');
    }

    const workout = await Workout.findById(workoutId).populate('exercises.exerciseId', 'name');

    if (!workout) {
      return sendError(res, 404, 'Workout not found');
      return;
    }

    // Check if user has access to this workout
    if (workout.userId.toString() !== userId && workout.visibility === 'private') {
      return sendError(res, 403, 'Access denied');
      return;
    }

    res.status(200).json({ workout });
  } catch (error) {
    console.error('Get workout error:', error);
    return sendError(res, 500, 'Failed to fetch workout');
  }
};

export const updateWorkout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { workoutId } = req.params;

    if (!userId) {
      return sendError(res, 401, 'User not authenticated');
    }

    const workout = await Workout.findById(workoutId);

    if (!workout) {
      return sendError(res, 404, 'Workout not found');
      return;
    }

    // Check if user owns this workout
    if (workout.userId.toString() !== userId) {
      return sendError(res, 403, 'Access denied');
      return;
    }

    const { date, title, notes, visibility, exercises, duration, tags } = req.body;

    // Update fields
    if (date) workout.date = date;
    if (title !== undefined) workout.title = title;
    if (notes !== undefined) workout.notes = notes;
    if (visibility) workout.visibility = visibility;
    if (exercises) workout.exercises = exercises;
    if (duration !== undefined) workout.duration = duration;
    if (tags) workout.tags = tags;

    await workout.save();

    res.status(200).json({
      message: 'Workout updated successfully',
      workout,
    });
  } catch (error) {
    console.error('Update workout error:', error);
    return sendError(res, 500, 'Failed to update workout');
  }
};

export const deleteWorkout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { workoutId } = req.params;

    if (!userId) {
      return sendError(res, 401, 'User not authenticated');
    }

    const workout = await Workout.findById(workoutId);

    if (!workout) {
      return sendError(res, 404, 'Workout not found');
      return;
    }

    // Check if user owns this workout
    if (workout.userId.toString() !== userId) {
      return sendError(res, 403, 'Access denied');
      return;
    }

    await Workout.findByIdAndDelete(workoutId);

    // Update user's total workouts
    await User.findByIdAndUpdate(userId, {
      $inc: { totalWorkouts: -1 },
    });

    res.status(200).json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Delete workout error:', error);
    return sendError(res, 500, 'Failed to delete workout');
  }
};

export const getExerciseHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { exerciseId } = req.params;

    if (!userId) {
      return sendError(res, 401, 'User not authenticated');
    }

    const workouts = await Workout.find({
      userId: new mongoose.Types.ObjectId(userId),
      'exercises.exerciseId': new mongoose.Types.ObjectId(exerciseId),
    }).sort({ date: -1 });

    const history = workouts.map((workout) => {
      const exercise = workout.exercises.find(
        (ex) => ex.exerciseId.toString() === exerciseId
      );
      return {
        workoutId: workout._id,
        date: workout.date,
        workoutTitle: workout.title,
        exercise,
      };
    });

    res.status(200).json({ history });
  } catch (error) {
    console.error('Get exercise history error:', error);
    return sendError(res, 500, 'Failed to fetch exercise history');
  }
};

