import { Schema, model, Document, Types } from 'mongoose';

export interface ITask extends Document {
  ideaId: Types.ObjectId;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  assignee?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    ideaId: { type: Schema.Types.ObjectId, ref: 'Idea', required: true },
    title: { type: String, required: true, trim: true },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    assignee: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

export const Task = model<ITask>('Task', TaskSchema);
