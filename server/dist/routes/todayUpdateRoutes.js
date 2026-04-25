"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server\src\routes\todayUpdateRoutes.ts
const express_1 = __importDefault(require("express"));
const todayUpdateController_1 = require("../controllers/todayUpdateController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Create a new update
router.post("/", authMiddleware_1.authenticateToken, todayUpdateController_1.createTodayUpdate);
// Get all updates (for admin) - with optional date filtering
router.get("/", authMiddleware_1.authenticateToken, todayUpdateController_1.getTodayUpdates);
// Get user's updates - with optional date filtering
router.get("/user", authMiddleware_1.authenticateToken, todayUpdateController_1.getUserTodayUpdates);
// Get updates by specific date (YYYY-MM-DD format)
router.get("/date/:date", authMiddleware_1.authenticateToken, todayUpdateController_1.getTodayUpdatesByDate);
// Get updates by user ID and date
router.get("/user/:userId/date/:date", authMiddleware_1.authenticateToken, todayUpdateController_1.getTodayUpdatesByUserAndDate);
// Get a specific update
router.get("/:id", authMiddleware_1.authenticateToken, todayUpdateController_1.getTodayUpdateById);
// Update an update
router.put("/:id", authMiddleware_1.authenticateToken, todayUpdateController_1.updateTodayUpdate);
// Delete an update
router.delete("/:id", authMiddleware_1.authenticateToken, todayUpdateController_1.deleteTodayUpdate);
// Like an update
router.post("/:id/like", authMiddleware_1.authenticateToken, todayUpdateController_1.likeTodayUpdate);
// Unlike an update
router.post("/:id/unlike", authMiddleware_1.authenticateToken, todayUpdateController_1.unlikeTodayUpdate);
// Create a reply to an update
router.post("/:id/replies", authMiddleware_1.authenticateToken, todayUpdateController_1.createReply);
// Like a reply
router.post("/replies/:id/like", authMiddleware_1.authenticateToken, todayUpdateController_1.likeReply);
// Unlike a reply
router.post("/replies/:id/unlike", authMiddleware_1.authenticateToken, todayUpdateController_1.unlikeReply);
exports.default = router;
