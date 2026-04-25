"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checklistController_1 = require("../controllers/checklistController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Create a new checklist
router.post("/public", authMiddleware_1.authenticateToken, checklistController_1.createChecklist);
router.post("/private", authMiddleware_1.authenticateToken, checklistController_1.createChecklist);
// Get all checklists (for admin)
router.get("/", authMiddleware_1.authenticateToken, checklistController_1.getChecklists);
// Get public checklists (no auth needed)
router.get("/public", checklistController_1.getPublicChecklists);
// Get user's checklists
router.get("/user", authMiddleware_1.authenticateToken, checklistController_1.getUserChecklists);
// Get a specific checklist
router.get("/:id", authMiddleware_1.authenticateToken, checklistController_1.getChecklistById);
// Update a checklist
router.put("/:id", authMiddleware_1.authenticateToken, checklistController_1.updateChecklist);
// Reorder checklists
router.patch("/reorder", authMiddleware_1.authenticateToken, checklistController_1.reorderChecklists); // Add this endpoint
// Delete a checklist
router.delete("/:id", authMiddleware_1.authenticateToken, checklistController_1.deleteChecklist);
exports.default = router;
