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
exports.deleteNoteReply = exports.updateNoteReply = exports.unlikeNoteReply = exports.likeNoteReply = exports.createNoteReply = exports.unlikeNote = exports.likeNote = exports.deleteNote = exports.updateNote = exports.getNoteById = exports.getUserNotes = exports.getPublicNotes = exports.getNotes = exports.createNote = void 0;
const client_1 = require("@prisma/client");
const emailSender_1 = require("../utils/emailSender");
const prisma = new client_1.PrismaClient();
const createNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, content } = req.body;
        const userId = req.userId;
        const isPublic = req.path.includes('/public'); // Determine if this is a public note creation
        if (!title || !content) {
            res.status(400).json({ message: "Title and content are required" });
            return;
        }
        const newNote = yield prisma.note.create({
            data: {
                title,
                content,
                isPublic, // Set based on the endpoint used
                userId: Number(userId)
            },
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        profilePictureUrl: true,
                        updatedAt: true,
                        lastSeenAt: true
                    }
                }
            }
        });
        // Send email notification if it's a public note
        if (isPublic && newNote.user) {
            try {
                yield (0, emailSender_1.sendPublicNoteNotification)(newNote.user.username, `<h3>Public Note</h3><p>${content}</p>`, 'created');
            }
            catch (emailError) {
                console.error('Failed to send email notification:', emailError);
                // Don't fail the request if email fails
            }
        }
        res.status(201).json(newNote);
    }
    catch (error) {
        console.error("Error creating note:", error);
        res.status(500).json({ message: `Error creating note: ${error.message}` });
    }
});
exports.createNote = createNote;
const getNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Only admin should be able to get all notes
        const userId = req.userId;
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) !== "ADMIN") {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        const notes = yield prisma.note.findMany({
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
                NoteLike: {
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
                NoteReply: {
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
        console.error("Error retrieving notes:", error);
        res.status(500).json({ message: `Error retrieving notes: ${error.message}` });
    }
});
exports.getNotes = getNotes;
const getPublicNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notes = yield prisma.note.findMany({
            where: { isPublic: true },
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
                NoteLike: {
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
                NoteReply: {
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
        console.error("Error retrieving public notes:", error);
        res.status(500).json({ message: `Error retrieving public notes: ${error.message}` });
    }
});
exports.getPublicNotes = getPublicNotes;
const getUserNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const notes = yield prisma.note.findMany({
            where: { userId: Number(userId) },
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
                NoteLike: {
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
                NoteReply: {
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
        console.error("Error retrieving user notes:", error);
        res.status(500).json({ message: `Error retrieving user notes: ${error.message}` });
    }
});
exports.getUserNotes = getUserNotes;
const getNoteById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const note = yield prisma.note.findUnique({
            where: { id: Number(id) },
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
                NoteLike: {
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
                NoteReply: {
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
            }
        });
        if (!note) {
            res.status(404).json({ message: "Note not found" });
            return;
        }
        // Check if user can access the note
        if (!note.isPublic && note.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        res.json(note);
    }
    catch (error) {
        console.error("Error retrieving note:", error);
        res.status(500).json({ message: `Error retrieving note: ${error.message}` });
    }
});
exports.getNoteById = getNoteById;
const updateNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, content, isPublic } = req.body;
        const userId = req.userId;
        // Check if note exists and belongs to user
        const existingNote = yield prisma.note.findUnique({
            where: { id: Number(id) }
        });
        if (!existingNote) {
            res.status(404).json({ message: "Note not found" });
            return;
        }
        if (existingNote.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        const updatedNote = yield prisma.note.update({
            where: { id: Number(id) },
            data: {
                title,
                content,
                isPublic
            },
            include: {
                user: {
                    select: {
                        userId: true,
                        username: true,
                        profilePictureUrl: true,
                        updatedAt: true,
                        lastSeenAt: true
                    }
                }
            }
        });
        if ((isPublic || existingNote.isPublic) && updatedNote.user) {
            try {
                yield (0, emailSender_1.sendPublicNoteNotification)(updatedNote.user.username, `<h3>Public Note</h3><p>${content}</p>`, existingNote.isPublic ? 'updated' : 'created');
            }
            catch (emailError) {
                console.error('Failed to send email notification:', emailError);
                // Don't fail the request if email fails
            }
        }
        res.json(updatedNote);
    }
    catch (error) {
        console.error("Error updating note:", error);
        res.status(500).json({ message: `Error updating note: ${error.message}` });
    }
});
exports.updateNote = updateNote;
const deleteNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if note exists and belongs to user
        const existingNote = yield prisma.note.findUnique({
            where: { id: Number(id) }
        });
        if (!existingNote) {
            res.status(404).json({ message: "Note not found" });
            return;
        }
        if (existingNote.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        // Use transaction to delete all related records
        yield prisma.$transaction([
            // Delete all note reply likes first
            prisma.noteReplyLike.deleteMany({
                where: {
                    reply: {
                        noteId: Number(id)
                    }
                }
            }),
            // Then delete all note replies
            prisma.noteReply.deleteMany({
                where: {
                    noteId: Number(id)
                }
            }),
            // Then delete all note likes
            prisma.noteLike.deleteMany({
                where: {
                    noteId: Number(id)
                }
            }),
            // Finally delete the note
            prisma.note.delete({
                where: { id: Number(id) }
            })
        ]);
        res.json({ message: "Note deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting note:", error);
        res.status(500).json({ message: `Error deleting note: ${error.message}` });
    }
});
exports.deleteNote = deleteNote;
// Add these to your noteController.ts
const likeNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if note exists and is public
        const note = yield prisma.note.findUnique({
            where: { id: Number(id) }
        });
        if (!note) {
            res.status(404).json({ message: "Note not found" });
            return;
        }
        if (!note.isPublic) {
            res.status(403).json({ message: "Only public notes can be liked" });
            return;
        }
        // Check if user already liked this note
        const existingLike = yield prisma.noteLike.findFirst({
            where: {
                userId: Number(userId),
                noteId: Number(id)
            }
        });
        if (existingLike) {
            res.status(400).json({ message: "You already liked this note" });
            return;
        }
        const like = yield prisma.noteLike.create({
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
        const actor = yield prisma.user.findUnique({
            where: { userId: Number(userId) }
        });
        if (actor) {
            try {
                yield (0, emailSender_1.sendNoteLikeNotification)(Number(id), actor.username);
            }
            catch (emailError) {
                console.error('Failed to send like notification:', emailError);
            }
        }
        res.json(like);
    }
    catch (error) {
        console.error("Error liking note:", error);
        res.status(500).json({ message: `Error liking note: ${error.message}` });
    }
});
exports.likeNote = likeNote;
const unlikeNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if like exists
        const existingLike = yield prisma.noteLike.findFirst({
            where: {
                userId: Number(userId),
                noteId: Number(id)
            }
        });
        if (!existingLike) {
            res.status(404).json({ message: "Like not found" });
            return;
        }
        yield prisma.noteLike.delete({
            where: { id: existingLike.id }
        });
        res.json({ message: "Unliked successfully" });
    }
    catch (error) {
        console.error("Error unliking note:", error);
        res.status(500).json({ message: `Error unliking note: ${error.message}` });
    }
});
exports.unlikeNote = unlikeNote;
// server\src\controllers\noteController.ts
const createNoteReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { content, parentReplyId } = req.body;
        const userId = req.userId;
        if (!content) {
            res.status(400).json({ message: "Content is required" });
            return;
        }
        // Check if note exists and is public
        const note = yield prisma.note.findUnique({
            where: { id: Number(id) }
        });
        if (!note) {
            res.status(404).json({ message: "Note not found" });
            return;
        }
        if (!note.isPublic) {
            res.status(403).json({ message: "Only public notes can be replied to" });
            return;
        }
        // If replying to another reply, check if parent reply exists
        if (parentReplyId) {
            const parentReply = yield prisma.noteReply.findUnique({
                where: { id: Number(parentReplyId) }
            });
            if (!parentReply) {
                res.status(404).json({ message: "Parent reply not found" });
                return;
            }
        }
        const reply = yield prisma.noteReply.create({
            data: {
                content,
                userId: Number(userId),
                noteId: Number(id),
                parentReplyId: parentReplyId ? Number(parentReplyId) : null
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
                parent: {
                    include: {
                        user: {
                            select: {
                                userId: true,
                                username: true
                            }
                        }
                    }
                }
            }
        });
        const actor = yield prisma.user.findUnique({
            where: { userId: Number(userId) }
        });
        if (actor) {
            try {
                // Send notification to note owner
                if (note.userId !== Number(userId)) {
                    yield (0, emailSender_1.sendNoteReplyNotification)(Number(id), actor.username, content);
                }
                // Send notification to parent reply owner if different from current user and note owner
                if (parentReplyId && reply.parent && reply.parent.userId !== Number(userId)) {
                    yield (0, emailSender_1.sendNoteReplyToReplyNotification)(Number(id), actor.username, content, reply.parent.user.username);
                }
                // Always send to gaurav@webtech.com.np
                yield (0, emailSender_1.sendNoteReplyNotification)(Number(id), actor.username, content, 'gaurav@webtech.com.np');
            }
            catch (emailError) {
                console.error('Failed to send reply notification:', emailError);
            }
        }
        res.status(201).json(reply);
    }
    catch (error) {
        console.error("Error creating reply:", error);
        res.status(500).json({ message: `Error creating reply: ${error.message}` });
    }
});
exports.createNoteReply = createNoteReply;
const likeNoteReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if reply exists
        const reply = yield prisma.noteReply.findUnique({
            where: { id: Number(id) }
        });
        if (!reply) {
            res.status(404).json({ message: "Reply not found" });
            return;
        }
        // Check if user already liked this reply
        const existingLike = yield prisma.noteReplyLike.findFirst({
            where: {
                userId: Number(userId),
                replyId: Number(id)
            }
        });
        if (existingLike) {
            res.status(400).json({ message: "You already liked this reply" });
            return;
        }
        const like = yield prisma.noteReplyLike.create({
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
        console.error("Error liking reply:", error);
        res.status(500).json({ message: `Error liking reply: ${error.message}` });
    }
});
exports.likeNoteReply = likeNoteReply;
const unlikeNoteReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if like exists
        const existingLike = yield prisma.noteReplyLike.findFirst({
            where: {
                userId: Number(userId),
                replyId: Number(id)
            }
        });
        if (!existingLike) {
            res.status(404).json({ message: "Like not found" });
            return;
        }
        yield prisma.noteReplyLike.delete({
            where: { id: existingLike.id }
        });
        res.json({ message: "Unliked successfully" });
    }
    catch (error) {
        console.error("Error unliking reply:", error);
        res.status(500).json({ message: `Error unliking reply: ${error.message}` });
    }
});
exports.unlikeNoteReply = unlikeNoteReply;
const updateNoteReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.userId;
        // Check if reply exists
        const existingReply = yield prisma.noteReply.findUnique({
            where: { id: Number(id) }
        });
        if (!existingReply) {
            res.status(404).json({ message: "Reply not found" });
            return;
        }
        // Check if user owns the reply
        if (existingReply.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        const updatedReply = yield prisma.noteReply.update({
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
            }
        });
        res.json(updatedReply);
    }
    catch (error) {
        console.error("Error updating reply:", error);
        res.status(500).json({ message: `Error updating reply: ${error.message}` });
    }
});
exports.updateNoteReply = updateNoteReply;
const deleteNoteReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if reply exists
        const existingReply = yield prisma.noteReply.findUnique({
            where: { id: Number(id) }
        });
        if (!existingReply) {
            res.status(404).json({ message: "Reply not found" });
            return;
        }
        // Check if user owns the reply
        if (existingReply.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        // Use transaction to delete all related records
        yield prisma.$transaction([
            // Delete all reply likes first
            prisma.noteReplyLike.deleteMany({
                where: {
                    replyId: Number(id)
                }
            }),
            // Then delete the reply
            prisma.noteReply.delete({
                where: { id: Number(id) }
            })
        ]);
        res.json({ message: "Reply deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting reply:", error);
        res.status(500).json({ message: `Error deleting reply: ${error.message}` });
    }
});
exports.deleteNoteReply = deleteNoteReply;
