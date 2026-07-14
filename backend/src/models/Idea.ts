import { Schema, model, Document, Types } from 'mongoose';

export interface IIdea extends Document {
  title: string;
  description: string;
  locationName: string;
  location: {
    lat: number;
    lng: number;
  };
  owner: Types.ObjectId;
  ownerName: string;
  category: string;
  participants: Types.ObjectId[];
  maxParticipants: number;
  waitlist: Types.ObjectId[];
  pickupPoints: {
    lat: number;
    lng: number;
    name: string;
    addedBy: Types.ObjectId;
  }[];
  galleryImages: string[];
  eventDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IdeaSchema = new Schema<IIdea>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    locationName: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String, required: true },
    category: { type: String, required: true, default: 'General' },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    maxParticipants: { type: Number, required: true, default: 10 },
    waitlist: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pickupPoints: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        name: { type: String, required: true },
        addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    galleryImages: [{ type: String }],
    eventDate: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

export const Idea = model<IIdea>('Idea', IdeaSchema);
