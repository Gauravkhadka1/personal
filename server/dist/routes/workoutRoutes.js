"use strict";
// server/src/routes/workoutRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const workoutController_1 = require("../controllers/workoutController");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
// Workout day management
router.post("/day", workoutController_1.createWorkoutDay);
router.get("/plan", workoutController_1.getWorkoutPlan);
router.get("/day/:dayName", workoutController_1.getWorkoutByDay);
// Exercise management
router.post("/day/:dayId/exercise", workoutController_1.addExerciseToDay);
router.put("/exercise/:id", workoutController_1.updateExercise);
router.delete("/exercise/:id", workoutController_1.deleteExercise);
// Workout logging
router.post("/log/:exerciseId", workoutController_1.logWorkout);
router.get("/logs", workoutController_1.getWorkoutLogs);
router.put("/log/:id", workoutController_1.updateWorkoutLog);
router.delete("/log/:id", workoutController_1.deleteWorkoutLog);
// Reports
router.get("/report", workoutController_1.getWorkoutReport);
exports.default = router;
