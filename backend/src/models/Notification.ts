import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  senderName: string;
  ideaId?: Types.ObjectId;
  type: 'waitlist_join' | 'task_assigned' | 'pickup_added' | 'joined_idea';
  message: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    ideaId: { type: Schema.Types.ObjectId, ref: 'Idea' },
    type: { 
      type: String, 
      enum: ['waitlist_join', 'task_assigned', 'pickup_added', 'joined_idea'],
      required: true
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Notification = model<INotification>('Notification', NotificationSchema);
