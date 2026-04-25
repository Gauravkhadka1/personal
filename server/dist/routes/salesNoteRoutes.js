"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server\src\routes\salesNoteRoutes.ts
const express_1 = __importDefault(require("express"));
const salesNoteController_1 = require("../controllers/salesNoteController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Create a new sales note
router.post("/", authMiddleware_1.authenticateToken, salesNoteController_1.createSalesNote);
// Get all sales notes
router.get("/", authMiddleware_1.authenticateToken, salesNoteController_1.getSalesNotes);
// Update a sales note
router.put("/:id", authMiddleware_1.authenticateToken, salesNoteController_1.updateSalesNote);
// Delete a sales note
router.delete("/:id", authMiddleware_1.authenticateToken, salesNoteController_1.deleteSalesNote);
// Like/unlike a sales note
router.post("/:id/like", authMiddleware_1.authenticateToken, salesNoteController_1.likeSalesNote);
router.post("/:id/unlike", authMiddleware_1.authenticateToken, salesNoteController_1.unlikeSalesNote);
// Reply to a sales note
router.post("/:id/replies", authMiddleware_1.authenticateToken, salesNoteController_1.createSalesNoteReply);
// Like/unlike a sales note reply
router.post("/replies/:id/like", authMiddleware_1.authenticateToken, salesNoteController_1.likeSalesNoteReply);
router.post("/replies/:id/unlike", authMiddleware_1.authenticateToken, salesNoteController_1.unlikeSalesNoteReply);
exports.default = router;
