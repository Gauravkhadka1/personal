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
exports.deleteComment = exports.createComment = exports.unlikeKnowledgeSharing = exports.likeKnowledgeSharing = exports.getKnowledgeSharingAttachment = exports.deleteKnowledgeSharingAttachment = exports.deleteKnowledgeSharing = exports.updateKnowledgeSharing = exports.getKnowledgeSharings = exports.createKnowledgeSharing = void 0;
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
const UPLOAD_DIR = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const createKnowledgeSharing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { content } = req.body;
        const userId = req.userId;
        const files = (_a = req.files) === null || _a === void 0 ? void 0 : _a.attachments;
        const knowledgeSharing = yield prisma.knowledgeSharing.create({
            data: {
                content,
                userId: Number(userId),
            },
            include: {
                user: true,
            },
        });
        // Process attachments if any
        if (files && files.length > 0) {
            for (const file of files) {
                const filePath = path_1.default.join("feedback", file.filename).replace(/\\/g, '/');
                yield prisma.knowledgeSharingAttachment.create({
                    data: {
                        fileName: file.originalname,
                        fileURL: filePath,
                        knowledgeSharingId: knowledgeSharing.id,
                        uploadedById: Number(userId),
                    },
                });
            }
        }
        const createdKnowledgeSharing = yield prisma.knowledgeSharing.findUnique({
            where: { id: knowledgeSharing.id },
            include: {
                user: true,
                attachments: {
                    include: {
                        uploadedBy: true,
                    },
                },
            },
        });
        res.status(201).json(createdKnowledgeSharing);
    }
    catch (error) {
        console.error("Error creating feedback:", error);
        res.status(500).json({ message: "Error creating feedback" });
    }
});
exports.createKnowledgeSharing = createKnowledgeSharing;
const getKnowledgeSharings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const knowledgeSharings = yield prisma.knowledgeSharing.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                user: true,
                attachments: {
                    include: {
                        uploadedBy: true,
                    },
                },
                likes: {
                    include: {
                        user: true,
                    },
                },
                comments: {
                    include: {
                        user: true,
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });
        res.json(knowledgeSharings);
    }
    catch (error) {
        console.error("Error retrieving KnowledgeSharing:", error);
        res.status(500).json({ message: "Error retrieving KnowledgeSharing" });
    }
});
exports.getKnowledgeSharings = getKnowledgeSharings;
const updateKnowledgeSharing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.userId;
        const files = (_a = req.files) === null || _a === void 0 ? void 0 : _a.attachments;
        const existingKnowledgeSharing = yield prisma.knowledgeSharing.findUnique({
            where: { id: Number(id) },
        });
        if (!existingKnowledgeSharing) {
            res.status(404).json({ message: "Knowledge Sharing not found" });
            return;
        }
        if (existingKnowledgeSharing.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        // Update the content
        const updatedKnowledgeSharing = yield prisma.knowledgeSharing.update({
            where: { id: Number(id) },
            data: { content },
            include: {
                user: true,
                attachments: {
                    include: {
                        uploadedBy: true,
                    },
                },
            },
        });
        // Add new attachments if any
        if (files && files.length > 0) {
            for (const file of files) {
                const filePath = path_1.default.join("feedback", file.filename).replace(/\\/g, '/');
                yield prisma.knowledgeSharingAttachment.create({
                    data: {
                        fileName: file.originalname,
                        fileURL: filePath,
                        knowledgeSharingId: updatedKnowledgeSharing.id,
                        uploadedById: Number(userId),
                    },
                });
            }
        }
        // Return the updated knowledge sharing with all attachments
        const result = yield prisma.knowledgeSharing.findUnique({
            where: { id: Number(id) },
            include: {
                user: true,
                attachments: {
                    include: {
                        uploadedBy: true,
                    },
                },
            },
        });
        res.json(result);
    }
    catch (error) {
        console.error("Error updating KnowledgeSharing:", error);
        res.status(500).json({ message: "Error updating KnowledgeSharing" });
    }
});
exports.updateKnowledgeSharing = updateKnowledgeSharing;
const deleteKnowledgeSharing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const existingKnowledgeSharing = yield prisma.knowledgeSharing.findUnique({
            where: { id: Number(id) },
            include: { attachments: true },
        });
        if (!existingKnowledgeSharing) {
            res.status(404).json({ message: "KnowledgeSharing not found" });
            return;
        }
        if (existingKnowledgeSharing.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        // First delete all attachments (both from DB and filesystem)
        for (const attachment of existingKnowledgeSharing.attachments) {
            // Delete file from filesystem
            const fullPath = path_1.default.join(UPLOAD_DIR, path_1.default.basename(attachment.fileURL));
            if (fs_1.default.existsSync(fullPath)) {
                fs_1.default.unlinkSync(fullPath);
            }
            // Delete attachment from database
            yield prisma.knowledgeSharingAttachment.delete({
                where: { id: attachment.id },
            });
        }
        // Now delete the feedback itself
        yield prisma.knowledgeSharing.delete({
            where: { id: Number(id) },
        });
        res.json({ message: "Knowledge Sharing deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting Knowledge Sharing:", error);
        res.status(500).json({ message: "Error deleting KnowledgeSharing" });
    }
});
exports.deleteKnowledgeSharing = deleteKnowledgeSharing;
const deleteKnowledgeSharingAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { knowledgeSharingId, attachmentId } = req.params;
        const userId = req.userId;
        const knowledgeSharing = yield prisma.knowledgeSharing.findUnique({
            where: { id: Number(knowledgeSharingId) },
        });
        if (!knowledgeSharing) {
            res.status(404).json({ message: "Knowledge Sharing not found" });
            return;
        }
        if (knowledgeSharing.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        const attachment = yield prisma.knowledgeSharingAttachment.findUnique({
            where: { id: Number(attachmentId) },
        });
        if (!attachment) {
            res.status(404).json({ message: "Attachment not found" });
            return;
        }
        // Delete file from filesystem
        const fullPath = path_1.default.join(UPLOAD_DIR, path_1.default.basename(attachment.fileURL));
        if (fs_1.default.existsSync(fullPath)) {
            fs_1.default.unlinkSync(fullPath);
        }
        yield prisma.knowledgeSharingAttachment.delete({
            where: { id: Number(attachmentId) },
        });
        res.json({ message: "Attachment deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting attachment:", error);
        res.status(500).json({ message: "Error deleting attachment" });
    }
});
exports.deleteKnowledgeSharingAttachment = deleteKnowledgeSharingAttachment;
// Add this new endpoint to your
const getKnowledgeSharingAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filename } = req.params;
        const filePath = path_1.default.join(UPLOAD_DIR, 'feedback', filename);
        if (!fs_1.default.existsSync(filePath)) {
            res.status(404).json({ message: "File not found" });
            return;
        }
        res.sendFile(filePath);
    }
    catch (error) {
        console.error("Error retrieving attachment:", error);
        res.status(500).json({ message: "Error retrieving attachment" });
    }
});
exports.getKnowledgeSharingAttachment = getKnowledgeSharingAttachment;
const likeKnowledgeSharing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if already liked
        const existingLike = yield prisma.knowledgeSharingLike.findFirst({
            where: {
                knowledgeSharingId: Number(id),
                userId: Number(userId)
            }
        });
        if (existingLike) {
            res.status(400).json({ message: "Already liked" });
            return;
        }
        yield prisma.knowledgeSharingLike.create({
            data: {
                knowledgeSharingId: Number(id),
                userId: Number(userId)
            }
        });
        res.json({ message: "Knowledge sharing liked" });
    }
    catch (error) {
        console.error("Error liking knowledge sharing:", error);
        res.status(500).json({ message: "Error liking knowledge sharing" });
    }
});
exports.likeKnowledgeSharing = likeKnowledgeSharing;
const unlikeKnowledgeSharing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const like = yield prisma.knowledgeSharingLike.findFirst({
            where: {
                knowledgeSharingId: Number(id),
                userId: Number(userId)
            }
        });
        if (!like) {
            res.status(400).json({ message: "Not liked yet" });
            return;
        }
        yield prisma.knowledgeSharingLike.delete({
            where: { id: like.id }
        });
        res.json({ message: "Knowledge sharing unliked" });
    }
    catch (error) {
        console.error("Error unliking knowledge sharing:", error);
        res.status(500).json({ message: "Error unliking knowledge sharing" });
    }
});
exports.unlikeKnowledgeSharing = unlikeKnowledgeSharing;
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.userId;
        if (!content) {
            res.status(400).json({ message: "Content is required" });
            return;
        }
        const comment = yield prisma.knowledgeSharingComment.create({
            data: {
                content,
                knowledgeSharingId: Number(id),
                userId: Number(userId)
            },
            include: {
                user: true
            }
        });
        res.status(201).json(comment);
    }
    catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).json({ message: "Error creating comment" });
    }
});
exports.createComment = createComment;
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, commentId } = req.params;
        const userId = req.userId;
        // Check if comment exists
        const comment = yield prisma.knowledgeSharingComment.findUnique({
            where: { id: Number(commentId) }
        });
        if (!comment) {
            res.status(404).json({ message: "Comment not found" });
            return;
        }
        // Check if user is the comment author or knowledge sharing author
        const knowledgeSharing = yield prisma.knowledgeSharing.findUnique({
            where: { id: Number(id) }
        });
        if (comment.userId !== Number(userId) && (knowledgeSharing === null || knowledgeSharing === void 0 ? void 0 : knowledgeSharing.userId) !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        yield prisma.knowledgeSharingComment.delete({
            where: { id: Number(commentId) }
        });
        res.json({ message: "Comment deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Error deleting comment" });
    }
});
exports.deleteComment = deleteComment;
