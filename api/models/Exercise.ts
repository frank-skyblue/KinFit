import mongoose, { Document, Schema } from 'mongoose';

export interface IExercise extends Document {
  name: string;
  muscleGroups: string[];
  isCustom: boolean;
  createdByUserId?: mongoose.Types.ObjectId;
  description?: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    muscleGroups: {
      type: [String],
      default: [],
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    createdByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: function (this: IExercise) {
        return this.isCustom;
      },
    },
    description: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ['strength', 'cardio', 'flexibility', 'other'],
      default: 'strength',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient searching
exerciseSchema.index({ name: 'text' });
exerciseSchema.index({ muscleGroups: 1 });
exerciseSchema.index({ isCustom: 1, createdByUserId: 1 });

export default mongoose.models.Exercise || mongoose.model<IExercise>('Exercise', exerciseSchema);
