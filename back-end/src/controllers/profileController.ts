import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import { sendError } from '../utils/errorResponse';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        fitnessGoals: user.fitnessGoals,
        units: user.units,
        birthdate: user.birthdate,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activityLevel,
        totalWorkouts: user.totalWorkouts,
        currentStreak: user.currentStreak,
        settings: user.settings,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return sendError(res, 500, 'Failed to get profile');
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const {
      displayName,
      bio,
      fitnessGoals,
      units,
      birthdate,
      gender,
      height,
      weight,
      activityLevel,
      settings,
    } = req.body;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (fitnessGoals !== undefined) updateData.fitnessGoals = fitnessGoals;
    if (units !== undefined) updateData.units = units;
    if (birthdate !== undefined) updateData.birthdate = birthdate ? new Date(birthdate) : null;
    if (gender !== undefined) updateData.gender = gender;
    if (height !== undefined) updateData.height = height;
    if (weight !== undefined) updateData.weight = weight;
    if (activityLevel !== undefined) updateData.activityLevel = activityLevel;
    if (settings !== undefined) updateData.settings = settings;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        profilePhoto: user.profilePhoto,
        bio: user.bio,
        fitnessGoals: user.fitnessGoals,
        units: user.units,
        birthdate: user.birthdate,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activityLevel,
        totalWorkouts: user.totalWorkouts,
        currentStreak: user.currentStreak,
        settings: user.settings,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return sendError(res, 500, 'Failed to update profile');
  }
};
