"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const lessonCategoryController_1 = require("../controllers/lessonCategoryController");
const lessonController_1 = require("../controllers/lessonController");
const router = express_1.default.Router();
// All routes require authentication
router.use(authMiddleware_1.authenticateToken);
// ============ CATEGORY ROUTES ============
router.get("/categories", lessonCategoryController_1.getCategories);
router.get("/categories/:id", lessonCategoryController_1.getCategoryById);
router.post("/categories", lessonCategoryController_1.createCategory);
router.put("/categories/:id", lessonCategoryController_1.updateCategory);
router.delete("/categories/:id", lessonCategoryController_1.deleteCategory);
// ============ LESSON ROUTES ============
router.get("/", lessonController_1.getLessons);
router.get("/:id", lessonController_1.getLessonById);
router.post("/", lessonController_1.createLesson);
router.put("/:id", lessonController_1.updateLesson);
router.delete("/:id", lessonController_1.deleteLesson);
router.get("/category/:categoryId", lessonController_1.getLessonsByCategory);
exports.default = router;
