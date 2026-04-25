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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayUpdatesByUserAndDate = exports.getTodayUpdatesByDate = exports.unlikeReply = exports.likeReply = exports.createReply = exports.unlikeTodayUpdate = exports.likeTodayUpdate = exports.deleteTodayUpdate = exports.updateTodayUpdate = exports.getTodayUpdateById = exports.getUserTodayUpdates = exports.getTodayUpdates = exports.createTodayUpdate = void 0;
const client_1 = require("@prisma/client");
const index_1 = require("../index");
const prisma = new client_1.PrismaClient();
const createTodayUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        const userId = req.userId;
        if (!content) {
            res.status(400).json({ message: "Content is required" });
            return;
        }
        const newUpdate = yield prisma.todayUpdate.create({
            data: {
                content,
                userId: Number(userId)
            },
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                        email: true,
                        updatedAt: true,
                        lastSeenAt: true
                    }
                }
            }
        });
        //  if (newUpdate.user) {
        //   try {
        //     await sendTodayUpdateNotification(
        //       newUpdate.user.username,
        //       content,
        //       newUpdate.user.email,
        //            newUpdate.user.userId 
        //     );
        //   } catch (emailError) {
        //     console.error('Failed to send today update notification:', emailError);
        //   }
        // }
        index_1.io.emit("todayUpdate:created", {
            update: newUpdate,
            message: `${newUpdate.user.firstname} ${newUpdate.user.lastname} posted a new update`
        });
        res.status(201).json(newUpdate);
    }
    catch (error) {
        console.error("Error creating today's update:", error);
        res.status(500).json({ message: `Error creating today's update: ${error.message}` });
    }
});
exports.createTodayUpdate = createTodayUpdate;
const getTodayUpdates = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { date } = req.query; // Add date query parameter
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { role: true }
        });
        if (!["ADMIN", "DESIGNER", "DEVELOPER"].includes((user === null || user === void 0 ? void 0 : user.role) || "")) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        // Build where clause for date filtering
        let whereClause = {};
        if (date && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            whereClause.createdAt = {
                gte: startOfDay,
                lte: endOfDay
            };
        }
        const updates = yield prisma.todayUpdate.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                        updatedAt: true,
                        lastSeenAt: true
                    }
                },
                Like: {
                    select: {
                        id: true,
                        userId: true,
                        createdAt: true,
                        user: {
                            select: {
                                userId: true,
                                username: true,
                                firstname: true,
                                lastname: true,
                                profilePictureUrl: true,
                                updatedAt: true,
                                lastSeenAt: true
                            }
                        }
                    }
                },
                Reply: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                username: true,
                                firstname: true,
                                lastname: true,
                                profilePictureUrl: true,
                                updatedAt: true,
                                lastSeenAt: true
                            }
                        },
                        likes: {
                            include: {
                                user: {
                                    select: {
                                        userId: true,
                                        username: true,
                                        firstname: true,
                                        lastname: true,
                                        profilePictureUrl: true,
                                        updatedAt: true,
                                        lastSeenAt: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: "asc" }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        const transformedUpdates = updates.map(update => (Object.assign(Object.assign({}, update), { likes: update.Like, replies: update.Reply })));
        res.json(transformedUpdates);
    }
    catch (error) {
        console.error("Error retrieving today's updates:", error);
        res.status(500).json({ message: `Error retrieving today's updates: ${error.message}` });
    }
});
exports.getTodayUpdates = getTodayUpdates;
const getUserTodayUpdates = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { date } = req.query; // Add date query parameter
        // Build where clause for date filtering
        let whereClause = { userId: Number(userId) };
        if (date && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            whereClause.createdAt = {
                gte: startOfDay,
                lte: endOfDay
            };
        }
        const updates = yield prisma.todayUpdate.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                        updatedAt: true,
                        lastSeenAt: true
                    }
                },
                Like: {
                    select: {
                        id: true,
                        userId: true,
                        createdAt: true,
                        user: {
                            select: {
                                userId: true,
                                username: true,
                                firstname: true,
                                lastname: true,
                                profilePictureUrl: true,
                                updatedAt: true,
                                lastSeenAt: true
                            }
                        }
                    }
                },
                Reply: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                username: true,
                                firstname: true,
                                lastname: true,
                                profilePictureUrl: true,
                                updatedAt: true,
                                lastSeenAt: true
                            }
                        },
                        likes: {
                            include: {
                                user: {
                                    select: {
                                        userId: true,
                                        username: true,
                                        firstname: true,
                                        lastname: true,
                                        profilePictureUrl: true,
                                        updatedAt: true,
                                        lastSeenAt: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: "asc" }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        const transformedUpdates = updates.map(update => (Object.assign(Object.assign({}, update), { likes: update.Like, replies: update.Reply })));
        res.json(transformedUpdates);
    }
    catch (error) {
        console.error("Error retrieving user's today updates:", error);
        res.status(500).json({ message: `Error retrieving user's today updates: ${error.message}` });
    }
});
exports.getUserTodayUpdates = getUserTodayUpdates;
const getTodayUpdateById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const update = yield prisma.todayUpdate.findUnique({
            where: { id: Number(id) },
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                        updatedAt: true,
                        lastSeenAt: true
                    }
                }
            }
        });
        if (!update) {
            res.status(404).json({ message: "Update not found" });
            return;
        }
        // Check if user can access the update
        if (update.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        res.json(update);
    }
    catch (error) {
        console.error("Error retrieving today's update:", error);
        res.status(500).json({ message: `Error retrieving today's update: ${error.message}` });
    }
});
exports.getTodayUpdateById = getTodayUpdateById;
const updateTodayUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.userId;
        const existingUpdate = yield prisma.todayUpdate.findUnique({
            where: { id: Number(id) },
            include: { user: true }
        });
        if (!existingUpdate) {
            res.status(404).json({ message: "Update not found" });
            return;
        }
        if (existingUpdate.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        const updatedUpdate = yield prisma.todayUpdate.update({
            where: { id: Number(id) },
            data: { content },
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                        updatedAt: true,
                        lastSeenAt: true
                    }
                }
            }
        });
        // Emit real-time event for update edit
        index_1.io.emit("todayUpdate:updated", {
            update: updatedUpdate,
            oldContent: existingUpdate.content,
            message: `${updatedUpdate.user.firstname} ${updatedUpdate.user.lastname} updated their post`
        });
        res.json(updatedUpdate);
    }
    catch (error) {
        console.error("Error updating today's update:", error);
        res.status(500).json({ message: `Error updating today's update: ${error.message}` });
    }
});
exports.updateTodayUpdate = updateTodayUpdate;
const deleteTodayUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const existingUpdate = yield prisma.todayUpdate.findUnique({
            where: { id: Number(id) },
            include: { user: true }
        });
        if (!existingUpdate) {
            res.status(404).json({ message: "Update not found" });
            return;
        }
        if (existingUpdate.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        yield prisma.todayUpdate.delete({
            where: { id: Number(id) }
        });
        // Emit real-time event for update deletion
        index_1.io.emit("todayUpdate:deleted", {
            updateId: Number(id),
            userId: existingUpdate.userId,
            userName: `${existingUpdate.user.firstname} ${existingUpdate.user.lastname}`,
            message: `An update was deleted`
        });
        res.json({ message: "Update deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting today's update:", error);
        res.status(500).json({ message: `Error deleting today's update: ${error.message}` });
    }
});
exports.deleteTodayUpdate = deleteTodayUpdate;
const likeTodayUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const update = yield prisma.todayUpdate.findUnique({
            where: { id: Number(id) },
            include: { user: true }
        });
        if (!update) {
            res.status(404).json({ message: "Update not found" });
            return;
        }
        const existingLike = yield prisma.like.findFirst({
            where: {
                userId: Number(userId),
                updateId: Number(id)
            }
        });
        if (existingLike) {
            res.status(400).json({ message: "You already liked this update" });
            return;
        }
        const like = yield prisma.like.create({
            data: {
                userId: Number(userId),
                updateId: Number(id)
            },
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                        updatedAt: true,
                        lastSeenAt: true
                    }
                }
            }
        });
        // Emit real-time event for like
        index_1.io.emit("todayUpdate:liked", {
            updateId: Number(id),
            like: like,
            likeCount: yield prisma.like.count({ where: { updateId: Number(id) } }),
            message: `${like.user.firstname} ${like.user.lastname} liked an update`
        });
        res.json(like);
    }
    catch (error) {
        console.error("Error liking update:", error);
        res.status(500).json({ message: `Error liking update: ${error.message}` });
    }
});
exports.likeTodayUpdate = likeTodayUpdate;
const unlikeTodayUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const existingLike = yield prisma.like.findFirst({
            where: {
                userId: Number(userId),
                updateId: Number(id)
            },
            include: {
                user: true
            }
        });
        if (!existingLike) {
            res.status(404).json({ message: "Like not found" });
            return;
        }
        yield prisma.like.delete({
            where: { id: existingLike.id }
        });
        // Emit real-time event for unlike
        index_1.io.emit("todayUpdate:unliked", {
            updateId: Number(id),
            userId: Number(userId),
            likeCount: yield prisma.like.count({ where: { updateId: Number(id) } }),
            message: `A like was removed`
        });
        res.json({ message: "Unliked successfully" });
    }
    catch (error) {
        console.error("Error unliking update:", error);
        res.status(500).json({ message: `Error unliking update: ${error.message}` });
    }
});
exports.unlikeTodayUpdate = unlikeTodayUpdate;
const createReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.userId;
        if (!content) {
            res.status(400).json({ message: "Content is required" });
            return;
        }
        const update = yield prisma.todayUpdate.findUnique({
            where: { id: Number(id) },
            include: { user: true }
        });
        if (!update) {
            res.status(404).json({ message: "Update not found" });
            return;
        }
        const reply = yield prisma.reply.create({
            data: {
                content,
                userId: Number(userId),
                updateId: Number(id)
            },
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                        updatedAt: true,
                        lastSeenAt: true
                    }
                }
            }
        });
        // Emit real-time event for reply
        index_1.io.emit("todayUpdate:replied", {
            updateId: Number(id),
            reply: reply,
            message: `${reply.user.firstname} ${reply.user.lastname} replied to an update`
        });
        res.status(201).json(reply);
    }
    catch (error) {
        console.error("Error creating reply:", error);
        res.status(500).json({ message: `Error creating reply: ${error.message}` });
    }
});
exports.createReply = createReply;
const likeReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const reply = yield prisma.reply.findUnique({
            where: { id: Number(id) },
            include: { user: true }
        });
        if (!reply) {
            res.status(404).json({ message: "Reply not found" });
            return;
        }
        const existingLike = yield prisma.likeOnReply.findFirst({
            where: {
                userId: Number(userId),
                replyId: Number(id)
            }
        });
        if (existingLike) {
            res.status(400).json({ message: "You already liked this reply" });
            return;
        }
        const like = yield prisma.likeOnReply.create({
            data: {
                userId: Number(userId),
                replyId: Number(id)
            },
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                        updatedAt: true,
                        lastSeenAt: true
                    }
                }
            }
        });
        // Emit real-time event for reply like
        index_1.io.emit("todayUpdate:replyLiked", {
            replyId: Number(id),
            like: like,
            likeCount: yield prisma.likeOnReply.count({ where: { replyId: Number(id) } }),
            message: `${like.user.firstname} ${like.user.lastname} liked a reply`
        });
        res.json(like);
    }
    catch (error) {
        console.error("Error liking reply:", error);
        res.status(500).json({ message: `Error liking reply: ${error.message}` });
    }
});
exports.likeReply = likeReply;
const unlikeReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const existingLike = yield prisma.likeOnReply.findFirst({
            where: {
                userId: Number(userId),
                replyId: Number(id)
            },
            include: {
                user: true
            }
        });
        if (!existingLike) {
            res.status(404).json({ message: "Like not found" });
            return;
        }
        yield prisma.likeOnReply.delete({
            where: { id: existingLike.id }
        });
        // Emit real-time event for reply unlike
        index_1.io.emit("todayUpdate:replyUnliked", {
            replyId: Number(id),
            userId: Number(userId),
            likeCount: yield prisma.likeOnReply.count({ where: { replyId: Number(id) } }),
            message: `A reply like was removed`
        });
        res.json({ message: "Unliked successfully" });
    }
    catch (error) {
        console.error("Error unliking reply:", error);
        res.status(500).json({ message: `Error unliking reply: ${error.message}` });
    }
});
exports.unlikeReply = unlikeReply;
// Add these new functions to your todayUpdateController.ts
const getTodayUpdatesByDate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { date } = req.params;
        const userId = req.userId;
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
            return;
        }
        // Parse the date and create start/end of day
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        const updates = yield prisma.todayUpdate.findMany({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                        updatedAt: true,
                        lastSeenAt: true
                    }
                },
                Like: {
                    select: {
                        id: true,
                        userId: true,
                        createdAt: true,
                        user: {
                            select: {
                                userId: true,
                                username: true,
                                firstname: true,
                                lastname: true,
                                profilePictureUrl: true,
                                updatedAt: true,
                                lastSeenAt: true
                            }
                        }
                    }
                },
                Reply: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                username: true,
                                firstname: true,
                                lastname: true,
                                profilePictureUrl: true,
                                updatedAt: true,
                                lastSeenAt: true
                            }
                        },
                        likes: {
                            include: {
                                user: {
                                    select: {
                                        userId: true,
                                        username: true,
                                        firstname: true,
                                        lastname: true,
                                        profilePictureUrl: true,
                                        updatedAt: true,
                                        lastSeenAt: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: "asc" }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        // Transform the response
        const transformedUpdates = updates.map(update => (Object.assign(Object.assign({}, update), { likes: update.Like, replies: update.Reply })));
        res.json(transformedUpdates);
    }
    catch (error) {
        console.error("Error retrieving updates by date:", error);
        res.status(500).json({ message: `Error retrieving updates by date: ${error.message}` });
    }
});
exports.getTodayUpdatesByDate = getTodayUpdatesByDate;
const getTodayUpdatesByUserAndDate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId: targetUserId, date } = req.params;
        const currentUserId = req.userId;
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD" });
            return;
        }
        // Parse the date and create start/end of day
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        const updates = yield prisma.todayUpdate.findMany({
            where: {
                userId: Number(targetUserId),
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        firstname: true,
                        lastname: true,
                        profilePictureUrl: true,
                        updatedAt: true,
                        lastSeenAt: true
                    }
                },
                Like: {
                    select: {
                        id: true,
                        userId: true,
                        createdAt: true,
                        user: {
                            select: {
                                userId: true,
                                username: true,
                                firstname: true,
                                lastname: true,
                                profilePictureUrl: true,
                                updatedAt: true,
                                lastSeenAt: true
                            }
                        }
                    }
                },
                Reply: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                username: true,
                                firstname: true,
                                lastname: true,
                                profilePictureUrl: true,
                                updatedAt: true,
                                lastSeenAt: true
                            }
                        },
                        likes: {
                            include: {
                                user: {
                                    select: {
                                        userId: true,
                                        username: true,
                                        firstname: true,
                                        lastname: true,
                                        profilePictureUrl: true,
                                        updatedAt: true,
                                        lastSeenAt: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { createdAt: "asc" }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        // Transform the response
        const transformedUpdates = updates.map(update => (Object.assign(Object.assign({}, update), { likes: update.Like, replies: update.Reply })));
        res.json(transformedUpdates);
    }
    catch (error) {
        console.error("Error retrieving user updates by date:", error);
        res.status(500).json({ message: `Error retrieving user updates by date: ${error.message}` });
    }
});
exports.getTodayUpdatesByUserAndDate = getTodayUpdatesByUserAndDate;
