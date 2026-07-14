import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Idea } from '../models/Idea';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed'));
  },
});

export const uploadGalleryImage = async (req: AuthRequest, res: Response) => {
  try {
    const { ideaId } = req.params;
    
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const idea = await Idea.findById(ideaId);
    if (!idea) {
      // Remove uploaded file if idea not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Idea not found' });
    }

    // Must be participant or owner
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const isParticipant = idea.participants.some((p) => p.equals(userId));
    if (idea.owner.toString() !== req.user.id && !isParticipant) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Only participants can add to gallery' });
    }

    // Create the public URL for the image
    const imageUrl = `/uploads/${req.file.filename}`;
    idea.galleryImages.push(imageUrl);
    await idea.save();

    res.json({ imageUrl, galleryImages: idea.galleryImages });
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error uploading image' });
  }
};
