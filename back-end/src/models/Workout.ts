import mongoose, { Document, Schema } from 'mongoose';

export interface ISetEntry {
  // Strength fields
  weightValue?: number;
  weightType?: 'e' | 'a' | 'bw';
  reps?: number;
  sets?: number;
  // Cardio fields
  duration?: number;       // in minutes
  intensityZone?: number;  // 1–4
}

export interface IExerciseEntry {
  exerciseId: mongoose.Types.ObjectId;
  exerciseName: string;
  category?: 'strength' | 'cardio' | 'flexibility' | 'other';
  weightValue?: number;
  weightType?: 'e' | 'a' | 'bw';
  reps?: number;
  sets?: number;
  setEntries?: ISetEntry[];
  notes?: string;
  orderIndex: number;
}

export interface IWorkout extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  title?: string;
  notes?: string;
  visibility: 'private' | 'shared';
  exercises: IExerciseEntry[];
  totalVolume: number; // weight × reps × sets
  duration?: number; // in minutes
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const setEntrySchema = new Schema<ISetEntry>(
  {
    // Strength fields
    weightValue: { type: Number, min: 0 },
    weightType: { type: String, enum: ['e', 'a', 'bw'] },
    reps: { type: Number, min: 1 },
    sets: { type: Number, min: 1 },
    // Cardio fields
    duration: { type: Number, min: 0 },       // in minutes
    intensityZone: { type: Number, min: 1, max: 4 },
  },
  { _id: false }
);

const exerciseEntrySchema = new Schema<IExerciseEntry>(
  {
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    exerciseName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['strength', 'cardio', 'flexibility', 'other'],
      default: 'strength',
    },
    weightValue: {
      type: Number,
      min: 0,
    },
    weightType: {
      type: String,
      enum: ['e', 'a', 'bw'],
      default: 'a',
    },
    reps: {
      type: Number,
      min: 1,
      default: 1,
    },
    sets: {
      type: Number,
      min: 1,
      default: 1,
    },
    setEntries: {
      type: [setEntrySchema],
      default: undefined,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 500,
    },
    orderIndex: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: true }
);

const workoutSchema = new Schema<IWorkout>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    notes: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    visibility: {
      type: String,
      enum: ['private', 'shared'],
      default: 'private',
    },
    exercises: [exerciseEntrySchema],
    totalVolume: {
      type: Number,
      default: 0,
      min: 0,
    },
    duration: {
      type: Number,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
workoutSchema.index({ userId: 1, date: -1 });
workoutSchema.index({ userId: 1, createdAt: -1 });
workoutSchema.index({ 'exercises.exerciseId': 1 });

// Calculate volume for a single set entry
const calcEntryVolume = (entry: { weightType?: string; weightValue?: number; reps?: number; sets?: number }) => {
  const weight = entry.weightType === 'bw' ? 0 : entry.weightValue || 0;
  const multiplier = entry.weightType === 'e' ? 2 : 1; // Double weight for dumbbells (each hand)
  return weight * multiplier * (entry.reps || 0) * (entry.sets || 0);
};

// Calculate total volume before saving (strength exercises only)
workoutSchema.pre('save', function (next) {
  if (this.exercises && this.exercises.length > 0) {
    this.totalVolume = this.exercises.reduce((total, exercise) => {
      // Skip cardio exercises — they don't contribute to volume
      if (exercise.category === 'cardio') return total;
      // Use setEntries if available, otherwise fall back to legacy fields
      if (exercise.setEntries && exercise.setEntries.length > 0) {
        return total + exercise.setEntries.reduce((sub, entry) => sub + calcEntryVolume(entry), 0);
      }
      return total + calcEntryVolume(exercise);
    }, 0);
  }
  next();
});

export default mongoose.model<IWorkout>('Workout', workoutSchema);

