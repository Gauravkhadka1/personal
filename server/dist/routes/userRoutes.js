"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const upload_1 = require("../utils/upload");
const router = express_1.default.Router();
router.get("/me", authMiddleware_1.authenticateToken, userController_1.getCurrentUser);
// Create a new user
router.post("/", userController_1.createUser);
// Login user
router.post("/login", userController_1.loginUser); // <-- Add this line
// Get all userss
router.get("/", authMiddleware_1.authenticateToken, userController_1.getUsers);
// Get a user by email
router.get("/:email", authMiddleware_1.authenticateToken, userController_1.getUserByEmail);
// Delete a user by email
router.delete("/:email", authMiddleware_1.authenticateToken, userController_1.deleteUser);
router.post("/:userId/change-password", authMiddleware_1.authenticateToken, userController_1.changePassword);
// Add this to your userRoutes.ts
router.put("/:userId", authMiddleware_1.authenticateToken, upload_1.profilePictureUpload, userController_1.uploadProfilePicture);
exports.default = router;
