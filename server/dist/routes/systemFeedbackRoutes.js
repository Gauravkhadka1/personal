"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const systemFeedbackController_1 = require("../controllers/systemFeedbackController");
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
}, systemFeedbackController_1.createSystemFeedback);
// Get all feedbacks (existing)
router.get("/", systemFeedbackController_1.getSystemFeedbacks);
router.put("/:id", authMiddleware_1.authenticateToken, systemFeedbackController_1.updateSystemFeedback);
router.delete("/:id", authMiddleware_1.authenticateToken, systemFeedbackController_1.deleteSystemFeedback);
router.delete("/:feedbackId/attachments/:attachmentId", authMiddleware_1.authenticateToken, systemFeedbackController_1.deleteFeedbackAttachment);
router.get("/attachments/feedback/:filename", systemFeedbackController_1.getFeedbackAttachment);
exports.default = router;
