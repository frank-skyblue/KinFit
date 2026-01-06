import mongoose, { Document, Schema } from 'mongoose';

export interface IExerciseEntry {
  exerciseId: mongoose.Types.ObjectId;
  exerciseName: string;
  weightValue?: number;
  weightType: 'e' | 'a' | 'bw'; // e = each hand, a = actual/total, bw = bodyweight
  reps: number;
  sets: number;
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
    weightValue: {
      type: Number,
      min: 0,
    },
    weightType: {
      type: String,
      enum: ['e', 'a', 'bw'],
      required: true,
    },
    reps: {
      type: Number,
      required: true,
      min: 1,
    },
    sets: {
      type: Number,
      required: true,
      min: 1,
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

// Calculate total volume before saving
workoutSchema.pre('save', function (next) {
  if (this.exercises && this.exercises.length > 0) {
    this.totalVolume = this.exercises.reduce((total, exercise) => {
      const weight = exercise.weightType === 'bw' ? 0 : exercise.weightValue || 0;
      const multiplier = exercise.weightType === 'e' ? 2 : 1; // Double weight for dumbbells (each hand)
      return total + weight * multiplier * exercise.reps * exercise.sets;
    }, 0);
  }
  next();
});

export default mongoose.model<IWorkout>('Workout', workoutSchema);

