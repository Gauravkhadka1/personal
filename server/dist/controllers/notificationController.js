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
exports.deleteNotification = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.markAsRead = exports.getUserNotifications = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// server\src\controllers\notificationController.ts
const getUserNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const { showAll } = req.query; // Add this line to accept a query parameter
    try {
        const notifications = yield prisma.notification.findMany({
            where: Object.assign({ userId: Number(userId) }, (showAll !== 'true' ? { isRead: false } : {})),
            orderBy: { createdAt: "desc" },
            take: 20,
        });
        res.json(notifications);
    }
    catch (error) {
        res.status(500).json({ message: `Error fetching notifications: ${error.message}` });
    }
});
exports.getUserNotifications = getUserNotifications;
const markAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { notificationId } = req.params;
    try {
        yield prisma.notification.update({
            where: { id: Number(notificationId) },
            data: { isRead: true },
        });
        res.status(200).json({ message: "Notification marked as read" });
    }
    catch (error) {
        res.status(500).json({ message: `Error updating notification: ${error.message}` });
    }
});
exports.markAsRead = markAsRead;
// server/src/controllers/notificationController.ts
const markNotificationAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { notificationId } = req.params;
    try {
        const notification = yield prisma.notification.update({
            where: { id: Number(notificationId) },
            data: { isRead: true },
            include: { user: true },
        });
        res.status(200).json(notification);
    }
    catch (error) {
        res.status(500).json({ message: `Error updating notification: ${error.message}` });
    }
});
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        yield prisma.notification.updateMany({
            where: {
                userId: Number(userId),
                isRead: false
            },
            data: { isRead: true },
        });
        res.status(200).json({ message: "All notifications marked as read" });
    }
    catch (error) {
        res.status(500).json({ message: `Error updating notifications: ${error.message}` });
    }
});
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
// server\src\controllers\notificationController.ts
const deleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { notificationId } = req.params;
    try {
        yield prisma.notification.delete({
            where: { id: Number(notificationId) },
        });
        res.status(200).json({ message: "Notification deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: `Error deleting notification: ${error.message}` });
    }
});
exports.deleteNotification = deleteNotification;
