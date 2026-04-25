"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const noteController_1 = require("../controllers/noteController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Create a new note
router.post("/public", authMiddleware_1.authenticateToken, noteController_1.createNote);
// Create a private note
router.post("/private", authMiddleware_1.authenticateToken, noteController_1.createNote);
// Get all notes (for admin)
router.get("/", authMiddleware_1.authenticateToken, noteController_1.getNotes);
// Get public notes (no auth needed)
router.get("/public", noteController_1.getPublicNotes);
// Get user's notes
router.get("/user", authMiddleware_1.authenticateToken, noteController_1.getUserNotes);
// Get a specific note
router.get("/:id", authMiddleware_1.authenticateToken, noteController_1.getNoteById);
// Update a note
router.put("/:id", authMiddleware_1.authenticateToken, noteController_1.updateNote);
router.put("/replies/:id", authMiddleware_1.authenticateToken, noteController_1.updateNoteReply);
router.delete("/replies/:id", authMiddleware_1.authenticateToken, noteController_1.deleteNoteReply);
// Delete a note
router.delete("/:id", authMiddleware_1.authenticateToken, noteController_1.deleteNote);
// Add these to your noteRoutes.ts
router.post("/:id/like", authMiddleware_1.authenticateToken, noteController_1.likeNote);
router.post("/:id/unlike", authMiddleware_1.authenticateToken, noteController_1.unlikeNote);
router.post("/:id/replies", authMiddleware_1.authenticateToken, noteController_1.createNoteReply);
router.post("/replies/:id/like", authMiddleware_1.authenticateToken, noteController_1.likeNoteReply);
router.post("/replies/:id/unlike", authMiddleware_1.authenticateToken, noteController_1.unlikeNoteReply);
exports.default = router;
