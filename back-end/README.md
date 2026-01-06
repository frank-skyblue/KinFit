# KinFit Backend API

Express.js + TypeScript + MongoDB backend for KinFit fitness tracking app.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/kinfit
JWT_SECRET=your_super_secure_jwt_secret
NODE_ENV=development
```

3. Seed exercises (optional):
```bash
npx ts-node src/seedExercises.ts
```

4. Start development server:
```bash
npm run dev
```

## API Documentation

### Base URL
```
http://localhost:5001/api
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "displayName": "John Doe",
    "units": "lbs",
    "totalWorkouts": 0,
    "currentStreak": 0
  }
}
```

### Workout Endpoints (Protected)

All workout endpoints require authentication header:
```
Authorization: Bearer <jwt_token>
```

#### Create Workout
```http
POST /workouts
Content-Type: application/json
Authorization: Bearer <token>

{
  "date": "2024-01-15",
  "title": "Chest & Back",
  "notes": "Felt strong today",
  "visibility": "private",
  "exercises": [
    {
      "exerciseId": "exercise_id",
      "exerciseName": "Bench Press",
      "weightValue": 185,
      "weightType": "a",
      "reps": 8,
      "sets": 4,
      "notes": "Good form",
      "orderIndex": 0
    }
  ],
  "duration": 60,
  "tags": ["chest", "back"]
}
```

#### Get User Workouts
```http
GET /workouts?page=1&limit=20
Authorization: Bearer <token>
```

#### Get Workout by ID
```http
GET /workouts/:workoutId
Authorization: Bearer <token>
```

#### Update Workout
```http
PUT /workouts/:workoutId
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Updated Title",
  "notes": "Updated notes"
}
```

#### Delete Workout
```http
DELETE /workouts/:workoutId
Authorization: Bearer <token>
```

#### Get Exercise History
```http
GET /workouts/exercise/:exerciseId/history
Authorization: Bearer <token>
```

### Exercise Endpoints (Protected)

#### Get All Exercises
```http
GET /exercises?search=bench&category=strength
Authorization: Bearer <token>
```

#### Create Custom Exercise
```http
POST /exercises
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Cable Flyes",
  "muscleGroups": ["chest"],
  "category": "strength",
  "description": "Cable chest flyes"
}
```

#### Get Exercise by ID
```http
GET /exercises/:exerciseId
Authorization: Bearer <token>
```

## Database Models

### User
- username (unique, lowercase, 3-30 chars)
- email (unique)
- password (hashed)
- displayName
- profilePhoto
- bio
- fitnessGoals
- units (lbs/kg)
- totalWorkouts
- currentStreak
- settings (notifications, visibility)

### Workout
- userId (ref: User)
- date
- title
- notes
- visibility (private/shared)
- exercises (array of ExerciseEntry)
- totalVolume (calculated)
- duration
- tags

### Exercise
- name
- muscleGroups (array)
- category (strength/cardio/flexibility/other)
- isCustom
- createdByUserId (ref: User, if custom)
- description

### ExerciseEntry (embedded in Workout)
- exerciseId (ref: Exercise)
- exerciseName
- weightValue
- weightType (e/a/bw)
- reps
- sets
- notes
- orderIndex

## Scripts

```bash
npm run dev      # Start with nodemon
npm run build    # Compile TypeScript
npm run start    # Run compiled JS
npm run seed     # Seed exercise database
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5001 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/kinfit |
| JWT_SECRET | JWT signing secret | (required) |
| NODE_ENV | Environment | development |

## Error Handling

All endpoints return consistent error format:
```json
{
  "error": "Error message here"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

