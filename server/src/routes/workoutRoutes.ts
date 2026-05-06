// server/src/routes/workoutRoutes.ts

import express from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import {
  createWorkoutDay,
  getWorkoutPlan,
  getWorkoutByDay,
  addExerciseToDay,
  updateExercise,
  deleteExercise,
  logWorkout,
  getWorkoutLogs,
  getWorkoutReport,
  updateWorkoutLog,
  deleteWorkoutLog,
} from "../controllers/workoutController";

const router = express.Router();

router.use(authenticateToken);

// Workout day management
router.post("/day", createWorkoutDay);
router.get("/plan", getWorkoutPlan);
router.get("/day/:dayName", getWorkoutByDay);

// Exercise management
router.post("/day/:dayId/exercise", addExerciseToDay);
router.put("/exercise/:id", updateExercise);
router.delete("/exercise/:id", deleteExercise);

// Workout logging
router.post("/log/:exerciseId", logWorkout);
router.get("/logs", getWorkoutLogs);
router.put("/log/:id", updateWorkoutLog);
router.delete("/log/:id", deleteWorkoutLog);

// Reports
router.get("/report", getWorkoutReport);

export default router;