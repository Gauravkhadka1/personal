"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server\src\routes\SystemUpdateRoutes.ts
const express_1 = __importDefault(require("express"));
const systemUpdateController_1 = require("../controllers/systemUpdateController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Create a new update
router.post("/", authMiddleware_1.authenticateToken, systemUpdateController_1.createSystemUpdate);
// Get all updates (for admin)
router.get("/", authMiddleware_1.authenticateToken, systemUpdateController_1.getSystemUpdates);
// Update an update
router.put("/:id", authMiddleware_1.authenticateToken, systemUpdateController_1.updateSystemUpdate);
// Delete an update
router.delete("/:id", authMiddleware_1.authenticateToken, systemUpdateController_1.deleteSystemUpdate);
exports.default = router;
