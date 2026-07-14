import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  bio?: string;
  skills?: string[];
  githubLink?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    bio: { type: String, trim: true, default: '' },
    skills: [{ type: String, trim: true }],
    githubLink: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', UserSchema);
