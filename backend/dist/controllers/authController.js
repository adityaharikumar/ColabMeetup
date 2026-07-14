"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const generateToken = (userId, email, name) => {
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    return jsonwebtoken_1.default.sign({ id: userId, email, name }, secret, { expiresIn: '7d' });
};
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }
        const emailNormalized = email.toLowerCase().trim();
        const existingUser = await User_1.User.findOne({ email: emailNormalized });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const newUser = new User_1.User({
            name: name.trim(),
            email: emailNormalized,
            passwordHash,
        });
        await newUser.save();
        const token = generateToken(newUser._id.toString(), newUser.email, newUser.name);
        res.status(201).json({
            token,
            user: {
                id: newUser._id.toString(),
                name: newUser.name,
                email: newUser.email,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error during registration' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }
        const emailNormalized = email.toLowerCase().trim();
        const user = await User_1.User.findOne({ email: emailNormalized });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = generateToken(user._id.toString(), user.email, user.name);
        res.json({
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error during login' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = await User_1.User.findById(req.user.id).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Internal server error fetching user profile' });
    }
};
exports.getMe = getMe;
