"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authentication token missing or invalid' });
    }
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    jsonwebtoken_1.default.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token is invalid or expired' });
        }
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
        };
        next();
    });
};
exports.authenticateToken = authenticateToken;
