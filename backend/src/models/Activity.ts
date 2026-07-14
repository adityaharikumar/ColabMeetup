import { Schema, model, Document, Types } from 'mongoose';

export interface IActivity extends Document {
  user: string;
  userId?: Types.ObjectId;
  action: string;
  target: string;
  targetId?: Types.ObjectId;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    user: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    target: { type: String, required: true },
    targetId: { type: Schema.Types.ObjectId, ref: 'Idea' },
  },
  {
    timestamps: true,
  }
);

export const Activity = model<IActivity>('Activity', ActivitySchema);
