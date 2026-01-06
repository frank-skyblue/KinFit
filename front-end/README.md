# KinFit Frontend

React + TypeScript + TailwindCSS frontend for KinFit fitness tracking app.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open browser to `http://localhost:3001`

## Features

- ✅ User authentication (login/signup)
- ✅ Dashboard with workout stats
- ✅ Workout logging with custom notation
- ✅ Exercise library (browse & create)
- ✅ Workout history
- ✅ Responsive design (mobile-friendly)

## Theme

KinFit uses the same theme as KinMeet:

### Colors
- **Kin Coral** (#F47A5F) - Primary buttons, CTAs
- **Kin Navy** (#113B50) - Text, headings
- **Kin Teal** (#4F7A72) - Secondary accents
- **Kin Beige** (#F9F1E3) - Background
- **Kin Stone** (#BFB7AF) - Borders, subtle accents

### Typography
- **Montserrat** - Headings, buttons
- **Inter** - Body text, labels

### Design Patterns
- Rounded corners (0.75rem - 2rem)
- Soft shadows
- Smooth transitions
- Accessible focus states

## Project Structure

```
src/
├── components/
│   ├── auth/              # Login, Signup
│   ├── common/            # Logo, shared components
│   ├── dashboard/         # Dashboard, Layout
│   ├── workouts/          # Workout list, new workout
│   └── exercises/         # Exercise library
├── contexts/
│   └── AuthContext.tsx    # Authentication context
├── services/
│   └── api.ts             # API client
├── App.tsx                # Main app with routes
├── main.tsx               # Entry point
└── index.css              # Global styles + theme
```

## Available Scripts

```bash
npm run dev      # Start Vite dev server (port 3001)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## API Configuration

Backend API runs on `http://localhost:5001` by default.

Proxy is configured in `vite.config.ts`:
```typescript
server: {
  port: 3001,
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true,
    },
  },
}
```

## Components

### Authentication
- **Login** - Email/password login
- **Signup** - User registration
- **ProtectedRoute** - Route guard for authenticated pages

### Dashboard
- **Dashboard** - Home page with stats and recent workouts
- **Layout** - Main layout with navigation

### Workouts
- **WorkoutList** - Paginated list of user workouts
- **NewWorkout** - Form to log new workout

### Exercises
- **ExerciseLibrary** - Browse and create exercises

## Styling

TailwindCSS v4 with custom theme tokens:

```css
/* Colors */
text-kin-coral
bg-kin-navy
border-kin-stone

/* Border Radius */
rounded-kin-sm    /* 0.75rem */
rounded-kin       /* 1rem */
rounded-kin-lg    /* 1.5rem */
rounded-kin-xl    /* 2rem */

/* Shadows */
shadow-kin-soft
shadow-kin-medium
shadow-kin-strong

/* Fonts */
font-montserrat
font-inter
```

## Environment Variables

Create `.env` file (optional):
```env
VITE_API_URL=http://localhost:5001/api
```

## Build for Production

```bash
npm run build
```

Output in `dist/` directory.

Preview production build:
```bash
npm run preview
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

