import type { VercelRequest, VercelResponse } from '@vercel/node';
import { registerUser, loginUser } from '../services/authenticationService';

export const register = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  try {
    const { username, email, password, displayName } = req.body;

    // Validation
    if (!username || !email || !password || !displayName) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    if (username.length < 3 || username.length > 30) {
      res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
      return;
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
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
};

export const login = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
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
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Login failed' });
    }
  }
};

export const verifyAuth = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  try {
    res.status(200).json({ message: 'Authenticated', user: (req as any).user });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
};
