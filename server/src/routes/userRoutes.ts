import express from "express";
import { createUser, loginUser, getUsers, getUserByEmail, deleteUser, changePassword, getCurrentUser, uploadProfilePicture } from "../controllers/userController";
import { authenticateToken } from "../middleware/authMiddleware";
import { profilePictureUpload } from "../utils/upload";

const router = express.Router();

router.get("/me", authenticateToken, getCurrentUser);

// Create a new user
router.post("/",  createUser);

// Login user
router.post("/login", loginUser);  // <-- Add this line

// Get all userss
router.get("/", authenticateToken, getUsers);



// Get a user by email
router.get("/:email", authenticateToken, getUserByEmail);


// Delete a user by email
router.delete("/:email", authenticateToken, deleteUser);

router.post("/:userId/change-password", authenticateToken, changePassword);



// Add this to your userRoutes.ts
router.put(
  "/:userId",
  authenticateToken,
  profilePictureUpload,
  uploadProfilePicture
);
export default router;

