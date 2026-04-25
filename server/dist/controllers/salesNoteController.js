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
exports.unlikeSalesNoteReply = exports.likeSalesNoteReply = exports.createSalesNoteReply = exports.unlikeSalesNote = exports.likeSalesNote = exports.deleteSalesNote = exports.updateSalesNote = exports.getSalesNotes = exports.createSalesNote = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createSalesNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, content } = req.body;
        const userId = req.userId;
        if (!title || !content) {
            res.status(400).json({ message: "Title and content are required" });
            return;
        }
        const newNote = yield prisma.salesNote.create({
            data: {
                title,
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
                        updatedAt: true,
                        lastSeenAt: true
                    }
                }
            }
        });
        res.status(201).json(newNote);
    }
    catch (error) {
        console.error("Error creating sales note:", error);
        res.status(500).json({ message: `Error creating sales note: ${error.message}` });
    }
});
exports.createSalesNote = createSalesNote;
const getSalesNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notes = yield prisma.salesNote.findMany({
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        profilePictureUrl: true,
                        updatedAt: true,
                        lastSeenAt: true
                    }
                },
                SalesNoteLike: {
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
                SalesNoteReply: {
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
        res.json(notes);
    }
    catch (error) {
        console.error("Error retrieving sales notes:", error);
        res.status(500).json({ message: `Error retrieving sales notes: ${error.message}` });
    }
});
exports.getSalesNotes = getSalesNotes;
const updateSalesNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const userId = req.userId;
        const existingNote = yield prisma.salesNote.findUnique({
            where: { id: Number(id) }
        });
        if (!existingNote) {
            res.status(404).json({ message: "Sales note not found" });
            return;
        }
        if (existingNote.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        const updatedNote = yield prisma.salesNote.update({
            where: { id: Number(id) },
            data: {
                title,
                content
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
        res.json(updatedNote);
    }
    catch (error) {
        console.error("Error updating sales note:", error);
        res.status(500).json({ message: `Error updating sales note: ${error.message}` });
    }
});
exports.updateSalesNote = updateSalesNote;
const deleteSalesNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const existingNote = yield prisma.salesNote.findUnique({
            where: { id: Number(id) }
        });
        if (!existingNote) {
            res.status(404).json({ message: "Sales note not found" });
            return;
        }
        if (existingNote.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        yield prisma.salesNote.delete({
            where: { id: Number(id) }
        });
        res.json({ message: "Sales note deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting sales note:", error);
        res.status(500).json({ message: `Error deleting sales note: ${error.message}` });
    }
});
exports.deleteSalesNote = deleteSalesNote;
// Add these to your salesNoteController.ts
const likeSalesNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if note exists
        const note = yield prisma.salesNote.findUnique({
            where: { id: Number(id) }
        });
        if (!note) {
            res.status(404).json({ message: "Sales note not found" });
            return;
        }
        // Check if user already liked this note
        const existingLike = yield prisma.salesNoteLike.findFirst({
            where: {
                userId: Number(userId),
                noteId: Number(id)
            }
        });
        if (existingLike) {
            res.status(400).json({ message: "You already liked this note" });
            return;
        }
        const like = yield prisma.salesNoteLike.create({
            data: {
                userId: Number(userId),
                noteId: Number(id)
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
        res.json(like);
    }
    catch (error) {
        console.error("Error liking sales note:", error);
        res.status(500).json({ message: `Error liking sales note: ${error.message}` });
    }
});
exports.likeSalesNote = likeSalesNote;
const unlikeSalesNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if like exists
        const existingLike = yield prisma.salesNoteLike.findFirst({
            where: {
                userId: Number(userId),
                noteId: Number(id)
            }
        });
        if (!existingLike) {
            res.status(404).json({ message: "Like not found" });
            return;
        }
        yield prisma.salesNoteLike.delete({
            where: { id: existingLike.id }
        });
        res.json({ message: "Unliked successfully" });
    }
    catch (error) {
        console.error("Error unliking sales note:", error);
        res.status(500).json({ message: `Error unliking sales note: ${error.message}` });
    }
});
exports.unlikeSalesNote = unlikeSalesNote;
const createSalesNoteReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.userId;
        if (!content) {
            res.status(400).json({ message: "Content is required" });
            return;
        }
        // Check if note exists
        const note = yield prisma.salesNote.findUnique({
            where: { id: Number(id) }
        });
        if (!note) {
            res.status(404).json({ message: "Sales note not found" });
            return;
        }
        const reply = yield prisma.salesNoteReply.create({
            data: {
                content,
                userId: Number(userId),
                noteId: Number(id)
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
        res.status(201).json(reply);
    }
    catch (error) {
        console.error("Error creating sales note reply:", error);
        res.status(500).json({ message: `Error creating sales note reply: ${error.message}` });
    }
});
exports.createSalesNoteReply = createSalesNoteReply;
const likeSalesNoteReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if reply exists
        const reply = yield prisma.salesNoteReply.findUnique({
            where: { id: Number(id) }
        });
        if (!reply) {
            res.status(404).json({ message: "Reply not found" });
            return;
        }
        // Check if user already liked this reply
        const existingLike = yield prisma.salesNoteReplyLike.findFirst({
            where: {
                userId: Number(userId),
                replyId: Number(id)
            }
        });
        if (existingLike) {
            res.status(400).json({ message: "You already liked this reply" });
            return;
        }
        const like = yield prisma.salesNoteReplyLike.create({
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
        res.json(like);
    }
    catch (error) {
        console.error("Error liking sales note reply:", error);
        res.status(500).json({ message: `Error liking sales note reply: ${error.message}` });
    }
});
exports.likeSalesNoteReply = likeSalesNoteReply;
const unlikeSalesNoteReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if like exists
        const existingLike = yield prisma.salesNoteReplyLike.findFirst({
            where: {
                userId: Number(userId),
                replyId: Number(id)
            }
        });
        if (!existingLike) {
            res.status(404).json({ message: "Like not found" });
            return;
        }
        yield prisma.salesNoteReplyLike.delete({
            where: { id: existingLike.id }
        });
        res.json({ message: "Unliked successfully" });
    }
    catch (error) {
        console.error("Error unliking sales note reply:", error);
        res.status(500).json({ message: `Error unliking sales note reply: ${error.message}` });
    }
});
exports.unlikeSalesNoteReply = unlikeSalesNoteReply;
