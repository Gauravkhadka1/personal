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
exports.getLessonStatistics = exports.bulkCreateProjectLessons = exports.deleteProjectLesson = exports.updateProjectLesson = exports.createProjectLesson = exports.getLessonsByClientId = exports.getProjectLessonById = exports.getProjectLessons = void 0;
const client_1 = require("@prisma/client");
const index_1 = require("../index"); // Import io instance for real-time updates
const prisma = new client_1.PrismaClient();
/**
 * GET ALL PROJECT LESSONS
 * Retrieves all project lessons with optional filtering
 */
const getProjectLessons = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clientId, sortBy = "createdAt", sortOrder = "desc" } = req.query;
        // Build filter conditions
        const where = {};
        if (clientId) {
            where.clientId = parseInt(clientId);
        }
        // Fetch all project lessons with client information
        const projectLessons = yield prisma.projectLesson.findMany({
            where,
            include: {
                Client: {
                    select: {
                        id: true,
                        companyName: true,
                        domainName: true,
                        companyEmail: true,
                        projectStatus: true,
                    }
                }
            },
            orderBy: {
                [sortBy]: sortOrder,
            },
        });
        // Add formatted date for response
        const lessonsWithFormattedDate = projectLessons.map(lesson => (Object.assign(Object.assign({}, lesson), { createdAtFormatted: lesson.createdAt.toLocaleDateString(), updatedAtFormatted: lesson.updatedAt.toLocaleDateString() })));
        res.json({
            success: true,
            count: lessonsWithFormattedDate.length,
            data: lessonsWithFormattedDate
        });
    }
    catch (error) {
        console.error("Error fetching project lessons:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch project lessons"
        });
    }
});
exports.getProjectLessons = getProjectLessons;
/**
 * GET SINGLE PROJECT LESSON BY ID
 */
const getProjectLessonById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const projectLesson = yield prisma.projectLesson.findUnique({
            where: { id: parseInt(id) },
            include: {
                Client: {
                    select: {
                        id: true,
                        companyName: true,
                        domainName: true,
                        companyEmail: true,
                        companyPhone: true,
                        projectStatus: true,
                    }
                }
            }
        });
        if (!projectLesson) {
            res.status(404).json({
                success: false,
                error: "Project lesson not found"
            });
            return;
        }
        res.json({
            success: true,
            data: projectLesson
        });
    }
    catch (error) {
        console.error("Error fetching project lesson:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch project lesson"
        });
    }
});
exports.getProjectLessonById = getProjectLessonById;
/**
 * GET LESSONS BY CLIENT ID
 * Retrieves all lessons for a specific client
 */
const getLessonsByClientId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clientId } = req.params;
        // Check if client exists
        const client = yield prisma.client.findUnique({
            where: { id: parseInt(clientId) },
            select: {
                id: true,
                companyName: true,
                domainName: true,
            }
        });
        if (!client) {
            res.status(404).json({
                success: false,
                error: `Client with ID ${clientId} not found`
            });
            return;
        }
        // Fetch all lessons for this client
        const projectLessons = yield prisma.projectLesson.findMany({
            where: { clientId: parseInt(clientId) },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.json({
            success: true,
            client: client,
            count: projectLessons.length,
            data: projectLessons
        });
    }
    catch (error) {
        console.error("Error fetching client lessons:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch lessons for this client"
        });
    }
});
exports.getLessonsByClientId = getLessonsByClientId;
/**
 * CREATE NEW PROJECT LESSON
 */
const createProjectLesson = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clientId, whatWorked, whatSlowedUs, howToImprove } = req.body;
    try {
        // Validate client exists
        const clientExists = yield prisma.client.findUnique({
            where: { id: parseInt(clientId) },
            select: {
                id: true,
                companyName: true,
                domainName: true,
            }
        });
        if (!clientExists) {
            res.status(404).json({
                success: false,
                error: `Client with ID ${clientId} not found`
            });
            return;
        }
        // Create the project lesson
        const projectLesson = yield prisma.projectLesson.create({
            data: {
                clientId: parseInt(clientId),
                whatWorked: whatWorked || null,
                whatSlowedUs: whatSlowedUs || null,
                howToImprove: howToImprove || null,
            },
            include: {
                Client: {
                    select: {
                        id: true,
                        companyName: true,
                        domainName: true,
                    }
                }
            }
        });
        // Emit real-time event for new lesson
        index_1.io.emit("projectLesson:created", {
            projectLesson,
            message: `New lesson added for client: ${clientExists.companyName || clientExists.domainName}`,
        });
        res.status(201).json({
            success: true,
            message: "Project lesson created successfully",
            data: projectLesson
        });
    }
    catch (error) {
        console.error("Error creating project lesson:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create project lesson"
        });
    }
});
exports.createProjectLesson = createProjectLesson;
/**
 * UPDATE PROJECT LESSON
 */
const updateProjectLesson = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const { clientId, whatWorked, whatSlowedUs, howToImprove } = req.body;
    try {
        // Check if lesson exists
        const existingLesson = yield prisma.projectLesson.findUnique({
            where: { id: parseInt(id) },
            include: {
                Client: {
                    select: {
                        id: true,
                        companyName: true,
                        domainName: true,
                    }
                }
            }
        });
        if (!existingLesson) {
            res.status(404).json({
                success: false,
                error: "Project lesson not found"
            });
            return;
        }
        // If clientId is being updated, verify new client exists
        if (clientId && clientId !== existingLesson.clientId) {
            const newClient = yield prisma.client.findUnique({
                where: { id: parseInt(clientId) }
            });
            if (!newClient) {
                res.status(404).json({
                    success: false,
                    error: `Client with ID ${clientId} not found`
                });
                return;
            }
        }
        // Prepare update data
        const updateData = {};
        if (whatWorked !== undefined)
            updateData.whatWorked = whatWorked;
        if (whatSlowedUs !== undefined)
            updateData.whatSlowedUs = whatSlowedUs;
        if (howToImprove !== undefined)
            updateData.howToImprove = howToImprove;
        if (clientId !== undefined)
            updateData.clientId = parseInt(clientId);
        // Update the lesson
        const updatedLesson = yield prisma.projectLesson.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                Client: {
                    select: {
                        id: true,
                        companyName: true,
                        domainName: true,
                    }
                }
            }
        });
        // Emit real-time event for lesson update
        index_1.io.emit("projectLesson:updated", {
            projectLesson: updatedLesson,
            oldLesson: existingLesson,
            message: `Project lesson updated for client: ${((_a = updatedLesson.Client) === null || _a === void 0 ? void 0 : _a.companyName) || ((_b = updatedLesson.Client) === null || _b === void 0 ? void 0 : _b.domainName)}`,
        });
        res.json({
            success: true,
            message: "Project lesson updated successfully",
            data: updatedLesson
        });
    }
    catch (error) {
        console.error("Error updating project lesson:", error);
        res.status(500).json({
            success: false,
            error: "Failed to update project lesson"
        });
    }
});
exports.updateProjectLesson = updateProjectLesson;
/**
 * DELETE PROJECT LESSON
 */
const deleteProjectLesson = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { id } = req.params;
    try {
        // Check if lesson exists and get client info for notification
        const projectLesson = yield prisma.projectLesson.findUnique({
            where: { id: parseInt(id) },
            include: {
                Client: {
                    select: {
                        id: true,
                        companyName: true,
                        domainName: true,
                    }
                }
            }
        });
        if (!projectLesson) {
            res.status(404).json({
                success: false,
                error: "Project lesson not found"
            });
            return;
        }
        // Delete the lesson
        yield prisma.projectLesson.delete({
            where: { id: parseInt(id) },
        });
        // Emit real-time event for lesson deletion
        index_1.io.emit("projectLesson:deleted", {
            lessonId: parseInt(id),
            clientName: ((_a = projectLesson.Client) === null || _a === void 0 ? void 0 : _a.companyName) || ((_b = projectLesson.Client) === null || _b === void 0 ? void 0 : _b.domainName),
            message: `Project lesson deleted for ${((_c = projectLesson.Client) === null || _c === void 0 ? void 0 : _c.companyName) || ((_d = projectLesson.Client) === null || _d === void 0 ? void 0 : _d.domainName)}`,
        });
        res.status(200).json({
            success: true,
            message: "Project lesson deleted successfully"
        });
    }
    catch (error) {
        console.error("Error deleting project lesson:", error);
        res.status(500).json({
            success: false,
            error: "Failed to delete project lesson"
        });
    }
});
exports.deleteProjectLesson = deleteProjectLesson;
/**
 * BULK CREATE PROJECT LESSONS
 * Create multiple lessons at once for a client
 */
const bulkCreateProjectLessons = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { clientId, lessons } = req.body;
    try {
        // Validate client exists
        const clientExists = yield prisma.client.findUnique({
            where: { id: parseInt(clientId) }
        });
        if (!clientExists) {
            res.status(404).json({
                success: false,
                error: `Client with ID ${clientId} not found`
            });
            return;
        }
        // Validate lessons array
        if (!Array.isArray(lessons) || lessons.length === 0) {
            res.status(400).json({
                success: false,
                error: "Lessons array is required and cannot be empty"
            });
            return;
        }
        // Create multiple lessons
        const createdLessons = yield prisma.$transaction(lessons.map(lesson => prisma.projectLesson.create({
            data: {
                clientId: parseInt(clientId),
                whatWorked: lesson.whatWorked || null,
                whatSlowedUs: lesson.whatSlowedUs || null,
                howToImprove: lesson.howToImprove || null,
            }
        })));
        // Emit real-time event for bulk creation
        index_1.io.emit("projectLesson:bulkCreated", {
            count: createdLessons.length,
            clientId: parseInt(clientId),
            clientName: clientExists.companyName || clientExists.domainName,
            message: `${createdLessons.length} lessons added for ${clientExists.companyName || clientExists.domainName}`,
        });
        res.status(201).json({
            success: true,
            message: `${createdLessons.length} project lessons created successfully`,
            data: createdLessons
        });
    }
    catch (error) {
        console.error("Error bulk creating project lessons:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create project lessons"
        });
    }
});
exports.bulkCreateProjectLessons = bulkCreateProjectLessons;
/**
 * GET LESSON STATISTICS
 * Get aggregated statistics for lessons
 */
const getLessonStatistics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { clientId } = req.query;
        const where = {};
        if (clientId) {
            where.clientId = parseInt(clientId);
        }
        const lessons = yield prisma.projectLesson.findMany({
            where,
            select: {
                id: true,
                whatWorked: true,
                whatSlowedUs: true,
                howToImprove: true,
                createdAt: true,
                clientId: true,
            }
        });
        // Calculate statistics
        const totalLessons = lessons.length;
        const lessonsWithWhatWorked = lessons.filter(l => l.whatWorked && l.whatWorked.trim().length > 0).length;
        const lessonsWithWhatSlowedUs = lessons.filter(l => l.whatSlowedUs && l.whatSlowedUs.trim().length > 0).length;
        const lessonsWithHowToImprove = lessons.filter(l => l.howToImprove && l.howToImprove.trim().length > 0).length;
        // Get unique clients with lessons
        const uniqueClients = [...new Set(lessons.map(l => l.clientId))];
        res.json({
            success: true,
            statistics: {
                totalLessons,
                uniqueClients: uniqueClients.length,
                completionRate: {
                    whatWorked: (lessonsWithWhatWorked / totalLessons * 100).toFixed(2),
                    whatSlowedUs: (lessonsWithWhatSlowedUs / totalLessons * 100).toFixed(2),
                    howToImprove: (lessonsWithHowToImprove / totalLessons * 100).toFixed(2),
                },
                recentLessons: lessons.slice(0, 5)
            }
        });
    }
    catch (error) {
        console.error("Error fetching lesson statistics:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch lesson statistics"
        });
    }
});
exports.getLessonStatistics = getLessonStatistics;
