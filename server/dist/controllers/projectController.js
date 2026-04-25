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
exports.addReplyToProjectCommentReply = exports.likeProjectCommentReply = exports.addReplyToProjectComment = exports.likeProjectComment = exports.addProjectComment = exports.getProjectComments = exports.updateProject = exports.deleteProject = exports.updateProjectStatus = exports.createProject = exports.getProjects = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projects = yield prisma.project.findMany({
            include: {
                tasks: {
                    where: {
                        parentTaskId: null, // Only get parent tasks initially
                    },
                    include: {
                        subtasks: true, // Include all subtasks for each parent task
                        assignedUsers: true, // Include assigned users if needed
                    },
                    orderBy: {
                        dueDate: 'asc', // Optional: order tasks by due date
                    },
                },
            },
        });
        res.json(projects);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: `Error retrieving projects: ${error.message}` });
    }
});
exports.getProjects = getProjects;
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, startDate, endDate, status = "New" } = req.body;
    try {
        const newProject = yield prisma.project.create({
            data: {
                name,
                description,
                startDate,
                endDate,
                status,
            },
        });
        res.status(201).json(newProject);
    }
    catch (error) {
        console.error("Error creating project:", error); // Log the complete error
        res.status(500).json({ message: `Error creating project: ${error.message}` });
    }
});
exports.createProject = createProject;
const updateProjectStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const { status } = req.body;
    try {
        const updatedProject = yield prisma.project.update({
            where: {
                id: Number(projectId),
            },
            data: {
                status: status,
            },
        });
        res.json(updatedProject);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating Project: ${error.message}` });
    }
});
exports.updateProjectStatus = updateProjectStatus;
// In your projectController.ts
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    try {
        // First delete all tasks associated with this project
        yield prisma.task.deleteMany({
            where: {
                projectId: Number(projectId),
            },
        });
        // Then delete the project
        yield prisma.project.delete({
            where: {
                id: Number(projectId),
            },
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting project: ${error.message}` });
    }
});
exports.deleteProject = deleteProject;
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const { name, description, startDate, endDate, googleDriveLink } = req.body;
    try {
        const updatedProject = yield prisma.project.update({
            where: {
                id: Number(projectId),
            },
            data: {
                name,
                description,
                // Convert string dates to DateTime objects
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                googleDriveLink,
            },
        });
        res.json(updatedProject);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating project: ${error.message}` });
    }
});
exports.updateProject = updateProject;
const getProjectComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    try {
        const comments = yield prisma.projectComment.findMany({
            where: {
                projectId: Number(projectId),
            },
            include: {
                user: {
                    select: {
                        firstname: true,
                        lastname: true,
                    },
                },
                likes: {
                    where: userId ? { userId } : undefined,
                    select: {
                        userId: true
                    }
                },
                replies: {
                    include: {
                        user: {
                            select: {
                                firstname: true,
                                lastname: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                _count: {
                    select: {
                        likes: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const formattedComments = comments.map(comment => (Object.assign(Object.assign({}, comment), { likeCount: comment._count.likes, likedByUser: comment.likes.length > 0, replies: comment.replies.map(reply => ({
                id: reply.id,
                content: reply.content,
                createdAt: reply.createdAt,
                user: reply.user
            })) })));
        res.json(formattedComments);
    }
    catch (error) {
        res.status(500).json({ message: `Error retrieving comments: ${error.message}` });
    }
});
exports.getProjectComments = getProjectComments;
const addProjectComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { projectId } = req.params;
    const { content, userId } = req.body;
    try {
        const newComment = yield prisma.projectComment.create({
            data: {
                content,
                userId: Number(userId),
                projectId: Number(projectId),
            },
            include: {
                user: {
                    select: {
                        firstname: true,
                        lastname: true,
                    },
                },
            },
        });
        res.status(201).json(newComment);
    }
    catch (error) {
        res.status(500).json({ message: `Error adding comment: ${error.message}` });
    }
});
exports.addProjectComment = addProjectComment;
const likeProjectComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { userId } = req.body;
    try {
        // Check if user already liked the comment
        const existingLike = yield prisma.projectCommentLike.findFirst({
            where: {
                userId: Number(userId),
                commentId: Number(commentId)
            }
        });
        if (existingLike) {
            // Unlike if already liked
            yield prisma.projectCommentLike.delete({
                where: {
                    id: existingLike.id
                }
            });
        }
        else {
            // Like if not already liked
            yield prisma.projectCommentLike.create({
                data: {
                    userId: Number(userId),
                    commentId: Number(commentId)
                }
            });
        }
        // Get updated like count
        const likeCount = yield prisma.projectCommentLike.count({
            where: {
                commentId: Number(commentId)
            }
        });
        res.json({
            success: true,
            likeCount,
            likedByUser: !existingLike
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: `Error liking comment: ${error.message}`
        });
    }
});
exports.likeProjectComment = likeProjectComment;
const addReplyToProjectComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentId } = req.params;
    const { content, userId } = req.body;
    try {
        const reply = yield prisma.projectCommentReply.create({
            data: {
                content,
                userId: Number(userId),
                commentId: Number(commentId),
            },
            include: {
                user: {
                    select: {
                        firstname: true,
                        lastname: true,
                    },
                },
            },
        });
        res.status(201).json(reply);
    }
    catch (error) {
        res.status(500).json({ message: `Error adding reply: ${error.message}` });
    }
});
exports.addReplyToProjectComment = addReplyToProjectComment;
const likeProjectCommentReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { replyId } = req.params;
    const { userId } = req.body;
    try {
        // First get the reply to find its commentId
        const reply = yield prisma.projectCommentReply.findUnique({
            where: { id: Number(replyId) },
            select: { commentId: true }
        });
        if (!reply) {
            res.status(404).json({ success: false, message: 'Reply not found' });
            return;
        }
        // Check if user already liked the reply
        const existingLike = yield prisma.projectCommentLike.findFirst({
            where: {
                userId: Number(userId),
                replyId: Number(replyId)
            }
        });
        if (existingLike) {
            // Unlike if already liked
            yield prisma.projectCommentLike.delete({
                where: { id: existingLike.id }
            });
        }
        else {
            // Like if not already liked - include commentId from the reply
            yield prisma.projectCommentLike.create({
                data: {
                    userId: Number(userId),
                    replyId: Number(replyId),
                    commentId: reply.commentId // Include the commentId from the reply
                }
            });
        }
        // Get updated like count
        const likeCount = yield prisma.projectCommentLike.count({
            where: { replyId: Number(replyId) }
        });
        res.json({
            success: true,
            likeCount,
            likedByUser: !existingLike
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: `Error liking reply: ${error.message}`
        });
    }
});
exports.likeProjectCommentReply = likeProjectCommentReply;
const addReplyToProjectCommentReply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { replyId } = req.params;
    const { content, userId } = req.body;
    try {
        // First get the parent reply to find its commentId
        const parentReply = yield prisma.projectCommentReply.findUnique({
            where: { id: Number(replyId) },
            select: { commentId: true }
        });
        if (!parentReply) {
            res.status(404).json({ message: 'Parent reply not found' });
            return;
        }
        const reply = yield prisma.projectCommentReply.create({
            data: {
                content,
                userId: Number(userId),
                parentReplyId: Number(replyId),
                commentId: parentReply.commentId // Include the commentId from the parent reply
            },
            include: {
                user: {
                    select: {
                        firstname: true,
                        lastname: true,
                    },
                },
            },
        });
        res.status(201).json(reply);
    }
    catch (error) {
        res.status(500).json({ message: `Error adding reply: ${error.message}` });
    }
});
exports.addReplyToProjectCommentReply = addReplyToProjectCommentReply;
