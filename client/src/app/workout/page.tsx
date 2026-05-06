// client/src/app/workout/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import {
  Dumbbell,
  TrendingUp,
  Calendar,
  Plus,
  X,
  Trash2,
  Activity,
  Target,
  BarChart3,
  Clock,
  Check,
  Edit3,
  Save,
} from "lucide-react";
import {
  useGetWorkoutPlanQuery,
  useCreateWorkoutDayMutation,
  useAddExerciseToDayMutation,
  useUpdateExerciseMutation,
  useDeleteExerciseMutation,
  useLogWorkoutMutation,
  useUpdateWorkoutLogMutation,
  useDeleteWorkoutLogMutation,
  useGetWorkoutReportQuery,
  WorkoutExercise,
  WorkoutDay,
} from "@/state/api";
import { useAuth } from "../../context/AuthContext";

const MUSCLE_GROUPS = [
  "Chest", "Tricep", "Back", "Bicep", "Shoulder", "Leg", "Abs", "Traps", "Forearm", "Cardio"
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WorkoutPage = () => {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [editingLog, setEditingLog] = useState<string | null>(null);
  
  // Form states
  const [newExercise, setNewExercise] = useState({
    name: "",
    muscleGroup: "Chest",
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: 0,
  });

  const [editLogForm, setEditLogForm] = useState({
    sets: 3,
    reps: 10,
    weight: 0,
  });

  // API hooks
  const { data: workoutPlan, isLoading, refetch: refetchPlan } = useGetWorkoutPlanQuery();
  const [createWorkoutDay] = useCreateWorkoutDayMutation();
  const [addExercise] = useAddExerciseToDayMutation();
  const [updateExercise] = useUpdateExerciseMutation();
  const [removeExercise] = useDeleteExerciseMutation(); // Renamed to avoid conflict
  const [logWorkout] = useLogWorkoutMutation();
  const [updateWorkoutLog] = useUpdateWorkoutLogMutation();
  const [deleteWorkoutLog] = useDeleteWorkoutLogMutation();
  const { data: workoutReport, refetch: refetchReport } = useGetWorkoutReportQuery({});

  // Set current day on mount
  useEffect(() => {
    const today = DAYS[new Date().getDay()];
    setSelectedDay(today);
  }, []);

  // Get current day's workout
  const currentDayWorkout = workoutPlan?.data?.find(d => d.dayName === selectedDay);

  const handleAddExercise = async () => {
    if (!newExercise.name || !currentDayWorkout) return;

    try {
      await addExercise({
        dayId: currentDayWorkout.id,
        ...newExercise,
      }).unwrap();
      setShowAddExercise(false);
      setNewExercise({ name: "", muscleGroup: "Chest", defaultSets: 3, defaultReps: 10, defaultWeight: 0 });
      refetchPlan();
    } catch (error) {
      console.error("Failed to add exercise:", error);
    }
  };

  const handleLogComplete = async (exerciseId: string, defaultSets: number, defaultReps: number, defaultWeight: number) => {
    try {
      await logWorkout({
        exerciseId,
        sets: defaultSets,
        reps: defaultReps,
        weight: defaultWeight,
        date: new Date().toISOString(),
      }).unwrap();
      refetchPlan();
      refetchReport();
    } catch (error) {
      console.error("Failed to log workout:", error);
    }
  };

  const handleUpdateLog = async (logId: string) => {
    try {
      await updateWorkoutLog({
        id: logId,
        ...editLogForm,
      }).unwrap();
      setEditingLog(null);
      refetchPlan();
      refetchReport();
    } catch (error) {
      console.error("Failed to update log:", error);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await deleteWorkoutLog(logId).unwrap();
      refetchPlan();
      refetchReport();
    } catch (error) {
      console.error("Failed to delete log:", error);
    }
  };

  // Handle exercise deletion
  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      await removeExercise(exerciseId).unwrap();
      refetchPlan();
      refetchReport();
    } catch (error) {
      console.error("Failed to delete exercise:", error);
    }
  };

  // Create workout day if it doesn't exist
  const ensureWorkoutDay = async (dayName: string) => {
    const existing = workoutPlan?.data?.find(d => d.dayName === dayName);
    if (!existing) {
      try {
        await createWorkoutDay({ dayName }).unwrap();
        refetchPlan();
      } catch (error) {
        console.error("Failed to create workout day:", error);
      }
    }
  };

  // Handle custom log
  const handleCustomLog = (exerciseId: string, defaultSets: number, defaultReps: number, defaultWeight: number) => {
    setEditingLog('new');
    setEditLogForm({
      sets: defaultSets,
      reps: defaultReps,
      weight: defaultWeight,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-white">
              Workout Tracker
            </h1>
            <p className="text-gray-300">
              Track your workouts and progress
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowReport(!showReport)}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            >
              <BarChart3 className="h-5 w-5" />
              {showReport ? "View Plan" : "View Report"}
            </button>
          </div>
        </div>

        {/* Day Selector */}
        <div className="mb-8 grid grid-cols-7 gap-2">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => {
                setSelectedDay(day);
                ensureWorkoutDay(day);
              }}
              className={`rounded-lg p-4 text-center transition-all ${
                selectedDay === day
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <p className="text-sm font-medium">{day.substring(0, 3)}</p>
              <p className="text-xs opacity-75">{day}</p>
            </button>
          ))}
        </div>

        {showReport ? (
          // Report View
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 shadow-lg">
                <Activity className="mb-3 h-8 w-8 text-blue-200" />
                <p className="text-sm text-blue-200">Total Workouts</p>
                <p className="text-3xl font-bold text-white">
                  {workoutReport?.data?.summary?.totalWorkouts || 0}
                </p>
              </div>
              
              <div className="rounded-xl bg-gradient-to-br from-green-600 to-green-700 p-6 shadow-lg">
                <Target className="mb-3 h-8 w-8 text-green-200" />
                <p className="text-sm text-green-200">Total Sets</p>
                <p className="text-3xl font-bold text-white">
                  {workoutReport?.data?.summary?.totalSets || 0}
                </p>
              </div>
              
              <div className="rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 p-6 shadow-lg">
                <TrendingUp className="mb-3 h-8 w-8 text-purple-200" />
                <p className="text-sm text-purple-200">Total Reps</p>
                <p className="text-3xl font-bold text-white">
                  {workoutReport?.data?.summary?.totalReps || 0}
                </p>
              </div>
              
              <div className="rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 p-6 shadow-lg">
                <TrendingUp className="mb-3 h-8 w-8 text-orange-200" />
                <p className="text-sm text-orange-200">Total Volume</p>
                <p className="text-3xl font-bold text-white">
                  {(workoutReport?.data?.summary?.totalVolume || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Muscle Group Stats */}
            <div className="rounded-xl bg-gray-800 p-6">
              <h3 className="mb-4 text-xl font-semibold text-white">By Muscle Group</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="pb-3 text-sm font-semibold text-gray-300">Muscle Group</th>
                      <th className="pb-3 text-sm font-semibold text-gray-300">Sets</th>
                      <th className="pb-3 text-sm font-semibold text-gray-300">Volume</th>
                      <th className="pb-3 text-sm font-semibold text-gray-300">Exercises</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workoutReport?.data?.byMuscleGroup?.map((group) => (
                      <tr key={group.muscleGroup} className="border-b border-gray-700">
                        <td className="py-3 text-white font-medium">{group.muscleGroup}</td>
                        <td className="py-3 text-gray-300">{group.totalSets}</td>
                        <td className="py-3 text-gray-300">{group.totalVolume.toLocaleString()}</td>
                        <td className="py-3 text-gray-300">{group.exercises.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Logs */}
            <div className="rounded-xl bg-gray-800 p-6">
              <h3 className="mb-4 text-xl font-semibold text-white">Recent Logs</h3>
              <div className="space-y-3">
                {workoutReport?.data?.recentLogs?.map((log) => (
                  <div key={log.id} className="rounded-lg bg-gray-700 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">{log.exercise.name}</p>
                        <p className="text-sm text-gray-400">
                          {log.exercise.muscleGroup} • {log.exercise.workoutDay.dayName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white">{log.sets} sets × {log.reps} reps</p>
                        <p className="text-sm text-gray-400">{log.weight} kg</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Workout Plan View
          <div className="rounded-xl bg-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedDay}'s Workout
              </h2>
              {currentDayWorkout && (
                <button
                  onClick={() => setShowAddExercise(true)}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  <Plus className="h-5 w-5" />
                  Add Exercise
                </button>
              )}
            </div>

            {currentDayWorkout && currentDayWorkout.exercises.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(
                  currentDayWorkout.exercises.reduce((groups: any, exercise) => {
                    if (!groups[exercise.muscleGroup]) {
                      groups[exercise.muscleGroup] = [];
                    }
                    groups[exercise.muscleGroup].push(exercise);
                    return groups;
                  }, {})
                ).map(([muscleGroup, exercises]: [string, any]) => (
                  <div key={muscleGroup} className="rounded-lg bg-gray-700 p-4">
                    <h3 className="mb-3 text-lg font-semibold text-green-400">
                      {muscleGroup}
                    </h3>
                    <div className="space-y-3">
                      {exercises.map((exercise: WorkoutExercise) => {
                        const todayLog = exercise.workoutLogs?.[0];
                        return (
                          <div key={exercise.id} className="rounded-lg bg-gray-600 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Dumbbell className="h-5 w-5 text-blue-400" />
                                <span className="text-white font-medium">
                                  {exercise.name}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteExercise(exercise.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {todayLog ? (
                              // Show logged workout
                              <div className="bg-gray-500 rounded-lg p-3">
                                {editingLog === todayLog.id ? (
                                  // Edit mode
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="text-xs text-gray-300">Sets</label>
                                        <input
                                          type="number"
                                          value={editLogForm.sets}
                                          onChange={(e) => setEditLogForm({ ...editLogForm, sets: parseInt(e.target.value) })}
                                          className="w-full rounded bg-gray-600 px-2 py-1 text-white text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-300">Reps</label>
                                        <input
                                          type="number"
                                          value={editLogForm.reps}
                                          onChange={(e) => setEditLogForm({ ...editLogForm, reps: parseInt(e.target.value) })}
                                          className="w-full rounded bg-gray-600 px-2 py-1 text-white text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs text-gray-300">Weight</label>
                                        <input
                                          type="number"
                                          value={editLogForm.weight}
                                          onChange={(e) => setEditLogForm({ ...editLogForm, weight: parseFloat(e.target.value) })}
                                          className="w-full rounded bg-gray-600 px-2 py-1 text-white text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleUpdateLog(todayLog.id)}
                                        className="flex-1 rounded bg-green-600 py-1 text-xs text-white hover:bg-green-700"
                                      >
                                        <Save className="inline h-3 w-3 mr-1" />
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingLog(null)}
                                        className="flex-1 rounded bg-gray-600 py-1 text-xs text-white hover:bg-gray-500"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  // Display mode
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Check className="h-5 w-5 text-green-400" />
                                        <span className="text-white">
                                          {todayLog.sets} sets × {todayLog.reps} reps @ {todayLog.weight} kg
                                        </span>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => {
                                            setEditingLog(todayLog.id);
                                            setEditLogForm({
                                              sets: todayLog.sets,
                                              reps: todayLog.reps,
                                              weight: todayLog.weight,
                                            });
                                          }}
                                          className="text-blue-400 hover:text-blue-300"
                                        >
                                          <Edit3 className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteLog(todayLog.id)}
                                          className="text-red-400 hover:text-red-300"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                    {/* Add another set */}
                                    <button
                                      onClick={() => handleLogComplete(exercise.id, todayLog.sets + 1, todayLog.reps, todayLog.weight)}
                                      className="w-full rounded bg-blue-600 py-1 text-xs text-white hover:bg-blue-700"
                                    >
                                      <Plus className="inline h-3 w-3 mr-1" />
                                      Add Set
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              // Not logged yet
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleLogComplete(
                                    exercise.id,
                                    exercise.defaultSets,
                                    exercise.defaultReps,
                                    exercise.defaultWeight
                                  )}
                                  className="flex-1 rounded-lg bg-green-600 py-2 text-sm text-white hover:bg-green-700"
                                >
                                  <Check className="inline h-4 w-4 mr-1" />
                                  Complete with Default
                                </button>
                                <button
                                  onClick={() => handleCustomLog(
                                    exercise.id,
                                    exercise.defaultSets,
                                    exercise.defaultReps,
                                    exercise.defaultWeight
                                  )}
                                  className="flex-1 rounded-lg bg-blue-600 py-2 text-sm text-white hover:bg-blue-700"
                                >
                                  <Edit3 className="inline h-4 w-4 mr-1" />
                                  Custom
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Dumbbell className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                <p className="text-gray-400">
                  {currentDayWorkout 
                    ? "No exercises yet. Add your first exercise!" 
                    : `No workout plan for ${selectedDay}. Click the day button to create it.`}
                </p>
                {currentDayWorkout && (
                  <button
                    onClick={() => setShowAddExercise(true)}
                    className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
                  >
                    Add Exercise
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add Exercise Modal */}
        {showAddExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-xl bg-gray-800 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Add Exercise</h3>
                <button
                  onClick={() => setShowAddExercise(false)}
                  className="rounded-lg p-2 hover:bg-gray-700"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-300">Exercise Name</label>
                  <input
                    type="text"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                    className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white"
                    placeholder="e.g., Bench Press"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-300">Muscle Group</label>
                  <select
                    value={newExercise.muscleGroup}
                    onChange={(e) => setNewExercise({ ...newExercise, muscleGroup: e.target.value })}
                    className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white"
                  >
                    {MUSCLE_GROUPS.map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-sm text-gray-300">Sets</label>
                    <input
                      type="number"
                      value={newExercise.defaultSets}
                      onChange={(e) => setNewExercise({ ...newExercise, defaultSets: parseInt(e.target.value) })}
                      className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-300">Reps</label>
                    <input
                      type="number"
                      value={newExercise.defaultReps}
                      onChange={(e) => setNewExercise({ ...newExercise, defaultReps: parseInt(e.target.value) })}
                      className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-300">Weight (kg)</label>
                    <input
                      type="number"
                      value={newExercise.defaultWeight}
                      onChange={(e) => setNewExercise({ ...newExercise, defaultWeight: parseFloat(e.target.value) })}
                      className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white"
                      step="0.5"
                      min="0"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddExercise}
                  className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700"
                >
                  Add Exercise
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutPage;