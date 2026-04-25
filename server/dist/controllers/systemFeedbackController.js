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
exports.getFeedbackAttachment = exports.deleteFeedbackAttachment = exports.deleteSystemFeedback = exports.updateSystemFeedback = exports.getSystemFeedbacks = exports.createSystemFeedback = void 0;
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const emailSender_1 = require("../utils/emailSender");
const prisma = new client_1.PrismaClient();
const UPLOAD_DIR = path_1.default.join(process.cwd(), "uploads");
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
const createSystemFeedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        const userId = req.userId;
        if (!content) {
            res.status(400).json({ message: "Content is required" });
            return;
        }
        // Get user information for the email
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: {
                username: true,
                email: true,
                firstname: true,
                lastname: true
            }
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Create the system feedback
        const newFeedback = yield prisma.systemFeedback.create({
            data: {
                content,
                userId: Number(userId)
            },
            include: {
                user: {
                    select: {
                        username: true,
                        firstname: true,
                        lastname: true,
                        email: true
                    }
                }
            }
        });
        // Send email notification
        try {
            const displayName = `${user.username}`;
            yield (0, emailSender_1.sendSystemFeedbackNotification)(displayName, content, newFeedback.id);
            console.log(`System feedback notification sent for feedback ID: ${newFeedback.id}`);
        }
        catch (emailError) {
            console.error('Error sending system feedback notification:', emailError);
            // Don't fail the request if email fails
        }
        res.status(201).json(newFeedback);
    }
    catch (error) {
        console.error("Error creating system feedback:", error);
        res.status(500).json({ message: `Error creating system feedback: ${error.message}` });
    }
});
exports.createSystemFeedback = createSystemFeedback;
const getSystemFeedbacks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.query; // Get userId from query params
        // Build where clause based on whether userId is provided
        const whereClause = userId ? { userId: Number(userId) } : {};
        // Execute both queries in parallel for better performance
        const [feedbacks, statusCounts, totalCount] = yield Promise.all([
            // Get all feedbacks (filtered by userId if provided)
            prisma.systemFeedback.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
                include: {
                    user: true,
                    attachments: {
                        include: {
                            uploadedBy: true,
                        },
                    },
                },
            }),
            // Get status counts (filtered by userId if provided)
            prisma.systemFeedback.groupBy({
                by: ['status'],
                where: whereClause,
                _count: {
                    _all: true
                }
            }),
            // Get total count (filtered by userId if provided)
            prisma.systemFeedback.count({
                where: whereClause
            })
        ]);
        // Convert status counts to object format
        const statusCountsObject = statusCounts.reduce((acc, item) => {
            acc[item.status] = item._count._all;
            return acc;
        }, {});
        // Ensure all statuses are present in the response, even if count is 0
        const allStatuses = ['New', 'Acknowledged', 'InProgress', 'Resolved'];
        const completeStatusCounts = allStatuses.reduce((acc, status) => {
            acc[status] = statusCountsObject[status] || 0;
            return acc;
        }, {});
        res.json({
            feedbacks,
            statusCounts: completeStatusCounts,
            totalCount,
            resolvedCount: completeStatusCounts.Resolved || 0
        });
    }
    catch (error) {
        console.error("Error retrieving feedbacks:", error);
        res.status(500).json({ message: "Error retrieving feedbacks" });
    }
});
exports.getSystemFeedbacks = getSystemFeedbacks;
// You can now remove getSystemFeedbacksByUserId since it's handled by the main function
const updateSystemFeedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { content, status } = req.body;
        const userId = req.userId;
        const existingFeedback = yield prisma.systemFeedback.findUnique({
            where: { id: Number(id) },
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                        firstname: true,
                        lastname: true
                    }
                }
            }
        });
        if (!existingFeedback) {
            res.status(404).json({ message: "Feedback not found" });
            return;
        }
        // Check if user is the owner or has special privileges
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: {
                role: true,
                email: true,
                username: true,
                firstname: true,
                lastname: true
            }
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const isGaurav = user.email === 'gaurav@webtech.com.np';
        const isOwner = existingFeedback.userId === Number(userId);
        const canUpdateStatus = isGaurav;
        // Regular users can only update content, gaurav can update both content and status
        if (!isOwner && !isGaurav) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        // Store old status for comparison
        const oldStatus = existingFeedback.status;
        // Build update data
        const updateData = {};
        // Only include content if provided (owners,  gaurav can update content)
        if (content !== undefined) {
            updateData.content = content;
        }
        // Only admins and gaurav can update status
        if (status !== undefined) {
            if (canUpdateStatus) {
                updateData.status = status;
            }
            else {
                res.status(403).json({
                    message: "Only administrators or authorized users can update feedback status"
                });
                return;
            }
        }
        const updatedFeedback = yield prisma.systemFeedback.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                user: true,
                attachments: {
                    include: {
                        uploadedBy: true,
                    },
                },
            },
        });
        // Send email notification if status was changed
        if (status !== undefined && status !== oldStatus) {
            try {
                yield (0, emailSender_1.sendSystemFeedbackStatusUpdateNotification)(existingFeedback.user.email, // Feedback creator's email
                'gaurav@webtech.com.np', // Gaurav's email
                existingFeedback.user.username, existingFeedback.content, updatedFeedback.id, oldStatus, status, user.username // Updater's username
                );
                console.log(`System feedback status update notification sent for feedback ID: ${updatedFeedback.id}`);
            }
            catch (emailError) {
                console.error('Error sending system feedback status update notification:', emailError);
                // Don't fail the request if email fails
            }
        }
        res.json(updatedFeedback);
    }
    catch (error) {
        console.error("Error updating feedback:", error);
        res.status(500).json({ message: "Error updating feedback" });
    }
});
exports.updateSystemFeedback = updateSystemFeedback;
const deleteSystemFeedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const existingFeedback = yield prisma.systemFeedback.findUnique({
            where: { id: Number(id) },
            include: { attachments: true },
        });
        if (!existingFeedback) {
            res.status(404).json({ message: "Feedback not found" });
            return;
        }
        if (existingFeedback.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        // First delete all attachments (both from DB and filesystem)
        for (const attachment of existingFeedback.attachments) {
            // Delete file from filesystem
            const fullPath = path_1.default.join(UPLOAD_DIR, path_1.default.basename(attachment.fileURL));
            if (fs_1.default.existsSync(fullPath)) {
                fs_1.default.unlinkSync(fullPath);
            }
            // Delete attachment from database
            yield prisma.feedbackAttachment.delete({
                where: { id: attachment.id },
            });
        }
        // Now delete the feedback itself
        yield prisma.systemFeedback.delete({
            where: { id: Number(id) },
        });
        res.json({ message: "Feedback deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting feedback:", error);
        res.status(500).json({ message: "Error deleting feedback" });
    }
});
exports.deleteSystemFeedback = deleteSystemFeedback;
const deleteFeedbackAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { feedbackId, attachmentId } = req.params;
        const userId = req.userId;
        const feedback = yield prisma.systemFeedback.findUnique({
            where: { id: Number(feedbackId) },
        });
        if (!feedback) {
            res.status(404).json({ message: "Feedback not found" });
            return;
        }
        if (feedback.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        const attachment = yield prisma.feedbackAttachment.findUnique({
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
        yield prisma.feedbackAttachment.delete({
            where: { id: Number(attachmentId) },
        });
        res.json({ message: "Attachment deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting attachment:", error);
        res.status(500).json({ message: "Error deleting attachment" });
    }
});
exports.deleteFeedbackAttachment = deleteFeedbackAttachment;
// Add this new endpoint to your systemFeedbackController.ts
const getFeedbackAttachment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
exports.getFeedbackAttachment = getFeedbackAttachment;
