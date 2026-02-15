import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/authenticationService';
import { sendError } from '../utils/errorResponse';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
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

    // Register user
    const { user, token } = await registerUser({
      username,
      email,
      password,
      displayName,
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
    if (error instanceof Error) {
      return sendError(res, 400, error.message);
    }
    return sendError(res, 500, 'Registration failed');
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required');
    }

    // Login user
    const { user, token } = await loginUser({ email, password });

    res.status(200).json({
      message: 'Login successful',
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
    if (error instanceof Error) {
      return sendError(res, 401, error.message);
    }
    return sendError(res, 500, 'Login failed');
  }
};

export const verifyAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ message: 'Authenticated', user: (req as any).user });
  } catch (error) {
    return sendError(res, 500, 'Verification failed');
  }
};

