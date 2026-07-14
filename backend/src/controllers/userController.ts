import { Response } from 'express';
import { User } from '../models/User';
import { Idea } from '../models/Idea';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error fetching profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { bio, skills, githubLink } = req.body;
    
    // Process skills into an array if they are passed as a comma-separated string
    let skillsArray = skills;
    if (typeof skills === 'string') {
      skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        bio: bio?.trim(), 
        skills: skillsArray, 
        githubLink: githubLink?.trim() 
      },
      { new: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error updating profile' });
  }
};

export const getLeaderboard = async (req: any, res: Response) => {
  try {
    const users = await User.find().select('-passwordHash');
    
    const leaderboard = await Promise.all(users.map(async (user) => {
      const owned = await Idea.countDocuments({ owner: user._id });
      const participated = await Idea.countDocuments({ participants: user._id });
      
      return {
        _id: user._id,
        name: user.name,
        skills: user.skills,
        score: (owned * 10) + (participated * 5)
      };
    }));

    // Sort by score descending and take top 5
    leaderboard.sort((a, b) => b.score - a.score);
    
    res.json(leaderboard.slice(0, 5));
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
};
