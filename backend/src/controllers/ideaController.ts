import { Response } from 'express';
import { Idea } from '../models/Idea';
import { Notification } from '../models/Notification';
import { Activity } from '../models/Activity';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

export const createIdea = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, locationName, lat, lng, category, eventDate, maxParticipants } = req.body;

    if (!title || !description || !locationName || lat === undefined || lng === undefined || !eventDate) {
      return res.status(400).json({ message: 'Missing required fields for creating an idea' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const newIdea = new Idea({
      title: title.trim(),
      description: description.trim(),
      locationName: locationName.trim(),
      location: {
        lat: Number(lat),
        lng: Number(lng),
      },
      owner: new mongoose.Types.ObjectId(req.user.id),
      ownerName: req.user.name,
      category: category ? category.trim() : 'General',
      eventDate: new Date(eventDate),
      maxParticipants: maxParticipants ? Number(maxParticipants) : 10,
      participants: [new mongoose.Types.ObjectId(req.user.id)], // Creator automatically joins
      waitlist: [],
    });

    await newIdea.save();
    
    await Activity.create({
      user: req.user.name,
      userId: req.user.id,
      action: 'proposed',
      target: newIdea.title,
      targetId: newIdea._id
    });
    
    res.status(201).json(newIdea);
  } catch (error: any) {
    console.error('Create idea error:', error);
    res.status(500).json({ message: 'Internal server error during idea creation' });
  }
};

export const getAllIdeas = async (req: AuthRequest, res: Response) => {
  try {
    const { category, lat, lng, radius } = req.query;
    const filter: any = {};
    if (category) {
      filter.category = String(category);
    }

    let ideas = await Idea.find(filter).sort({ eventDate: 1 });

    // Handle Proximity Search (Haversine formula)
    if (lat && lng && radius) {
      const userLat = Number(lat);
      const userLng = Number(lng);
      const searchRadius = Number(radius); // in miles

      ideas = ideas.filter(idea => {
        const R = 3958.8; // Radius of the Earth in miles
        const dLat = (idea.location.lat - userLat) * (Math.PI / 180);
        const dLng = (idea.location.lng - userLng) * (Math.PI / 180);
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(userLat * (Math.PI / 180)) * Math.cos(idea.location.lat * (Math.PI / 180)) * 
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        return distance <= searchRadius;
      });
    }

    res.json(ideas);
  } catch (error: any) {
    console.error('Get all ideas error:', error);
    res.status(500).json({ message: 'Internal server error fetching ideas' });
  }
};

export const getIdeaById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid idea ID format' });
    }

    const idea = await Idea.findById(id)
      .populate('participants', 'name email')
      .populate('waitlist', 'name email');
    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    res.json(idea);
  } catch (error: any) {
    console.error('Get idea by ID error:', error);
    res.status(500).json({ message: 'Internal server error fetching idea details' });
  }
};

export const toggleJoinIdea = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid idea ID format' });
    }

    const idea = await Idea.findById(id);
    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const participantIndex = idea.participants.findIndex((pId) => pId.equals(userId));
    const waitlistIndex = idea.waitlist.findIndex((pId) => pId.equals(userId));

    if (participantIndex > -1) {
      // User is a participant, leave
      idea.participants.splice(participantIndex, 1);
      
      // If someone leaves and there is a waitlist, promote the first person from waitlist
      if (idea.waitlist.length > 0) {
        const promotedUser = idea.waitlist.shift(); // Remove first from waitlist
        if (promotedUser) {
          idea.participants.push(promotedUser);
        }
      }
    } else if (waitlistIndex > -1) {
      // User is on the waitlist, leave waitlist
      idea.waitlist.splice(waitlistIndex, 1);
    } else {
      // Join
      if (idea.participants.length < idea.maxParticipants) {
        idea.participants.push(userId);
        
        // Notify owner if someone else joins
        if (idea.owner.toString() !== req.user.id) {
          await Notification.create({
            recipient: idea.owner,
            senderName: req.user.name,
            ideaId: idea._id,
            type: 'joined_idea',
            message: `${req.user.name} joined your project "${idea.title}"`,
          });
        }
        
        await Activity.create({
          user: req.user.name,
          userId: req.user.id,
          action: 'joined',
          target: idea.title,
          targetId: idea._id
        });
      } else {
        idea.waitlist.push(userId); // Event full, add to waitlist
        
        // Notify owner about waitlist
        if (idea.owner.toString() !== req.user.id) {
          await Notification.create({
            recipient: idea.owner,
            senderName: req.user.name,
            ideaId: idea._id,
            type: 'waitlist_join',
            message: `${req.user.name} joined the waitlist for "${idea.title}"`,
          });
        }
      }
    }

    await idea.save();
    const updatedIdea = await Idea.findById(id)
      .populate('participants', 'name email')
      .populate('waitlist', 'name email');
    res.json(updatedIdea);
  } catch (error: any) {
    console.error('Toggle join idea error:', error);
    res.status(500).json({ message: 'Internal server error joining/leaving idea' });
  }
};

export const deleteIdea = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid idea ID format' });
    }

    const idea = await Idea.findById(id);
    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    if (idea.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this idea' });
    }

    await Idea.deleteOne({ _id: id });
    res.json({ message: 'Idea deleted successfully' });
  } catch (error: any) {
    console.error('Delete idea error:', error);
    res.status(500).json({ message: 'Internal server error deleting idea' });
  }
};

export const addPickupPoint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { lat, lng, name } = req.body;

    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!lat || !lng || !name) return res.status(400).json({ message: 'Missing pickup point data' });

    const idea = await Idea.findById(id);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });

    // Only allow owner or participants to add pickup points
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const isParticipant = idea.participants.some(p => p.equals(userId));
    if (idea.owner.toString() !== req.user.id && !isParticipant) {
      return res.status(403).json({ message: 'Only participants can add pickup points' });
    }

    idea.pickupPoints.push({
      lat: Number(lat),
      lng: Number(lng),
      name,
      addedBy: userId,
    });

    await idea.save();
    
    // Notify owner
    if (idea.owner.toString() !== req.user.id) {
      await Notification.create({
        recipient: idea.owner,
        senderName: req.user.name,
        ideaId: idea._id,
        type: 'pickup_added',
        message: `${req.user.name} added a pickup point: ${name}`,
      });
    }
    
    const updatedIdea = await Idea.findById(id)
      .populate('participants', 'name email')
      .populate('waitlist', 'name email');
    res.json(updatedIdea);
  } catch (error) {
    console.error('Add pickup point error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removePickupPoint = async (req: AuthRequest, res: Response) => {
  try {
    const { id, pointId } = req.params;
    
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const idea = await Idea.findById(id);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });

    // Ensure the user trying to remove is the owner or the one who added it
    const point = idea.pickupPoints.find((p: any) => p._id.toString() === pointId);
    if (!point) return res.status(404).json({ message: 'Pickup point not found' });

    if (idea.owner.toString() !== req.user.id && point.addedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to remove this pickup point' });
    }

    idea.pickupPoints = idea.pickupPoints.filter((p: any) => p._id.toString() !== pointId);
    await idea.save();

    const updatedIdea = await Idea.findById(id)
      .populate('participants', 'name email')
      .populate('waitlist', 'name email');
    res.json(updatedIdea);
  } catch (error) {
    console.error('Remove pickup point error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
