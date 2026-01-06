import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import Exercise from '../models/Exercise';
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

    const exercises = await Exercise.find(query).sort({ name: 1 }).limit(100);

    res.status(200).json({ exercises });
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
};

export const createExercise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { name, muscleGroups, description, category } = req.body;

    // Validation
    if (!name) {
      res.status(400).json({ error: 'Exercise name is required' });
      return;
    }

    // Check if exercise already exists for this user
    const existingExercise = await Exercise.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      $or: [{ isCustom: false }, { createdByUserId: new mongoose.Types.ObjectId(userId) }],
    });

    if (existingExercise) {
      res.status(400).json({ error: 'Exercise already exists' });
      return;
    }

    // Create custom exercise
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
    res.status(500).json({ error: 'Failed to create exercise' });
  }
};

export const getExerciseById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { exerciseId } = req.params;

    const exercise = await Exercise.findById(exerciseId);

    if (!exercise) {
      res.status(404).json({ error: 'Exercise not found' });
      return;
    }

    res.status(200).json({ exercise });
  } catch (error) {
    console.error('Get exercise error:', error);
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
};

