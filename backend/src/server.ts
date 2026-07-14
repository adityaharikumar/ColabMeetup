import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns';
import { register, login, getMe } from './controllers/authController';
import { createIdea, getAllIdeas, getIdeaById, toggleJoinIdea, deleteIdea, addPickupPoint, removePickupPoint } from './controllers/ideaController';
import { getUserProfile, updateProfile } from './controllers/userController';
import { getTasksByIdea, createTask, updateTask, deleteTask } from './controllers/taskController';
import { upload, uploadGalleryImage } from './controllers/uploadController';
import { getNotifications, markAsRead, markAllAsRead } from './controllers/notificationController';
import { getActivities } from './controllers/activityController';
import { getLeaderboard } from './controllers/userController';
import { authenticateToken } from './middleware/auth';
import path from 'path';

dns.setDefaultResultOrder('ipv4first');
dns.setServers(['1.1.1.1', '8.8.8.8']);
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Auth routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.get('/api/auth/me', authenticateToken as any, getMe as any);

// User routes
app.get('/api/users/leaderboard', getLeaderboard as any);
app.get('/api/users/:id', authenticateToken as any, getUserProfile as any);
app.put('/api/users/profile', authenticateToken as any, updateProfile as any);

// Activity route
app.get('/api/activities', getActivities as any);

// Idea routes
app.get('/api/ideas', getAllIdeas as any);
app.get('/api/ideas/:id', getIdeaById as any);
app.post('/api/ideas', authenticateToken as any, createIdea as any);
app.post('/api/ideas/:id/join', authenticateToken as any, toggleJoinIdea as any);
app.post('/api/ideas/:id/pickup', authenticateToken as any, addPickupPoint as any);
app.delete('/api/ideas/:id/pickup/:pointId', authenticateToken as any, removePickupPoint as any);
app.delete('/api/ideas/:id', authenticateToken as any, deleteIdea as any);

// Upload routes
app.post('/api/ideas/:ideaId/gallery', authenticateToken as any, upload.single('image'), uploadGalleryImage as any);

// Notification routes
app.get('/api/notifications', authenticateToken as any, getNotifications as any);
app.put('/api/notifications/read-all', authenticateToken as any, markAllAsRead as any);
app.put('/api/notifications/:id/read', authenticateToken as any, markAsRead as any);

// Task routes
app.get('/api/ideas/:ideaId/tasks', authenticateToken as any, getTasksByIdea as any);
app.post('/api/ideas/:ideaId/tasks', authenticateToken as any, createTask as any);
app.put('/api/tasks/:taskId', authenticateToken as any, updateTask as any);
app.delete('/api/tasks/:taskId', authenticateToken as any, deleteTask as any);

// Status route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ColabMeet API is running smoothly' });
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/colabmeet';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  });
