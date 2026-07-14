"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const dns_1 = __importDefault(require("dns"));
const authController_1 = require("./controllers/authController");
const ideaController_1 = require("./controllers/ideaController");
const auth_1 = require("./middleware/auth");
dns_1.default.setDefaultResultOrder('ipv4first');
dns_1.default.setServers(['1.1.1.1', '8.8.8.8']);
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Auth routes
app.post('/api/auth/register', authController_1.register);
app.post('/api/auth/login', authController_1.login);
app.get('/api/auth/me', auth_1.authenticateToken, authController_1.getMe);
// Idea routes
app.get('/api/ideas', ideaController_1.getAllIdeas);
app.get('/api/ideas/:id', ideaController_1.getIdeaById);
app.post('/api/ideas', auth_1.authenticateToken, ideaController_1.createIdea);
app.post('/api/ideas/:id/join', auth_1.authenticateToken, ideaController_1.toggleJoinIdea);
app.delete('/api/ideas/:id', auth_1.authenticateToken, ideaController_1.deleteIdea);
// Status route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'ColabMeet API is running smoothly' });
});
// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/colabmeet';
mongoose_1.default
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
