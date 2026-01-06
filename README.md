# KinFit - Fitness Tracking App

KinFit is a fitness tracking app that enables users to log workouts using a flexible note-taking system, track progression over time, and share workouts with accountability partners.

## Tech Stack

### Backend
- **Express.js** - Node.js web framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool
- **TailwindCSS v4** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

## Project Structure

```
KinFit/
├── back-end/               # Express backend
│   ├── src/
│   │   ├── models/         # MongoDB models
│   │   ├── controllers/    # Route controllers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth middleware
│   │   └── app.ts          # Express app entry
│   ├── package.json
│   └── tsconfig.json
│
└── front-end/              # React frontend
    ├── src/
    │   ├── components/     # React components
    │   ├── contexts/       # React contexts
    │   ├── services/       # API services
    │   ├── App.tsx         # Main app component
    │   └── main.tsx        # App entry point
    ├── package.json
    └── vite.config.ts
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd back-end
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in `back-end/` directory:
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/kinfit
JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

4. Seed the exercise database (optional):
```bash
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

Backend will run on `http://localhost:5001`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd front-end
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Workouts
- `POST /api/workouts` - Create workout
- `GET /api/workouts` - Get user workouts (paginated)
- `GET /api/workouts/:workoutId` - Get workout by ID
- `PUT /api/workouts/:workoutId` - Update workout
- `DELETE /api/workouts/:workoutId` - Delete workout
- `GET /api/workouts/exercise/:exerciseId/history` - Get exercise history

### Exercises
- `GET /api/exercises` - Get all exercises (with filters)
- `POST /api/exercises` - Create custom exercise
- `GET /api/exercises/:exerciseId` - Get exercise by ID

## Features Implemented (MVP)

### ✅ Core Features
- User authentication (register/login)
- Workout logging with custom notation
  - Weight notation: `40e` (each hand), `40a` (actual/total), `bw` (bodyweight)
  - Format: `[weight][type] x [reps] x [sets]`
- Exercise library (pre-populated + custom exercises)
- Workout history with pagination
- Dashboard with stats and recent workouts

### 🎨 Design
- KinMeet theme applied (Kin Coral, Navy, Teal, Beige, Stone)
- Montserrat font for headings
- Inter font for body text
- Rounded corners and soft shadows
- Responsive design (mobile-friendly)

## Weight Notation System

KinFit uses a flexible notation system for logging weights:

- **`[number]e`** - Weight per hand (dumbbells)
  - Example: `40e x 10 x 3` = 40lbs each hand, 10 reps, 3 sets
  
- **`[number]a`** - Actual/total weight (machines, barbells)
  - Example: `185a x 5 x 5` = 185lbs total, 5 reps, 5 sets
  
- **`bw`** - Bodyweight exercises
  - Example: `bw x 12 x 4` = bodyweight, 12 reps, 4 sets

## Future Features (Post-MVP)

- Social features (accountability partners)
- Workout sharing and reactions
- Exercise progression tracking and analytics
- Personal records (PRs) tracking
- Workout templates
- Rest timer
- Advanced analytics

## Development Scripts

### Backend
```bash
npm run dev      # Start development server with nodemon
npm run build    # Build TypeScript to JavaScript
npm run start    # Run built JavaScript
npm run seed     # Seed exercise database
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## License

MIT License

## Contributors

Built with ❤️ for fitness enthusiasts

