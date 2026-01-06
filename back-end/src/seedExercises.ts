import mongoose from 'mongoose';
import Exercise from './models/Exercise';
import { connectDB } from './services/mongooseService';

const defaultExercises = [
  // Chest
  { name: 'Bench Press', muscleGroups: ['chest', 'triceps', 'shoulders'], category: 'strength' },
  { name: 'Incline Bench Press', muscleGroups: ['chest', 'shoulders', 'triceps'], category: 'strength' },
  { name: 'Dumbbell Flyes', muscleGroups: ['chest'], category: 'strength' },
  { name: 'Push-ups', muscleGroups: ['chest', 'triceps', 'core'], category: 'strength' },
  { name: 'Cable Crossover', muscleGroups: ['chest'], category: 'strength' },
  
  // Back
  { name: 'Deadlift', muscleGroups: ['back', 'legs', 'core'], category: 'strength' },
  { name: 'Pull-ups', muscleGroups: ['back', 'biceps'], category: 'strength' },
  { name: 'Barbell Row', muscleGroups: ['back', 'biceps'], category: 'strength' },
  { name: 'Lat Pulldown', muscleGroups: ['back', 'biceps'], category: 'strength' },
  { name: 'Dumbbell Row', muscleGroups: ['back', 'biceps'], category: 'strength' },
  { name: 'Seated Cable Row', muscleGroups: ['back', 'biceps'], category: 'strength' },
  
  // Shoulders
  { name: 'Overhead Press', muscleGroups: ['shoulders', 'triceps'], category: 'strength' },
  { name: 'Lateral Raises', muscleGroups: ['shoulders'], category: 'strength' },
  { name: 'Front Raises', muscleGroups: ['shoulders'], category: 'strength' },
  { name: 'Rear Delt Flyes', muscleGroups: ['shoulders', 'back'], category: 'strength' },
  { name: 'Arnold Press', muscleGroups: ['shoulders', 'triceps'], category: 'strength' },
  
  // Arms
  { name: 'Bicep Curls', muscleGroups: ['biceps'], category: 'strength' },
  { name: 'Hammer Curls', muscleGroups: ['biceps', 'forearms'], category: 'strength' },
  { name: 'Tricep Dips', muscleGroups: ['triceps', 'chest'], category: 'strength' },
  { name: 'Tricep Pushdown', muscleGroups: ['triceps'], category: 'strength' },
  { name: 'Skull Crushers', muscleGroups: ['triceps'], category: 'strength' },
  
  // Legs
  { name: 'Squat', muscleGroups: ['legs', 'glutes', 'core'], category: 'strength' },
  { name: 'Leg Press', muscleGroups: ['legs', 'glutes'], category: 'strength' },
  { name: 'Leg Curls', muscleGroups: ['hamstrings'], category: 'strength' },
  { name: 'Leg Extensions', muscleGroups: ['quadriceps'], category: 'strength' },
  { name: 'Lunges', muscleGroups: ['legs', 'glutes'], category: 'strength' },
  { name: 'Calf Raises', muscleGroups: ['calves'], category: 'strength' },
  
  // Core
  { name: 'Plank', muscleGroups: ['core', 'abs'], category: 'strength' },
  { name: 'Crunches', muscleGroups: ['abs'], category: 'strength' },
  { name: 'Russian Twists', muscleGroups: ['abs', 'obliques'], category: 'strength' },
  { name: 'Leg Raises', muscleGroups: ['abs', 'core'], category: 'strength' },
  
  // Cardio
  { name: 'Running', muscleGroups: ['legs', 'cardio'], category: 'cardio' },
  { name: 'Cycling', muscleGroups: ['legs', 'cardio'], category: 'cardio' },
  { name: 'Jump Rope', muscleGroups: ['full body', 'cardio'], category: 'cardio' },
  { name: 'Rowing', muscleGroups: ['back', 'legs', 'cardio'], category: 'cardio' },
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

