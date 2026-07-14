import { Response } from 'express';
import { Activity } from '../models/Activity';

export const getActivities = async (req: any, res: Response) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching activities' });
  }
};
