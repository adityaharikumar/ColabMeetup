import { Response } from 'express';
import { Task } from '../models/Task';
import { Idea } from '../models/Idea';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

export const getTasksByIdea = async (req: AuthRequest, res: Response) => {
  try {
    const { ideaId } = req.params;
    const tasks = await Task.find({ ideaId }).populate('assignee', 'name email');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { ideaId } = req.params;
    const { title, assigneeId } = req.body;
    
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const idea = await Idea.findById(ideaId);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });

    // Must be participant or owner to create tasks
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const isParticipant = idea.participants.some(p => p.equals(userId));
    if (idea.owner.toString() !== req.user.id && !isParticipant) {
      return res.status(403).json({ message: 'Only participants can add tasks' });
    }

    const newTask = new Task({
      ideaId,
      title,
      assignee: assigneeId ? new mongoose.Types.ObjectId(assigneeId) : undefined
    });

    await newTask.save();
    const populated = await newTask.populate('assignee', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status, assigneeId } = req.body;

    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const idea = await Idea.findById(task.ideaId);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const isParticipant = idea.participants.some(p => p.equals(userId));
    if (idea.owner.toString() !== req.user.id && !isParticipant) {
      return res.status(403).json({ message: 'Only participants can update tasks' });
    }

    if (status) task.status = status;
    
    let newlyAssignedTo = null;
    if (assigneeId !== undefined) {
      if (assigneeId && assigneeId !== task.assignee?.toString()) {
        newlyAssignedTo = assigneeId;
      }
      task.assignee = assigneeId ? new mongoose.Types.ObjectId(assigneeId) : undefined;
    }

    await task.save();
    const populated = await task.populate('assignee', 'name email');
    
    if (newlyAssignedTo && newlyAssignedTo !== req.user.id) {
      await Notification.create({
        recipient: newlyAssignedTo,
        senderName: req.user.name,
        ideaId: idea._id,
        type: 'task_assigned',
        message: `${req.user.name} assigned you a task: "${task.title}"`,
      });
    }

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await Task.deleteOne({ _id: taskId });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting task' });
  }
};
