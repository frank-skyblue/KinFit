import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  displayName: string;
  profilePhoto?: string;
  bio?: string;
  fitnessGoals?: string;
  units: 'lbs' | 'kg';
  // Personal info
  birthdate?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height?: number; // in cm
  weight?: number; // in user's preferred units (lbs or kg)
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  // Stats
  totalWorkouts: number;
  currentStreak: number;
  settings: {
    defaultWorkoutVisibility: 'private' | 'shared';
    notifications: {
      partnerPRs: boolean;
      partnerWorkouts: boolean;
      comments: boolean;
      reactions: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    fitnessGoals: {
      type: String,
      default: '',
      maxlength: 500,
    },
    units: {
      type: String,
      enum: ['lbs', 'kg'],
      default: 'lbs',
    },
    birthdate: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    height: {
      type: Number, // in cm
      min: 0,
      max: 300,
    },
    weight: {
      type: Number, // in user's preferred units
      min: 0,
      max: 1000,
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    },
    totalWorkouts: {
      type: Number,
      default: 0,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    settings: {
      defaultWorkoutVisibility: {
        type: String,
        enum: ['private', 'shared'],
        default: 'private',
      },
      notifications: {
        partnerPRs: {
          type: Boolean,
          default: true,
        },
        partnerWorkouts: {
          type: Boolean,
          default: true,
        },
        comments: {
          type: Boolean,
          default: true,
        },
        reactions: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', userSchema);

