import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { cors } from '../_lib/cors';
import connectDB from '../_lib/db';
import { generateToken } from '../_lib/auth';
import { sendError } from '../_lib/errorResponse';
import User from '../_lib/models/User';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (cors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  const { username, email, password, displayName } = req.body;

  // Validation
  if (!username || !email || !password || !displayName) {
    return sendError(res, 400, 'All fields are required');
  }

  if (password.length < 6) {
    return sendError(res, 400, 'Password must be at least 6 characters');
  }

  if (username.length < 3 || username.length > 30) {
    return sendError(res, 400, 'Username must be between 3 and 30 characters');
  }

  try {
    await connectDB();

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return sendError(res, 400, 'Email already registered');
      }
      return sendError(res, 400, 'Username already taken');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName,
    });

    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        profilePhoto: user.profilePhoto,
        units: user.units,
        totalWorkouts: user.totalWorkouts,
        currentStreak: user.currentStreak,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return sendError(res, 500, 'Registration failed');
  }
}
