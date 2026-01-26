import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cors } from '../_lib/cors';
import connectDB from '../_lib/db';
import { authenticate } from '../_lib/auth';
import User from '../_lib/models/User';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  const user = authenticate(req, res);
  if (!user) return;

  await connectDB();

  if (req.method === 'GET') {
    // Get current user's profile
    try {
      const userDoc = await User.findById(user.userId).select('-password');

      if (!userDoc) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: userDoc._id,
          username: userDoc.username,
          email: userDoc.email,
          displayName: userDoc.displayName,
          profilePhoto: userDoc.profilePhoto,
          bio: userDoc.bio,
          fitnessGoals: userDoc.fitnessGoals,
          units: userDoc.units,
          birthdate: userDoc.birthdate,
          gender: userDoc.gender,
          height: userDoc.height,
          weight: userDoc.weight,
          activityLevel: userDoc.activityLevel,
          totalWorkouts: userDoc.totalWorkouts,
          currentStreak: userDoc.currentStreak,
          settings: userDoc.settings,
          createdAt: userDoc.createdAt,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  } else if (req.method === 'PUT') {
    // Update current user's profile
    try {
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

      const userDoc = await User.findByIdAndUpdate(
        user.userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      if (!userDoc) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: userDoc._id,
          username: userDoc.username,
          email: userDoc.email,
          displayName: userDoc.displayName,
          profilePhoto: userDoc.profilePhoto,
          bio: userDoc.bio,
          fitnessGoals: userDoc.fitnessGoals,
          units: userDoc.units,
          birthdate: userDoc.birthdate,
          gender: userDoc.gender,
          height: userDoc.height,
          weight: userDoc.weight,
          activityLevel: userDoc.activityLevel,
          totalWorkouts: userDoc.totalWorkouts,
          currentStreak: userDoc.currentStreak,
          settings: userDoc.settings,
          createdAt: userDoc.createdAt,
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
