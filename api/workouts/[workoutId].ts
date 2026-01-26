import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cors } from '../_lib/cors';
import connectDB from '../_lib/db';
import { authenticate } from '../_lib/auth';
import Workout from '../_lib/models/Workout';
import User from '../_lib/models/User';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  const user = authenticate(req, res);
  if (!user) return;

  const { workoutId } = req.query;

  if (!workoutId || typeof workoutId !== 'string') {
    return res.status(400).json({ error: 'Workout ID is required' });
  }

  await connectDB();

  // GET - Get single workout
  if (req.method === 'GET') {
    try {
      const workout = await Workout.findById(workoutId);

      if (!workout) {
        return res.status(404).json({ error: 'Workout not found' });
      }

      if (workout.userId.toString() !== user.userId && workout.visibility === 'private') {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.status(200).json({ workout });
    } catch (error) {
      console.error('Get workout error:', error);
      return res.status(500).json({ error: 'Failed to fetch workout' });
    }
  }

  // PUT - Update workout
  if (req.method === 'PUT') {
    try {
      const workout = await Workout.findById(workoutId);

      if (!workout) {
        return res.status(404).json({ error: 'Workout not found' });
      }

      if (workout.userId.toString() !== user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { date, title, notes, visibility, exercises, duration, tags } = req.body;

      if (date) workout.date = date;
      if (title !== undefined) workout.title = title;
      if (notes !== undefined) workout.notes = notes;
      if (visibility) workout.visibility = visibility;
      if (exercises) workout.exercises = exercises;
      if (duration !== undefined) workout.duration = duration;
      if (tags) workout.tags = tags;

      await workout.save();

      return res.status(200).json({ message: 'Workout updated successfully', workout });
    } catch (error) {
      console.error('Update workout error:', error);
      return res.status(500).json({ error: 'Failed to update workout' });
    }
  }

  // DELETE - Delete workout
  if (req.method === 'DELETE') {
    try {
      const workout = await Workout.findById(workoutId);

      if (!workout) {
        return res.status(404).json({ error: 'Workout not found' });
      }

      if (workout.userId.toString() !== user.userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await Workout.findByIdAndDelete(workoutId);
      await User.findByIdAndUpdate(user.userId, { $inc: { totalWorkouts: -1 } });

      return res.status(200).json({ message: 'Workout deleted successfully' });
    } catch (error) {
      console.error('Delete workout error:', error);
      return res.status(500).json({ error: 'Failed to delete workout' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
