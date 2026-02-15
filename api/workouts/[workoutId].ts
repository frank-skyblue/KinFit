import type { VercelRequest, VercelResponse } from '@vercel/node';
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

  const { workoutId } = req.query;

  if (!workoutId || typeof workoutId !== 'string') {
    return sendError(res, 400, 'Workout ID is required');
  }

  await connectDB();

  // GET - Get single workout
  if (req.method === 'GET') {
    try {
      const workout = await Workout.findById(workoutId);

      if (!workout) {
        return sendError(res, 404, 'Workout not found');
      }

      if (workout.userId.toString() !== user.userId && workout.visibility === 'private') {
        return sendError(res, 403, 'Access denied');
      }

      return res.status(200).json({ workout });
    } catch (error) {
      console.error('Get workout error:', error);
      return sendError(res, 500, 'Failed to fetch workout');
    }
  }

  // PUT - Update workout
  if (req.method === 'PUT') {
    try {
      const workout = await Workout.findById(workoutId);

      if (!workout) {
        return sendError(res, 404, 'Workout not found');
      }

      if (workout.userId.toString() !== user.userId) {
        return sendError(res, 403, 'Access denied');
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
      return sendError(res, 500, 'Failed to update workout');
    }
  }

  // DELETE - Delete workout
  if (req.method === 'DELETE') {
    try {
      const workout = await Workout.findById(workoutId);

      if (!workout) {
        return sendError(res, 404, 'Workout not found');
      }

      if (workout.userId.toString() !== user.userId) {
        return sendError(res, 403, 'Access denied');
      }

      await Workout.findByIdAndDelete(workoutId);
      await User.findByIdAndUpdate(user.userId, { $inc: { totalWorkouts: -1 } });

      return res.status(200).json({ message: 'Workout deleted successfully' });
    } catch (error) {
      console.error('Delete workout error:', error);
      return sendError(res, 500, 'Failed to delete workout');
    }
  }

  return sendError(res, 405, 'Method not allowed');
}
