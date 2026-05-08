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
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getCategories = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Get all categories with lesson count
const getCategories = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield prisma.lessonCategory.findMany({
            include: {
                _count: {
                    select: { lessons: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Transform response to include lessonCount
        const categoriesWithCount = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            lessonCount: cat._count.lessons,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt
        }));
        res.json(categoriesWithCount);
    }
    catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: `Error fetching categories: ${error.message}` });
    }
});
exports.getCategories = getCategories;
// Get single category by ID
const getCategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const category = yield prisma.lessonCategory.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { lessons: true }
                }
            }
        });
        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        res.json({
            id: category.id,
            name: category.name,
            description: category.description,
            lessonCount: category._count.lessons,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
        });
    }
    catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ message: `Error fetching category: ${error.message}` });
    }
});
exports.getCategoryById = getCategoryById;
// Create new category
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description } = req.body;
        const userId = req.userId;
        if (!name) {
            res.status(400).json({ message: "Category name is required" });
            return;
        }
        // Check if category already exists
        const existingCategory = yield prisma.lessonCategory.findUnique({
            where: { name }
        });
        if (existingCategory) {
            res.status(400).json({ message: "Category with this name already exists" });
            return;
        }
        const category = yield prisma.lessonCategory.create({
            data: {
                name,
                description: description || null
            }
        });
        res.status(201).json({
            message: "Category created successfully",
            category: {
                id: category.id,
                name: category.name,
                description: category.description,
                lessonCount: 0,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt
            }
        });
    }
    catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: `Error creating category: ${error.message}` });
    }
});
exports.createCategory = createCategory;
// Update category
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        if (!name && !description) {
            res.status(400).json({ message: "At least one field is required to update" });
            return;
        }
        const existingCategory = yield prisma.lessonCategory.findUnique({
            where: { id }
        });
        if (!existingCategory) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        // Check if new name conflicts with another category
        if (name && name !== existingCategory.name) {
            const nameConflict = yield prisma.lessonCategory.findUnique({
                where: { name }
            });
            if (nameConflict) {
                res.status(400).json({ message: "Category with this name already exists" });
                return;
            }
        }
        const updatedCategory = yield prisma.lessonCategory.update({
            where: { id },
            data: {
                name: name || existingCategory.name,
                description: description !== undefined ? description : existingCategory.description
            }
        });
        res.json({
            message: "Category updated successfully",
            category: updatedCategory
        });
    }
    catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ message: `Error updating category: ${error.message}` });
    }
});
exports.updateCategory = updateCategory;
// Delete category
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const category = yield prisma.lessonCategory.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { lessons: true }
                }
            }
        });
        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        if (category._count.lessons > 0) {
            res.status(400).json({
                message: `Cannot delete category with ${category._count.lessons} lessons. Delete or reassign lessons first.`
            });
            return;
        }
        yield prisma.lessonCategory.delete({
            where: { id }
        });
        res.json({ message: "Category deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: `Error deleting category: ${error.message}` });
    }
});
exports.deleteCategory = deleteCategory;
