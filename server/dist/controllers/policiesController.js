"use strict";
// server/src/controllers/policiesController.ts
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
exports.getPolicyVersions = exports.permanentlyDeletePolicy = exports.deletePolicy = exports.reorderPolicies = exports.updatePolicy = exports.getPolicyById = exports.getAllPolicies = exports.createPolicy = exports.deleteCategory = exports.reorderCategories = exports.updateCategory = exports.getCategoryById = exports.getAllCategories = exports.createCategory = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Create a new policy category (ADMIN only)
// Update createCategory to set order
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, description } = req.body;
        const userId = req.userId;
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
            res.status(403).json({ message: "Only ADMIN can create categories" });
            return;
        }
        if (!name) {
            res.status(400).json({ message: "Category name is required" });
            return;
        }
        const existingCategory = yield prisma.policyCategory.findUnique({
            where: { name }
        });
        if (existingCategory) {
            res.status(400).json({ message: "Category with this name already exists" });
            return;
        }
        // Get the highest order value to place new category at the end
        const maxOrder = yield prisma.policyCategory.aggregate({
            _max: { order: true }
        });
        const category = yield prisma.policyCategory.create({
            data: {
                name,
                description,
                order: ((_a = maxOrder._max.order) !== null && _a !== void 0 ? _a : -1) + 1
            }
        });
        res.status(201).json({
            message: "Category created successfully",
            category
        });
    }
    catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: `Error creating category: ${error.message}` });
    }
});
exports.createCategory = createCategory;
// Update getAllCategories to order by order field
const getAllCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield prisma.policyCategory.findMany({
            include: {
                policies: {
                    where: { isActive: true },
                    orderBy: { order: 'asc' }, // Order policies by order field
                    include: {
                        createdByUser: {
                            select: {
                                userId: true,
                                username: true,
                                email: true
                            }
                        },
                        updatedByUser: {
                            select: {
                                userId: true,
                                username: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { order: 'asc' } // Order categories by order field
        });
        res.json(categories);
    }
    catch (error) {
        console.error("Error retrieving categories:", error);
        res.status(500).json({ message: `Error retrieving categories: ${error.message}` });
    }
});
exports.getAllCategories = getAllCategories;
// Get a single category by ID with its policies
const getCategoryById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const category = yield prisma.policyCategory.findUnique({
            where: { id: Number(id) },
            include: {
                policies: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        createdByUser: {
                            select: {
                                userId: true,
                                username: true,
                                email: true
                            }
                        },
                        updatedByUser: {
                            select: {
                                userId: true,
                                username: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        res.json(category);
    }
    catch (error) {
        console.error("Error retrieving category:", error);
        res.status(500).json({ message: `Error retrieving category: ${error.message}` });
    }
});
exports.getCategoryById = getCategoryById;
// Update a category (ADMIN only)
const updateCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const userId = req.userId;
        // Check if user is ADMIN
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
            res.status(403).json({ message: "Only ADMIN can update categories" });
            return;
        }
        const existingCategory = yield prisma.policyCategory.findUnique({
            where: { id: Number(id) }
        });
        if (!existingCategory) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        // If name is being changed, check for duplicates
        if (name && name !== existingCategory.name) {
            const duplicateCategory = yield prisma.policyCategory.findUnique({
                where: { name }
            });
            if (duplicateCategory) {
                res.status(400).json({ message: "Category with this name already exists" });
                return;
            }
        }
        const updatedCategory = yield prisma.policyCategory.update({
            where: { id: Number(id) },
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
// Add new endpoint to reorder categories
const reorderCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { categoryIds } = req.body; // Array of category IDs in desired order
        const userId = req.userId;
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
            res.status(403).json({ message: "Only ADMIN can reorder categories" });
            return;
        }
        // Update order for each category
        yield Promise.all(categoryIds.map((id, index) => prisma.policyCategory.update({
            where: { id },
            data: { order: index }
        })));
        res.json({ message: "Categories reordered successfully" });
    }
    catch (error) {
        console.error("Error reordering categories:", error);
        res.status(500).json({ message: `Error reordering categories: ${error.message}` });
    }
});
exports.reorderCategories = reorderCategories;
// Delete a category (ADMIN only)
const deleteCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if user is ADMIN
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
            res.status(403).json({ message: "Only ADMIN can delete categories" });
            return;
        }
        const category = yield prisma.policyCategory.findUnique({
            where: { id: Number(id) },
            include: {
                policies: true
            }
        });
        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        // Delete the category (policies will be cascade deleted)
        yield prisma.policyCategory.delete({
            where: { id: Number(id) }
        });
        res.json({
            message: "Category deleted successfully",
            deletedPoliciesCount: category.policies.length
        });
    }
    catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: `Error deleting category: ${error.message}` });
    }
});
exports.deleteCategory = deleteCategory;
// Create a new policy under a category (ADMIN only)
// Update createPolicy to set order
const createPolicy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { categoryId, content } = req.body;
        const userId = req.userId;
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
            res.status(403).json({ message: "Only ADMIN can create policies" });
            return;
        }
        if (!categoryId || !content) {
            res.status(400).json({ message: "Category ID and content are required" });
            return;
        }
        const category = yield prisma.policyCategory.findUnique({
            where: { id: Number(categoryId) }
        });
        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }
        // Get the highest order value for policies in this category
        const maxOrder = yield prisma.policy.aggregate({
            where: { categoryId: Number(categoryId) },
            _max: { order: true }
        });
        const policy = yield prisma.policy.create({
            data: {
                content,
                categoryId: Number(categoryId),
                createdBy: Number(userId),
                version: 1,
                order: ((_a = maxOrder._max.order) !== null && _a !== void 0 ? _a : -1) + 1
            },
            include: {
                category: true,
                createdByUser: {
                    select: {
                        userId: true,
                        username: true,
                        email: true
                    }
                }
            }
        });
        res.status(201).json({
            message: "Policy created successfully",
            policy
        });
    }
    catch (error) {
        console.error("Error creating policy:", error);
        res.status(500).json({ message: `Error creating policy: ${error.message}` });
    }
});
exports.createPolicy = createPolicy;
// Get all policies (with optional category filter)
const getAllPolicies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { categoryId } = req.query;
        const whereClause = { isActive: true };
        if (categoryId) {
            whereClause.categoryId = Number(categoryId);
        }
        const policies = yield prisma.policy.findMany({
            where: whereClause,
            include: {
                category: true,
                createdByUser: {
                    select: {
                        userId: true,
                        username: true,
                        email: true
                    }
                },
                updatedByUser: {
                    select: {
                        userId: true,
                        username: true,
                        email: true
                    }
                }
            },
            orderBy: { order: 'asc' } // Change this from createdAt to order
        });
        res.json(policies);
    }
    catch (error) {
        console.error("Error retrieving policies:", error);
        res.status(500).json({ message: `Error retrieving policies: ${error.message}` });
    }
});
exports.getAllPolicies = getAllPolicies;
// Get a single policy by ID
const getPolicyById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const policy = yield prisma.policy.findUnique({
            where: { id: Number(id) },
            include: {
                category: true,
                createdByUser: {
                    select: {
                        userId: true,
                        username: true,
                        email: true
                    }
                },
                updatedByUser: {
                    select: {
                        userId: true,
                        username: true,
                        email: true
                    }
                }
            }
        });
        if (!policy) {
            res.status(404).json({ message: "Policy not found" });
            return;
        }
        res.json(policy);
    }
    catch (error) {
        console.error("Error retrieving policy:", error);
        res.status(500).json({ message: `Error retrieving policy: ${error.message}` });
    }
});
exports.getPolicyById = getPolicyById;
// Update a policy (ADMIN only)
const updatePolicy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { content, categoryId } = req.body;
        const userId = req.userId;
        // Check if user is ADMIN
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
            res.status(403).json({ message: "Only ADMIN can update policies" });
            return;
        }
        const existingPolicy = yield prisma.policy.findUnique({
            where: { id: Number(id) }
        });
        if (!existingPolicy) {
            res.status(404).json({ message: "Policy not found" });
            return;
        }
        // If category is being changed, verify new category exists
        if (categoryId && categoryId !== existingPolicy.categoryId) {
            const category = yield prisma.policyCategory.findUnique({
                where: { id: Number(categoryId) }
            });
            if (!category) {
                res.status(404).json({ message: "New category not found" });
                return;
            }
        }
        // Increment version if content changed
        let newVersion = existingPolicy.version;
        if (content && content !== existingPolicy.content) {
            newVersion = existingPolicy.version + 1;
        }
        const updatedPolicy = yield prisma.policy.update({
            where: { id: Number(id) },
            data: {
                content: content || existingPolicy.content,
                categoryId: categoryId ? Number(categoryId) : existingPolicy.categoryId,
                version: newVersion,
                updatedBy: Number(userId)
            },
            include: {
                category: true,
                createdByUser: {
                    select: {
                        userId: true,
                        username: true,
                        email: true
                    }
                },
                updatedByUser: {
                    select: {
                        userId: true,
                        username: true,
                        email: true
                    }
                }
            }
        });
        res.json({
            message: "Policy updated successfully",
            policy: updatedPolicy
        });
    }
    catch (error) {
        console.error("Error updating policy:", error);
        res.status(500).json({ message: `Error updating policy: ${error.message}` });
    }
});
exports.updatePolicy = updatePolicy;
// Add new endpoint to reorder policies within a category
const reorderPolicies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { categoryId, policyIds } = req.body; // Array of policy IDs in desired order
        const userId = req.userId;
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
            res.status(403).json({ message: "Only ADMIN can reorder policies" });
            return;
        }
        // Update order for each policy
        yield Promise.all(policyIds.map((id, index) => prisma.policy.update({
            where: { id },
            data: { order: index }
        })));
        res.json({ message: "Policies reordered successfully" });
    }
    catch (error) {
        console.error("Error reordering policies:", error);
        res.status(500).json({ message: `Error reordering policies: ${error.message}` });
    }
});
exports.reorderPolicies = reorderPolicies;
// Delete a policy (soft delete - deactivate) (ADMIN only)
const deletePolicy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if user is ADMIN
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
            res.status(403).json({ message: "Only ADMIN can delete policies" });
            return;
        }
        const existingPolicy = yield prisma.policy.findUnique({
            where: { id: Number(id) }
        });
        if (!existingPolicy) {
            res.status(404).json({ message: "Policy not found" });
            return;
        }
        // Soft delete - just mark as inactive
        const deletedPolicy = yield prisma.policy.update({
            where: { id: Number(id) },
            data: { isActive: false }
        });
        res.json({
            message: "Policy deleted successfully",
            policy: deletedPolicy
        });
    }
    catch (error) {
        console.error("Error deleting policy:", error);
        res.status(500).json({ message: `Error deleting policy: ${error.message}` });
    }
});
exports.deletePolicy = deletePolicy;
// Permanently delete a policy (hard delete) (ADMIN only)
const permanentlyDeletePolicy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if user is ADMIN
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
            res.status(403).json({ message: "Only ADMIN can permanently delete policies" });
            return;
        }
        const existingPolicy = yield prisma.policy.findUnique({
            where: { id: Number(id) }
        });
        if (!existingPolicy) {
            res.status(404).json({ message: "Policy not found" });
            return;
        }
        yield prisma.policy.delete({
            where: { id: Number(id) }
        });
        res.json({
            message: "Policy permanently deleted successfully"
        });
    }
    catch (error) {
        console.error("Error permanently deleting policy:", error);
        res.status(500).json({ message: `Error permanently deleting policy: ${error.message}` });
    }
});
exports.permanentlyDeletePolicy = permanentlyDeletePolicy;
// Get policy version history (ADMIN only)
const getPolicyVersions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        // Check if user is ADMIN
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN') {
            res.status(403).json({ message: "Only ADMIN can view version history" });
            return;
        }
        // Note: For full version history, you would need a PolicyVersion model
        // This just returns the current policy with version info
        const policy = yield prisma.policy.findUnique({
            where: { id: Number(id) },
            include: {
                category: true,
                createdByUser: {
                    select: {
                        userId: true,
                        username: true,
                        email: true
                    }
                },
                updatedByUser: {
                    select: {
                        userId: true,
                        username: true,
                        email: true
                    }
                }
            }
        });
        if (!policy) {
            res.status(404).json({ message: "Policy not found" });
            return;
        }
        res.json({
            currentVersion: policy.version,
            lastUpdated: policy.updatedAt,
            lastUpdatedBy: policy.updatedByUser,
            createdBy: policy.createdByUser,
            createdAt: policy.createdAt
        });
    }
    catch (error) {
        console.error("Error retrieving policy versions:", error);
        res.status(500).json({ message: `Error retrieving policy versions: ${error.message}` });
    }
});
exports.getPolicyVersions = getPolicyVersions;
