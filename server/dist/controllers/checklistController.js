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
exports.reorderChecklists = exports.deleteChecklist = exports.updateChecklist = exports.getChecklistById = exports.getUserChecklists = exports.getPublicChecklists = exports.getChecklists = exports.createChecklist = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createChecklist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, items } = req.body;
        const userId = req.userId;
        const isPublic = req.path.includes('/public');
        if (!title) {
            res.status(400).json({ message: "Title is required" });
            return;
        }
        // Get the count of existing checklists to set the order
        const checklistCount = yield prisma.checklist.count({
            where: { userId: Number(userId) }
        });
        const newChecklist = yield prisma.checklist.create({
            data: {
                title,
                isPublic,
                order: checklistCount, // Set order to the next available position
                userId: Number(userId),
                items: {
                    create: (items === null || items === void 0 ? void 0 : items.map((item) => ({
                        text: item.text,
                        completed: false,
                        order: 0
                    }))) || []
                }
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
                },
                items: true
            }
        });
        res.status(201).json(newChecklist);
    }
    catch (error) {
        console.error("Error creating checklist:", error);
        res.status(500).json({ message: `Error creating checklist: ${error.message}` });
    }
});
exports.createChecklist = createChecklist;
const getChecklists = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { role: true }
        });
        if ((user === null || user === void 0 ? void 0 : user.role) !== "ADMIN") {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        const checklists = yield prisma.checklist.findMany({
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
                items: {
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(checklists);
    }
    catch (error) {
        console.error("Error retrieving checklists:", error);
        res.status(500).json({ message: `Error retrieving checklists: ${error.message}` });
    }
});
exports.getChecklists = getChecklists;
const getPublicChecklists = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const checklists = yield prisma.checklist.findMany({
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
                items: {
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(checklists);
    }
    catch (error) {
        console.error("Error retrieving public checklists:", error);
        res.status(500).json({ message: `Error retrieving public checklists: ${error.message}` });
    }
});
exports.getPublicChecklists = getPublicChecklists;
const getUserChecklists = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const checklists = yield prisma.checklist.findMany({
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
                items: {
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { order: 'asc' } // Change from createdAt to order
        });
        res.json(checklists);
    }
    catch (error) {
        console.error("Error retrieving user checklists:", error);
        res.status(500).json({ message: `Error retrieving user checklists: ${error.message}` });
    }
});
exports.getUserChecklists = getUserChecklists;
const getChecklistById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const checklist = yield prisma.checklist.findUnique({
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
                items: {
                    orderBy: { order: 'asc' }
                }
            }
        });
        if (!checklist) {
            res.status(404).json({ message: "Checklist not found" });
            return;
        }
        if (!checklist.isPublic && checklist.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        res.json(checklist);
    }
    catch (error) {
        console.error("Error retrieving checklist:", error);
        res.status(500).json({ message: `Error retrieving checklist: ${error.message}` });
    }
});
exports.getChecklistById = getChecklistById;
const updateChecklist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, isPublic, items } = req.body;
        const userId = req.userId;
        const existingChecklist = yield prisma.checklist.findUnique({
            where: { id: Number(id) }
        });
        if (!existingChecklist) {
            res.status(404).json({ message: "Checklist not found" });
            return;
        }
        if (existingChecklist.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        // Use transaction to update checklist and items
        const updatedChecklist = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Delete existing items
            yield tx.checklistItem.deleteMany({
                where: { checklistId: Number(id) }
            });
            // Update checklist
            const checklist = yield tx.checklist.update({
                where: { id: Number(id) },
                data: {
                    title,
                    isPublic,
                    items: {
                        create: (items === null || items === void 0 ? void 0 : items.map((item) => ({
                            text: item.text,
                            completed: item.completed,
                            order: item.order || 0
                        }))) || []
                    }
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
                    },
                    items: {
                        orderBy: { order: 'asc' }
                    }
                }
            });
            return checklist;
        }));
        res.json(updatedChecklist);
    }
    catch (error) {
        console.error("Error updating checklist:", error);
        res.status(500).json({ message: `Error updating checklist: ${error.message}` });
    }
});
exports.updateChecklist = updateChecklist;
const deleteChecklist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const existingChecklist = yield prisma.checklist.findUnique({
            where: { id: Number(id) }
        });
        if (!existingChecklist) {
            res.status(404).json({ message: "Checklist not found" });
            return;
        }
        if (existingChecklist.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        yield prisma.$transaction([
            prisma.checklistItem.deleteMany({
                where: { checklistId: Number(id) }
            }),
            prisma.checklist.delete({
                where: { id: Number(id) }
            })
        ]);
        res.json({ message: "Checklist deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting checklist:", error);
        res.status(500).json({ message: `Error deleting checklist: ${error.message}` });
    }
});
exports.deleteChecklist = deleteChecklist;
const reorderChecklists = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { checklistIds } = req.body;
        const userId = req.userId;
        if (!checklistIds || !Array.isArray(checklistIds)) {
            res.status(400).json({ message: "checklistIds array is required" });
            return;
        }
        // Verify all checklists belong to the user
        const userChecklists = yield prisma.checklist.findMany({
            where: { userId: Number(userId) },
            select: { id: true }
        });
        const userChecklistIds = userChecklists.map(c => c.id);
        const invalidChecklists = checklistIds.filter(id => !userChecklistIds.includes(id));
        if (invalidChecklists.length > 0) {
            res.status(403).json({ message: "Unauthorized access to some checklists" });
            return;
        }
        // Update order for each checklist
        const updatePromises = checklistIds.map((checklistId, index) => prisma.checklist.update({
            where: { id: checklistId },
            data: { order: index }
        }));
        yield Promise.all(updatePromises);
        res.json({ message: "Checklists reordered successfully" });
    }
    catch (error) {
        console.error("Error reordering checklists:", error);
        res.status(500).json({ message: `Error reordering checklists: ${error.message}` });
    }
});
exports.reorderChecklists = reorderChecklists;
