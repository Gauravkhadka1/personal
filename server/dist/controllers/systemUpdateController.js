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
exports.deleteSystemUpdate = exports.updateSystemUpdate = exports.getSystemUpdates = exports.createSystemUpdate = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const createSystemUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { content } = req.body;
        const userId = req.userId;
        if (!content) {
            res.status(400).json({ message: "Content is required" });
            return;
        }
        const newUpdate = yield prisma.systemUpdate.create({
            data: {
                content,
                userId: Number(userId)
            },
        });
        res.status(201).json(newUpdate);
    }
    catch (error) {
        console.error("Error creating system update:", error);
        res.status(500).json({ message: `Error creating system update: ${error.message}` });
    }
});
exports.createSystemUpdate = createSystemUpdate;
const getSystemUpdates = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const user = yield prisma.user.findUnique({
            where: { userId: Number(userId) },
            select: { role: true }
        });
        if (!["ADMIN", "DESIGNER", "DEVELOPER"].includes((user === null || user === void 0 ? void 0 : user.role) || "")) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        const updates = yield prisma.systemUpdate.findMany({
            orderBy: { createdAt: "desc" }
        });
        res.json(updates);
    }
    catch (error) {
        console.error("Error retrieving system updates:", error);
        res.status(500).json({ message: `Error retrieving system updates: ${error.message}` });
    }
});
exports.getSystemUpdates = getSystemUpdates;
const updateSystemUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.userId;
        const existingUpdate = yield prisma.systemUpdate.findUnique({
            where: { id: Number(id) }
        });
        if (!existingUpdate) {
            res.status(404).json({ message: "Update not found" });
            return;
        }
        if (existingUpdate.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        const updatedUpdate = yield prisma.systemUpdate.update({
            where: { id: Number(id) },
            data: { content },
        });
        res.json(updatedUpdate);
    }
    catch (error) {
        console.error("Error updating system update:", error);
        res.status(500).json({ message: `Error updating system update: ${error.message}` });
    }
});
exports.updateSystemUpdate = updateSystemUpdate;
const deleteSystemUpdate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const existingUpdate = yield prisma.systemUpdate.findUnique({
            where: { id: Number(id) }
        });
        if (!existingUpdate) {
            res.status(404).json({ message: "Update not found" });
            return;
        }
        if (existingUpdate.userId !== Number(userId)) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }
        yield prisma.systemUpdate.delete({
            where: { id: Number(id) }
        });
        res.json({ message: "Update deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting system update:", error);
        res.status(500).json({ message: `Error deleting system update: ${error.message}` });
    }
});
exports.deleteSystemUpdate = deleteSystemUpdate;
