import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controllers/lessonCategoryController";
import {
  getLessons,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonsByCategory
} from "../controllers/lessonController";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ============ CATEGORY ROUTES ============
router.get("/categories", getCategories);
router.get("/categories/:id", getCategoryById);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// ============ LESSON ROUTES ============
router.get("/", getLessons);
router.get("/:id", getLessonById);
router.post("/", createLesson);
router.put("/:id", updateLesson);
router.delete("/:id", deleteLesson);
router.get("/category/:categoryId", getLessonsByCategory);

export default router;