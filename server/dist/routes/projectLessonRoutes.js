"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectLessonController_1 = require("../controllers/projectLessonController");
const router = express_1.default.Router();
// GET routes
router.get("/", projectLessonController_1.getProjectLessons); // Get all lessons with filters
router.get("/statistics", projectLessonController_1.getLessonStatistics); // Get lesson statistics
router.get("/:id", projectLessonController_1.getProjectLessonById); // Get single lesson by ID
router.get("/client/:clientId", projectLessonController_1.getLessonsByClientId); // Get lessons by client ID
// POST routes
router.post("/", projectLessonController_1.createProjectLesson); // Create new lesson
router.post("/bulk", projectLessonController_1.bulkCreateProjectLessons); // Bulk create lessons
// PUT routes
router.put("/:id", projectLessonController_1.updateProjectLesson); // Update lesson by ID
// DELETE routes
router.delete("/:id", projectLessonController_1.deleteProjectLesson); // Delete lesson by ID
exports.default = router;
