"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteIdea = exports.toggleJoinIdea = exports.getIdeaById = exports.getAllIdeas = exports.createIdea = void 0;
const Idea_1 = require("../models/Idea");
const mongoose_1 = __importDefault(require("mongoose"));
const createIdea = async (req, res) => {
    try {
        const { title, description, locationName, lat, lng, category, eventDate } = req.body;
        if (!title || !description || !locationName || lat === undefined || lng === undefined || !eventDate) {
            return res.status(400).json({ message: 'Missing required fields for creating an idea' });
        }
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const newIdea = new Idea_1.Idea({
            title: title.trim(),
            description: description.trim(),
            locationName: locationName.trim(),
            location: {
                lat: Number(lat),
                lng: Number(lng),
            },
            owner: new mongoose_1.default.Types.ObjectId(req.user.id),
            ownerName: req.user.name,
            category: category ? category.trim() : 'General',
            eventDate: new Date(eventDate),
            participants: [new mongoose_1.default.Types.ObjectId(req.user.id)], // Creator automatically joins
        });
        await newIdea.save();
        res.status(201).json(newIdea);
    }
    catch (error) {
        console.error('Create idea error:', error);
        res.status(500).json({ message: 'Internal server error during idea creation' });
    }
};
exports.createIdea = createIdea;
const getAllIdeas = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = {};
        if (category) {
            filter.category = String(category);
        }
        const ideas = await Idea_1.Idea.find(filter).sort({ eventDate: 1 });
        res.json(ideas);
    }
    catch (error) {
        console.error('Get all ideas error:', error);
        res.status(500).json({ message: 'Internal server error fetching ideas' });
    }
};
exports.getAllIdeas = getAllIdeas;
const getIdeaById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid idea ID format' });
        }
        const idea = await Idea_1.Idea.findById(id).populate('participants', 'name email');
        if (!idea) {
            return res.status(404).json({ message: 'Idea not found' });
        }
        res.json(idea);
    }
    catch (error) {
        console.error('Get idea by ID error:', error);
        res.status(500).json({ message: 'Internal server error fetching idea details' });
    }
};
exports.getIdeaById = getIdeaById;
const toggleJoinIdea = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid idea ID format' });
        }
        const idea = await Idea_1.Idea.findById(id);
        if (!idea) {
            return res.status(404).json({ message: 'Idea not found' });
        }
        const userId = new mongoose_1.default.Types.ObjectId(req.user.id);
        const participantIndex = idea.participants.findIndex((pId) => pId.equals(userId));
        if (participantIndex > -1) {
            // User is already a participant, remove them (leave)
            // Note: If they are the owner, they can leave if they want, but let's allow it or prevent it.
            // Allowing leaving is fine, but they stay owner.
            idea.participants.splice(participantIndex, 1);
        }
        else {
            // Add user (join)
            idea.participants.push(userId);
        }
        await idea.save();
        const updatedIdea = await Idea_1.Idea.findById(id).populate('participants', 'name email');
        res.json(updatedIdea);
    }
    catch (error) {
        console.error('Toggle join idea error:', error);
        res.status(500).json({ message: 'Internal server error joining/leaving idea' });
    }
};
exports.toggleJoinIdea = toggleJoinIdea;
const deleteIdea = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid idea ID format' });
        }
        const idea = await Idea_1.Idea.findById(id);
        if (!idea) {
            return res.status(404).json({ message: 'Idea not found' });
        }
        if (idea.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to delete this idea' });
        }
        await Idea_1.Idea.deleteOne({ _id: id });
        res.json({ message: 'Idea deleted successfully' });
    }
    catch (error) {
        console.error('Delete idea error:', error);
        res.status(500).json({ message: 'Internal server error deleting idea' });
    }
};
exports.deleteIdea = deleteIdea;
