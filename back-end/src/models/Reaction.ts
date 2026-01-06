import mongoose, { Document, Schema } from 'mongoose';

export interface IReaction extends Document {
  workoutId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reactionType: '💪' | '🔥' | '👏';
  createdAt: Date;
}

const reactionSchema = new Schema<IReaction>(
  {
    workoutId: {
      type: Schema.Types.ObjectId,
      ref: 'Workout',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reactionType: {
      type: String,
      enum: ['💪', '🔥', '👏'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only react once per workout
reactionSchema.index({ workoutId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IReaction>('Reaction', reactionSchema);

