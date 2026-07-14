"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Idea = void 0;
const mongoose_1 = require("mongoose");
const IdeaSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    locationName: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String, required: true },
    category: { type: String, required: true, default: 'General' },
    participants: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
    eventDate: { type: Date, required: true },
}, {
    timestamps: true,
});
exports.Idea = (0, mongoose_1.model)('Idea', IdeaSchema);
