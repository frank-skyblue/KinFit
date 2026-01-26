import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from './services/mongooseService';

// Controllers
import { register, login, verifyAuth } from './controllers/authenticationController';
import { createWorkout, getWorkouts, getWorkoutById, updateWorkout, deleteWorkout, getExerciseHistory } from './controllers/workoutController';
import { getExercises, createExercise, getExerciseById } from './controllers/exerciseController';

// Types
import { AuthRequest } from './middleware/authMiddleware';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Helper to add CORS headers to response
const addCorsHeaders = (res: VercelResponse) => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
};

// Route handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  addCorsHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Connect to database
  try {
    await connectDB();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Database connection failed' });
  }

  // Parse the path
  const path = req.url?.replace(/\?.*$/, '') || '';
  const pathParts = path.split('/').filter(Boolean); // ['api', 'auth', 'login'] etc.
  
  // Remove 'api' prefix if present
  if (pathParts[0] === 'api') {
    pathParts.shift();
  }

  const [resource, ...rest] = pathParts;
  const method = req.method || 'GET';

  console.log(`${method} /${pathParts.join('/')}`);

  try {
    // Health check
    if (resource === 'health') {
      return res.status(200).json({ status: 'ok', message: 'KinFit API is running' });
    }

    // Auth routes (no authentication required for register/login)
    if (resource === 'auth') {
      const action = rest[0];
      
      if (action === 'register' && method === 'POST') {
        return register(req as any, res as any);
      }
      if (action === 'login' && method === 'POST') {
        return login(req as any, res as any);
      }
      if (action === 'verify' && method === 'GET') {
        return withAuth(req, res, verifyAuth);
      }
    }

    // Protected routes - require authentication
    // Workouts
    if (resource === 'workouts') {
      const workoutId = rest[0];
      const subResource = rest[1];

      if (!workoutId) {
        if (method === 'GET') return withAuth(req, res, getWorkouts);
        if (method === 'POST') return withAuth(req, res, createWorkout);
      } else if (subResource === 'history' || (workoutId === 'exercise' && rest[1])) {
        // Handle /workouts/exercise/:exerciseId/history
        const exerciseId = rest[1];
        if (rest[2] === 'history' && method === 'GET') {
          (req as any).params = { exerciseId };
          return withAuth(req, res, getExerciseHistory);
        }
      } else {
        (req as any).params = { workoutId };
        if (method === 'GET') return withAuth(req, res, getWorkoutById);
        if (method === 'PUT') return withAuth(req, res, updateWorkout);
        if (method === 'DELETE') return withAuth(req, res, deleteWorkout);
      }
    }

    // Exercises
    if (resource === 'exercises') {
      const exerciseId = rest[0];

      if (!exerciseId) {
        if (method === 'GET') return withAuth(req, res, getExercises);
        if (method === 'POST') return withAuth(req, res, createExercise);
      } else {
        (req as any).params = { exerciseId };
        if (method === 'GET') return withAuth(req, res, getExerciseById);
      }
    }

    // 404
    return res.status(404).json({ error: 'Route not found' });
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Middleware wrapper for authentication
async function withAuth(
  req: VercelRequest,
  res: VercelResponse,
  handler: (req: AuthRequest, res: VercelResponse) => Promise<void>
) {
  const authReq = req as unknown as AuthRequest;
  
  // Check authentication
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const { verifyToken } = await import('./services/authenticationService');
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  authReq.user = payload;
  
  return handler(authReq, res as any);
}
