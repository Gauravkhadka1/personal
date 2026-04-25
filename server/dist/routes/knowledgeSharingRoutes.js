"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server\src\routes\knowledgeSharingRoutes.ts
const express_1 = __importDefault(require("express"));
const knowledgeSharingController_1 = require("../controllers/knowledgeSharingController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const upload_1 = require("../utils/upload");
const router = express_1.default.Router();
router.post('/', authMiddleware_1.authenticateToken, (req, res, next) => {
    (0, upload_1.feedbackUpload)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, knowledgeSharingController_1.createKnowledgeSharing);
router.get("/", knowledgeSharingController_1.getKnowledgeSharings);
router.put('/:id', authMiddleware_1.authenticateToken, (req, res, next) => {
    (0, upload_1.feedbackUpload)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, knowledgeSharingController_1.updateKnowledgeSharing);
router.delete("/:id", authMiddleware_1.authenticateToken, knowledgeSharingController_1.deleteKnowledgeSharing);
// Like routes
router.post("/:id/like", authMiddleware_1.authenticateToken, knowledgeSharingController_1.likeKnowledgeSharing);
router.post("/:id/unlike", authMiddleware_1.authenticateToken, knowledgeSharingController_1.unlikeKnowledgeSharing);
// Comment routes
router.post("/:id/comments", authMiddleware_1.authenticateToken, knowledgeSharingController_1.createComment);
router.delete("/:id/comments/:commentId", authMiddleware_1.authenticateToken, knowledgeSharingController_1.deleteComment);
// Attachment routes
router.delete("/:knowledgeSharingId/attachments/:attachmentId", authMiddleware_1.authenticateToken, knowledgeSharingController_1.deleteKnowledgeSharingAttachment);
router.get("/attachments/feedback/:filename", knowledgeSharingController_1.getKnowledgeSharingAttachment);
exports.default = router;
