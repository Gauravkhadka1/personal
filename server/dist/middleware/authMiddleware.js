"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.authenticateToken = exports.checkTokenBlacklist = exports.addToBlacklist = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Simple in-memory token blacklist (for production, use Redis or database)
const tokenBlacklist = new Set();
// Token blacklist functions
const addToBlacklist = (token) => {
    // Add token to blacklist with expiration time (extract from token)
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (decoded && decoded.exp) {
            const expiresIn = decoded.exp * 1000 - Date.now();
            if (expiresIn > 0) {
                tokenBlacklist.add(token);
                // Auto-remove expired tokens
                setTimeout(() => tokenBlacklist.delete(token), expiresIn);
            }
        }
    }
    catch (error) {
        console.error("Error adding token to blacklist:", error);
    }
};
exports.addToBlacklist = addToBlacklist;
const checkTokenBlacklist = (token) => {
    return tokenBlacklist.has(token);
};
exports.checkTokenBlacklist = checkTokenBlacklist;
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }
        // Check if token is blacklisted FIRST (before verification)
        const isBlacklisted = (0, exports.checkTokenBlacklist)(token);
        if (isBlacklisted) {
            res.status(403).json({ message: "Token revoked" });
            return;
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Check if user still exists and is active
        const user = yield prisma.user.findUnique({
            where: { userId: decoded.userId },
            select: {
                userId: true,
                role: true // ← ADD THIS
            }
        });
        req.userId = decoded.userId;
        req.user = user; // ← ADD THIS
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ message: "Token expired" });
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(403).json({ message: "Invalid token" });
        }
        else {
            res.status(500).json({ message: "Authentication error" });
        }
    }
});
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }
        if (user.role !== 'ADMIN') {
            res.status(403).json({ message: "Admin access required" });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({ message: "Authorization error" });
    }
};
exports.requireAdmin = requireAdmin;
