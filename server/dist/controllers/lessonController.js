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
exports.getLessonsByCategory = exports.deleteLesson = exports.updateLesson = exports.createLesson = exports.getLessonById = exports.getLessons = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all lessons with filtering
const getLessons = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { categoryId, contentType, search, page = 1, limit = 10 } = req.query;
        const userId = req.userId;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        // Build filter conditions
        const where = { userId: Number(userId) };
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (contentType) {
            where.contentType = contentType;
        }
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { content: { contains: search } }
            ];
        }
        const [lessons, total] = yield Promise.all([
            prisma.lesson.findMany({
                where,
                include: {
                    category: true
                },
                skip,
                take,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            prisma.lesson.count({ where })
        ]);
        res.json({
            data: lessons,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error("Error fetching lessons:", error);
        res.status(500).json({ message: `Error fetching lessons: ${error.message}` });
    }
});
exports.getLessons = getLessons;
// Get single lesson by ID
const getLessonById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const lesson = yield prisma.lesson.findFirst({
            where: {
                id,
                userId: Number(userId)
            },
            include: {
                category: true
            }
        });
        if (!lesson) {
            res.status(404).json({ message: "Lesson not found" });
            return;
        }
        res.json(lesson);
    }
    catch (error) {
        console.error("Error fetching lesson:", error);
        res.status(500).json({ message: `Error fetching lesson: ${error.message}` });
    }
});
exports.getLessonById = getLessonById;
// Create new lesson
const createLesson = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, content, contentType, imageUrl, categoryId } = req.body;
        const userId = req.userId;
        // Validation
        if (!title || !categoryId) {
            res.status(400).json({ message: "Title and category are required" });
            return;
        }
        // Check if category exists
        const category = yield prisma.lessonCategory.findUnique({
            where: { id: categoryId }
        });
        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        // Validate content based on type
        if (contentType === 'TEXT' && !content) {
            res.status(400).json({ message: "Content is required for text lessons" });
            return;
        }
        if (contentType === 'IMAGE' && !imageUrl) {
            res.status(400).json({ message: "Image URL is required for image lessons" });
            return;
        }
        if (contentType === 'TEXT_IMAGE' && (!content || !imageUrl)) {
            res.status(400).json({ message: "Both content and image URL are required for text-image lessons" });
            return;
        }
        const lesson = yield prisma.lesson.create({
            data: {
                title,
                content: content || null,
                contentType: contentType || 'TEXT',
                imageUrl: imageUrl || null,
                categoryId,
                userId: Number(userId)
            },
            include: {
                category: true
            }
        });
        res.status(201).json({
            message: "Lesson created successfully",
            lesson
        });
    }
    catch (error) {
        console.error("Error creating lesson:", error);
        res.status(500).json({ message: `Error creating lesson: ${error.message}` });
    }
});
exports.createLesson = createLesson;
// Update lesson
const updateLesson = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, content, contentType, imageUrl, categoryId } = req.body;
        const userId = req.userId;
        // Check if lesson exists and belongs to user
        const existingLesson = yield prisma.lesson.findFirst({
            where: {
                id,
                userId: Number(userId)
            }
        });
        if (!existingLesson) {
            res.status(404).json({ message: "Lesson not found" });
            return;
        }
        // If category is being updated, check if it exists
        if (categoryId && categoryId !== existingLesson.categoryId) {
            const category = yield prisma.lessonCategory.findUnique({
                where: { id: categoryId }
            });
            if (!category) {
                res.status(404).json({ message: "Category not found" });
                return;
            }
        }
        const updateData = {};
        if (title)
            updateData.title = title;
        if (content !== undefined)
            updateData.content = content;
        if (contentType)
            updateData.contentType = contentType;
        if (imageUrl !== undefined)
            updateData.imageUrl = imageUrl;
        if (categoryId)
            updateData.categoryId = categoryId;
        const updatedLesson = yield prisma.lesson.update({
            where: { id },
            data: updateData,
            include: {
                category: true
            }
        });
        res.json({
            message: "Lesson updated successfully",
            lesson: updatedLesson
        });
    }
    catch (error) {
        console.error("Error updating lesson:", error);
        res.status(500).json({ message: `Error updating lesson: ${error.message}` });
    }
});
exports.updateLesson = updateLesson;
// Delete lesson
const deleteLesson = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const lesson = yield prisma.lesson.findFirst({
            where: {
                id,
                userId: Number(userId)
            }
        });
        if (!lesson) {
            res.status(404).json({ message: "Lesson not found" });
            return;
        }
        yield prisma.lesson.delete({
            where: { id }
        });
        res.json({ message: "Lesson deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting lesson:", error);
        res.status(500).json({ message: `Error deleting lesson: ${error.message}` });
    }
});
exports.deleteLesson = deleteLesson;
// Get lessons by category with count
const getLessonsByCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { categoryId } = req.params;
        const userId = req.userId;
        const lessons = yield prisma.lesson.findMany({
            where: {
                categoryId,
                userId: Number(userId)
            },
            include: {
                category: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            data: lessons,
            count: lessons.length
        });
    }
    catch (error) {
        console.error("Error fetching lessons by category:", error);
        res.status(500).json({ message: `Error fetching lessons: ${error.message}` });
    }
});
exports.getLessonsByCategory = getLessonsByCategory;
