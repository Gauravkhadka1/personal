// server/src/controllers/workoutController.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create workout day
export const createWorkoutDay = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { dayName } = req.body;

    if (!dayName) {
      res.status(400).json({ message: "Day name is required" });
      return;
    }

    // Check if day already exists for user
    const existingDay = await prisma.workoutDay.findFirst({
      where: { userId: Number(userId), dayName }
    });

    if (existingDay) {
      res.status(400).json({ message: "Workout day already exists" });
      return;
    }

    const workoutDay = await prisma.workoutDay.create({
      data: {
        dayName,
        userId: Number(userId)
      },
      include: { exercises: true }
    });

    res.status(201).json({ data: workoutDay });
  } catch (error: any) {
    console.error("Error creating workout day:", error);
    res.status(500).json({ message: `Error creating workout day: ${error.message}` });
  }
};

// Get workout plan
export const getWorkoutPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    
    const workoutDays = await prisma.workoutDay.findMany({
      where: { userId: Number(userId) },
      include: {
        exercises: {
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { dayName: 'asc' }
    });

    res.json({ data: workoutDays });
  } catch (error: any) {
    console.error("Error fetching workout plan:", error);
    res.status(500).json({ message: `Error fetching workout plan: ${error.message}` });
  }
};

// Get workout for specific day
export const getWorkoutByDay = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { dayName } = req.params;
    
    const workoutDay = await prisma.workoutDay.findFirst({
      where: { 
        userId: Number(userId),
        dayName: { equals: dayName, mode: 'insensitive' }
      },
      include: {
        exercises: {
          include: {
            workoutLogs: {
              where: {
                date: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)),
                  lte: new Date(new Date().setHours(23, 59, 59, 999))
                }
              },
              orderBy: { date: 'desc' }
            }
          },
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!workoutDay) {
      // Return empty day instead of 404
      res.json({ data: { dayName, exercises: [] } });
      return;
    }

    res.json({ data: workoutDay });
  } catch (error: any) {
    console.error("Error fetching workout day:", error);
    res.status(500).json({ message: `Error fetching workout day: ${error.message}` });
  }
};

// Add exercise to day
export const addExerciseToDay = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { dayId } = req.params;
    const { name, muscleGroup, defaultSets, defaultReps, defaultWeight } = req.body;

    if (!name || !muscleGroup) {
      res.status(400).json({ message: "Name and muscle group are required" });
      return;
    }

    const workoutDay = await prisma.workoutDay.findFirst({
      where: { id: dayId, userId: Number(userId) }
    });

    if (!workoutDay) {
      res.status(404).json({ message: "Workout day not found" });
      return;
    }

    const exercise = await prisma.workoutExercise.create({
      data: {
        name,
        muscleGroup,
        defaultSets: defaultSets || 3,
        defaultReps: defaultReps || 10,
        defaultWeight: defaultWeight || 0,
        workoutDayId: dayId
      }
    });

    res.status(201).json({
      message: "Exercise added successfully",
      data: exercise
    });
  } catch (error: any) {
    console.error("Error adding exercise:", error);
    res.status(500).json({ message: `Error adding exercise: ${error.message}` });
  }
};

// Update exercise
export const updateExercise = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, muscleGroup, defaultSets, defaultReps, defaultWeight } = req.body;

    const exercise = await prisma.workoutExercise.findFirst({
      where: { id },
      include: { workoutDay: true }
    });

    if (!exercise || exercise.workoutDay.userId !== Number(userId)) {
      res.status(404).json({ message: "Exercise not found" });
      return;
    }

    const updatedExercise = await prisma.workoutExercise.update({
      where: { id },
      data: {
        name: name || exercise.name,
        muscleGroup: muscleGroup || exercise.muscleGroup,
        defaultSets: defaultSets !== undefined ? defaultSets : exercise.defaultSets,
        defaultReps: defaultReps !== undefined ? defaultReps : exercise.defaultReps,
        defaultWeight: defaultWeight !== undefined ? defaultWeight : exercise.defaultWeight,
      }
    });

    res.json({
      message: "Exercise updated successfully",
      data: updatedExercise
    });
  } catch (error: any) {
    console.error("Error updating exercise:", error);
    res.status(500).json({ message: `Error updating exercise: ${error.message}` });
  }
};

// Delete exercise
export const deleteExercise = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const exercise = await prisma.workoutExercise.findFirst({
      where: { id },
      include: { workoutDay: true }
    });

    if (!exercise || exercise.workoutDay.userId !== Number(userId)) {
      res.status(404).json({ message: "Exercise not found" });
      return;
    }

    await prisma.workoutExercise.delete({ where: { id } });
    res.json({ message: "Exercise deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting exercise:", error);
    res.status(500).json({ message: `Error deleting exercise: ${error.message}` });
  }
};

// Log workout
export const logWorkout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { exerciseId } = req.params;
    const { sets, reps, weight, notes, date } = req.body;

    if (!sets || !reps || weight === undefined) {
      res.status(400).json({ message: "Sets, reps, and weight are required" });
      return;
    }

    const exercise = await prisma.workoutExercise.findFirst({
      where: { id: exerciseId },
      include: { workoutDay: true }
    });

    if (!exercise || exercise.workoutDay.userId !== Number(userId)) {
      res.status(404).json({ message: "Exercise not found" });
      return;
    }

    const workoutLog = await prisma.workoutLog.create({
      data: {
        date: date ? new Date(date) : new Date(),
        sets,
        reps,
        weight,
        completed: true,
        notes,
        exerciseId,
        userId: Number(userId)
      }
    });

    res.status(201).json({
      message: "Workout logged successfully",
      data: workoutLog
    });
  } catch (error: any) {
    console.error("Error logging workout:", error);
    res.status(500).json({ message: `Error logging workout: ${error.message}` });
  }
};

// Get workout logs
export const getWorkoutLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { exerciseId, date, startDate, endDate } = req.query;

    const whereClause: any = { userId: Number(userId) };

    if (exerciseId) {
      whereClause.exerciseId = exerciseId as string;
    }

    if (date) {
      const queryDate = new Date(date as string);
      whereClause.date = {
        gte: new Date(queryDate.setHours(0, 0, 0, 0)),
        lte: new Date(queryDate.setHours(23, 59, 59, 999))
      };
    } else if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate as string);
      if (endDate) whereClause.date.lte = new Date(endDate as string);
    }

    const workoutLogs = await prisma.workoutLog.findMany({
      where: whereClause,
      include: {
        exercise: {
          include: {
            workoutDay: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ data: workoutLogs });
  } catch (error: any) {
    console.error("Error fetching workout logs:", error);
    res.status(500).json({ message: `Error fetching workout logs: ${error.message}` });
  }
};

// Get workout report
export const getWorkoutReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { startDate, endDate } = req.query;

    const whereClause: any = { userId: Number(userId) };

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate as string);
      if (endDate) whereClause.date.lte = new Date(endDate as string);
    }

    const workoutLogs = await prisma.workoutLog.findMany({
      where: whereClause,
      include: {
        exercise: {
          include: {
            workoutDay: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate statistics
    const totalWorkouts = new Set(workoutLogs.map(log => log.date.toISOString().split('T')[0])).size;
    const totalSets = workoutLogs.reduce((sum, log) => sum + log.sets, 0);
    const totalReps = workoutLogs.reduce((sum, log) => sum + (log.sets * log.reps), 0);
    const totalVolume = workoutLogs.reduce((sum, log) => sum + (log.sets * log.reps * log.weight), 0);

    // Group by muscle group
    const byMuscleGroup = workoutLogs.reduce((acc: any, log) => {
      const group = log.exercise.muscleGroup;
      if (!acc[group]) {
        acc[group] = { muscleGroup: group, totalSets: 0, totalVolume: 0, exercises: new Set() };
      }
      acc[group].totalSets += log.sets;
      acc[group].totalVolume += (log.sets * log.reps * log.weight);
      acc[group].exercises.add(log.exercise.name);
      return acc;
    }, {});

    const muscleGroupStats = Object.values(byMuscleGroup).map((group: any) => ({
      ...group,
      exercises: Array.from(group.exercises)
    }));

    // Group by day of week
    const byDayOfWeek = workoutLogs.reduce((acc: any, log) => {
      const dayName = log.exercise.workoutDay.dayName;
      if (!acc[dayName]) {
        acc[dayName] = { dayName, totalSets: 0, totalVolume: 0, workoutCount: 0 };
      }
      acc[dayName].totalSets += log.sets;
      acc[dayName].totalVolume += (log.sets * log.reps * log.weight);
      return acc;
    }, {});

    res.json({
      data: {
        summary: {
          totalWorkouts,
          totalSets,
          totalReps,
          totalVolume
        },
        byMuscleGroup: muscleGroupStats,
        byDayOfWeek: Object.values(byDayOfWeek),
        recentLogs: workoutLogs.slice(0, 10)
      }
    });
  } catch (error: any) {
    console.error("Error fetching workout report:", error);
    res.status(500).json({ message: `Error fetching workout report: ${error.message}` });
  }
};

// Update workout log
export const updateWorkoutLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { sets, reps, weight, completed, notes } = req.body;

    const workoutLog = await prisma.workoutLog.findFirst({
      where: { id, userId: Number(userId) }
    });

    if (!workoutLog) {
      res.status(404).json({ message: "Workout log not found" });
      return;
    }

    const updatedLog = await prisma.workoutLog.update({
      where: { id },
      data: {
        sets: sets !== undefined ? sets : workoutLog.sets,
        reps: reps !== undefined ? reps : workoutLog.reps,
        weight: weight !== undefined ? weight : workoutLog.weight,
        completed: completed !== undefined ? completed : workoutLog.completed,
        notes: notes !== undefined ? notes : workoutLog.notes,
      }
    });

    res.json({
      message: "Workout log updated successfully",
      data: updatedLog
    });
  } catch (error: any) {
    console.error("Error updating workout log:", error);
    res.status(500).json({ message: `Error updating workout log: ${error.message}` });
  }
};

// Delete workout log
export const deleteWorkoutLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const workoutLog = await prisma.workoutLog.findFirst({
      where: { id, userId: Number(userId) }
    });

    if (!workoutLog) {
      res.status(404).json({ message: "Workout log not found" });
      return;
    }

    await prisma.workoutLog.delete({ where: { id } });
    res.json({ message: "Workout log deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting workout log:", error);
    res.status(500).json({ message: `Error deleting workout log: ${error.message}` });
  }
};