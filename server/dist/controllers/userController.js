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
exports.updateLastSeen = exports.getUserComments = exports.getUserActivityLogs = exports.uploadProfilePicture = exports.getCurrentUser = exports.changePassword = exports.updateUserRole = exports.deleteUser = exports.getUserByEmail = exports.getUsers = exports.loginUser = exports.createUser = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validator_1 = __importDefault(require("validator"));
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const prisma = new client_1.PrismaClient();
// Rate limiter for login attempts
const loginRateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    points: 5, // 5 attempts
    duration: 15 * 60, // 15 minutes
});
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstname, lastname, username, phone, email, role, profilePictureUrl, password, clientId } = req.body;
        if (!validator_1.default.isEmail(email)) {
            res.status(400).json({ message: "Invalid email format" });
            return;
        }
        if (password.length < 8) {
            res.status(400).json({ message: "Password must be at least 8 characters" });
            return;
        }
        // Check password complexity
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
            res.status(400).json({
                message: "Password must contain uppercase, lowercase, number, and special character"
            });
            return;
        }
        if (!firstname || !lastname || !username || !phone || !email || !role || !password) {
            res.status(400).json({ message: "All fields are required" });
            return;
        }
        if (!["DESIGNER", "DEVELOPER", "INTERN", "CLIENT"].includes(role)) {
            res.status(400).json({ message: "Invalid role" });
            return;
        }
        if (role && role === 'ADMIN') {
            res.status(403).json({ message: "Cannot assign ADMIN role during user creation" });
            return;
        }
        if (role !== "CLIENT" && clientId) {
            res.status(400).json({ message: "clientId can only be assigned to CLIENT role users" });
            return;
        }
        // Check if client exists if clientId is provided
        if (clientId) {
            const client = yield prisma.client.findUnique({
                where: { id: clientId }
            });
            if (!client) {
                res.status(400).json({ message: "Client not found" });
                return;
            }
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield prisma.user.create({
            data: {
                firstname,
                lastname,
                username,
                phone,
                email,
                profilePictureUrl: profilePictureUrl || "",
                role,
                password: hashedPassword,
                clientId: role === "CLIENT" ? clientId : null,
            },
            include: {
                client: {
                    select: {
                        companyName: true,
                        domainName: true
                    }
                }
            }
        });
        res.status(201).json({
            message: "User created successfully",
            user: {
                userId: newUser.userId,
                firstname: newUser.firstname,
                lastname: newUser.lastname,
                username: newUser.username,
                phone: newUser.phone,
                email: newUser.email,
                profilePictureUrl: newUser.profilePictureUrl,
                role: newUser.role,
                clientId: newUser.clientId,
                client: newUser.client,
                createdAt: newUser.createdAt,
                updatedAt: newUser.updatedAt
            }
        });
    }
    catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: `Error creating user: ${error.message}` });
    }
});
exports.createUser = createUser;
/**
 * Login user
 */
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Rate limiting
        try {
            const key = (req.ip || 'unknown') + req.body.email;
            yield loginRateLimiter.consume(key);
        }
        catch (rateLimiterRes) {
            res.status(429).json({
                message: "Too many login attempts. Try again later."
            });
            return;
        }
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }
        // Check if user exists
        const user = yield prisma.user.findUnique({
            where: { email },
            select: { userId: true, email: true, password: true, username: true, profilePictureUrl: true, role: true },
        });
        if (!user) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        // Compare passwords
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        // Add failed login attempt tracking to user model
        if (!isMatch) {
            yield prisma.user.update({
                where: { email },
                data: { failedLoginAttempts: { increment: 1 } }
            });
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        // Reset failed attempts on successful login
        yield prisma.user.update({
            where: { email },
            data: { failedLoginAttempts: 0, lastLogin: new Date() }
        });
        // Generate JWT Token
        const token = jsonwebtoken_1.default.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.json({
            message: "Login successful",
            token,
            user: { id: user.userId, email: user.email, username: user.username, role: user.role }
        });
    }
    catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: `Error logging in: ${error.message}` });
    }
});
exports.loginUser = loginUser;
/**
 * Get all users
 */
const getUsers = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany({
            select: {
                userId: true,
                firstname: true,
                lastname: true,
                username: true,
                phone: true,
                email: true,
                profilePictureUrl: true,
                role: true,
                birthday: true,
                joinedAt: true,
                KnowledgeSharing: true,
                createdAt: true,
                updatedAt: true,
                lastSeenAt: true,
                clientId: true,
                client: {
                    select: {
                        companyName: true,
                        domainName: true
                    }
                }
            },
        });
        const usersWithPresence = users.map(user => (Object.assign(Object.assign({}, user), { isOnline: user.lastSeenAt
                ? new Date().getTime() - new Date(user.lastSeenAt).getTime() < 5 * 60 * 1000 // 5 minutes threshold
                : false })));
        res.json(users);
    }
    catch (error) {
        console.error("Error retrieving users:", error);
        res.status(500).json({ message: `Error retrieving users: ${error.message}` });
    }
});
exports.getUsers = getUsers;
/**
 * Get a user by email
 */
const getUserByEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.params;
        const user = yield prisma.user.findUnique({
            where: { email },
            select: { userId: true, username: true, email: true, profilePictureUrl: true, role: true,
                clientId: true,
                client: {
                    select: {
                        companyName: true,
                        domainName: true
                    }
                }
            },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.error("Error retrieving user:", error);
        res.status(500).json({ message: `Error retrieving user: ${error.message}` });
    }
});
exports.getUserByEmail = getUserByEmail;
/**
 * Delete a user by email
 */
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.params;
        const deletedUser = yield prisma.user.delete({
            where: { email },
        });
        res.json({ message: "User deleted successfully", user: deletedUser });
    }
    catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: `Error deleting user: ${error.message}` });
    }
});
exports.deleteUser = deleteUser;
const updateUserRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        if (!["ADMIN", "DESIGNER", "DEVELOPER", "INTERN"].includes(role)) {
            res.status(400).json({ message: "Invalid role" });
            return;
        }
        const updatedUser = yield prisma.user.update({
            where: { userId: Number(userId) },
            data: { role },
        });
        res.json({ message: "User role updated successfully", user: updatedUser });
    }
    catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: `Error updating user role: ${error.message}` });
    }
});
exports.updateUserRole = updateUserRole;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { currentPassword, newPassword } = req.body;
        // Validate input
        if (!currentPassword || !newPassword) {
            res.status(400).json({ message: "Current password and new password are required" });
            return;
        }
        // Find the user
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Ensure the user has a password
        if (!user.password) {
            res.status(401).json({ message: "User does not have a password set" });
            return;
        }
        // Verify the current password
        const isMatch = yield bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(401).json({ message: "Current password is incorrect" });
            return;
        }
        // Hash the new password
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, 10);
        // Update the user's password
        yield prisma.user.update({
            where: { userId: Number(userId) },
            data: { password: hashedPassword },
        });
        res.status(200).json({ message: "Password changed successfully" });
    }
    catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: `Error changing password: ${error.message}` });
    }
});
exports.changePassword = changePassword;
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // The userId is set by the auth middleware
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: {
                userId: true,
                username: true,
                email: true,
                profilePictureUrl: true,
                role: true
            },
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.error("Error retrieving current user:", error);
        res.status(500).json({ message: `Error retrieving current user: ${error.message}` });
    }
});
exports.getCurrentUser = getCurrentUser;
// server\src\controllers\userController.ts
// server\src\controllers\userController.ts
const uploadProfilePicture = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!req.file) {
            res.status(400).json({ message: "No file uploaded" });
            return;
        }
        // The file has already been saved to disk by multer
        const profilePictureUrl = `/uploads/${req.file.filename}`;
        // Update user's profile picture in database
        const updatedUser = yield prisma.user.update({
            where: { userId: Number(userId) },
            data: { profilePictureUrl },
            select: {
                userId: true,
                firstname: true,
                lastname: true,
                username: true,
                phone: true,
                email: true,
                profilePictureUrl: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.status(200).json({
            message: "Profile picture uploaded successfully",
            profilePictureUrl,
            user: updatedUser
        });
    }
    catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ message: `Error uploading profile picture: ${error.message}` });
    }
});
exports.uploadProfilePicture = uploadProfilePicture;
// In your userController.ts
const getUserActivityLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const activities = yield prisma.activityLog.findMany({
            where: { userId: Number(userId) },
            orderBy: { timestamp: "desc" },
            include: { user: true },
        });
        res.json(activities);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving activities: ${error.message}` });
    }
});
exports.getUserActivityLogs = getUserActivityLogs;
const getUserComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        const comments = yield prisma.comment.findMany({
            where: { userId: Number(userId) },
            orderBy: { createdAt: "desc" },
            include: { user: true, task: true },
        });
        res.json(comments);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving comments: ${error.message}` });
    }
});
exports.getUserComments = getUserComments;
// server/src/controllers/userController.ts
// Add these new endpoints:
const updateLastSeen = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        yield prisma.user.update({
            where: { userId: Number(userId) },
            data: { lastSeenAt: new Date() }
        });
        res.status(200).json({ message: "Last seen updated" });
    }
    catch (error) {
        res.status(500).json({ message: `Error updating last seen: ${error.message}` });
    }
});
exports.updateLastSeen = updateLastSeen;
