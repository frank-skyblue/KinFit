import mongoose from 'mongoose';
import Exercise from './models/Exercise';
import { connectDB } from './services/mongooseService';

const defaultExercises = [
  // Chest
  { name: 'Bench Press', primaryMuscleGroups: ['chest', 'triceps', 'shoulders'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Incline Bench Press', primaryMuscleGroups: ['chest', 'shoulders', 'triceps'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Dumbbell Flyes', primaryMuscleGroups: ['chest'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Push-ups', primaryMuscleGroups: ['chest', 'triceps', 'core'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Cable Crossover', primaryMuscleGroups: ['chest'], secondaryMuscleGroups: [], category: 'strength' },

  // Back
  { name: 'Deadlift', primaryMuscleGroups: ['back', 'legs', 'core'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Pull-ups', primaryMuscleGroups: ['back', 'biceps'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Barbell Row', primaryMuscleGroups: ['back', 'biceps'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Lat Pulldown', primaryMuscleGroups: ['back', 'biceps'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Dumbbell Row', primaryMuscleGroups: ['back', 'biceps'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Seated Cable Row', primaryMuscleGroups: ['back', 'biceps'], secondaryMuscleGroups: [], category: 'strength' },

  // Shoulders
  { name: 'Overhead Press', primaryMuscleGroups: ['shoulders', 'triceps'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Lateral Raises', primaryMuscleGroups: ['shoulders'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Front Raises', primaryMuscleGroups: ['shoulders'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Rear Delt Flyes', primaryMuscleGroups: ['shoulders', 'back'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Arnold Press', primaryMuscleGroups: ['shoulders', 'triceps'], secondaryMuscleGroups: [], category: 'strength' },

  // Arms
  { name: 'Bicep Curls', primaryMuscleGroups: ['biceps'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Hammer Curls', primaryMuscleGroups: ['biceps', 'forearms'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Tricep Dips', primaryMuscleGroups: ['triceps', 'chest'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Tricep Pushdown', primaryMuscleGroups: ['triceps'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Skull Crushers', primaryMuscleGroups: ['triceps'], secondaryMuscleGroups: [], category: 'strength' },

  // Legs
  { name: 'Squat', primaryMuscleGroups: ['legs', 'glutes', 'core'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Leg Press', primaryMuscleGroups: ['legs', 'glutes'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Leg Curls', primaryMuscleGroups: ['hamstrings'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Leg Extensions', primaryMuscleGroups: ['quadriceps'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Lunges', primaryMuscleGroups: ['legs', 'glutes'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Calf Raises', primaryMuscleGroups: ['calves'], secondaryMuscleGroups: [], category: 'strength' },

  // Core
  { name: 'Plank', primaryMuscleGroups: ['core', 'abs'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Crunches', primaryMuscleGroups: ['abs'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Russian Twists', primaryMuscleGroups: ['abs', 'obliques'], secondaryMuscleGroups: [], category: 'strength' },
  { name: 'Leg Raises', primaryMuscleGroups: ['abs', 'core'], secondaryMuscleGroups: [], category: 'strength' },

  // Cardio
  { name: 'Running', primaryMuscleGroups: ['legs', 'cardio'], secondaryMuscleGroups: [], category: 'cardio' },
  { name: 'Cycling', primaryMuscleGroups: ['legs', 'cardio'], secondaryMuscleGroups: [], category: 'cardio' },
  { name: 'Jump Rope', primaryMuscleGroups: ['full body', 'cardio'], secondaryMuscleGroups: [], category: 'cardio' },
  { name: 'Rowing', primaryMuscleGroups: ['back', 'legs', 'cardio'], secondaryMuscleGroups: [], category: 'cardio' },
];

const seedExercises = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Seeding exercises...');
    
    // Clear existing non-custom exercises
    await Exercise.deleteMany({ isCustom: false });
    
    // Insert default exercises
    await Exercise.insertMany(
      defaultExercises.map((ex) => ({
        ...ex,
        isCustom: false,
      }))
    );
    
    console.log(`✅ Successfully seeded ${defaultExercises.length} exercises`);
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding exercises:', error);
    process.exit(1);
  }
};

seedExercises();

