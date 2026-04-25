import { useState, useEffect } from "react";
import { Play, Pause, Square } from "lucide-react";
import {
  useStartTimerMutation,
  usePauseTimerMutation,
  useStopTimerMutation,
  useGetTimerStatusQuery,
} from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import TimerConfirmationDialog from "../SubTask/TimerConfirmationDialog";

interface TimerStatus {
  isTimerRunning: boolean;
  timerStartTime: string | null;
  totalTimeSpent: number;
  currentElapsed: number;
  totalElapsed: number;
}

interface TaskTimerProps {
  taskId: number;
  initialIsRunning?: boolean;
  initialTimerStartTime?: string | null;
  initialTimeSpent?: number;
  taskTitle: string;
}

const TaskTimer = ({
  taskId,
  initialIsRunning = false,
  initialTimerStartTime = null,
  initialTimeSpent = 0,
  taskTitle,
}: TaskTimerProps) => {
  const { user } = useAuth();
  const [startTimer] = useStartTimerMutation();
  const [pauseTimer] = usePauseTimerMutation();
  const [stopTimer] = useStopTimerMutation();

  const [confirmationDialog, setConfirmationDialog] = useState({
    isOpen: false,
    runningTaskTitle: "",
    runningTaskId: 0,
  });

  const [localTimer, setLocalTimer] = useState<TimerStatus>({
    isTimerRunning: initialIsRunning,
    timerStartTime: initialTimerStartTime,
    totalTimeSpent: initialTimeSpent,
    currentElapsed: 0,
    totalElapsed: initialTimeSpent,
  });

  const [isHovered, setIsHovered] = useState(false);
  const [localStartTime, setLocalStartTime] = useState<Date | null>(null);

  const { data: timerStatus, refetch: refetchTimer } = useGetTimerStatusQuery(
    taskId
  );

  // Update local timer state when timerStatus changes
  useEffect(() => {
    if (timerStatus) {
      setLocalTimer(timerStatus);
      
      // When timer starts on server, set local start time to current time
      if (timerStatus.isTimerRunning && !localStartTime) {
        setLocalStartTime(new Date());
      } else if (!timerStatus.isTimerRunning) {
        setLocalStartTime(null);
      }
    }
  }, [timerStatus]);

  // Update local state when initial props change
  useEffect(() => {
    setLocalTimer({
      isTimerRunning: initialIsRunning,
      timerStartTime: initialTimerStartTime,
      totalTimeSpent: initialTimeSpent,
      currentElapsed: 0,
      totalElapsed: initialTimeSpent,
    });
  }, [initialIsRunning, initialTimerStartTime, initialTimeSpent]);

  // Calculate current elapsed time for running timers
  useEffect(() => {
    if (localTimer.isTimerRunning && localStartTime) {
      const interval = setInterval(() => {
        const currentTime = new Date();
        
        // Use local start time instead of server time to avoid timezone issues
        const currentElapsed = Math.floor((currentTime.getTime() - localStartTime.getTime()) / 1000);
        
        setLocalTimer(prev => ({
          ...prev,
          currentElapsed,
          totalElapsed: prev.totalTimeSpent + currentElapsed,
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [localTimer.isTimerRunning, localStartTime, localTimer.totalTimeSpent]);

  const formatTime = (seconds: number): string => {
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;

    // Show negative sign if seconds are negative
    const sign = seconds < 0 ? "-" : "";
    
    return `${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartTimer = async () => {
    try {
      const result = await startTimer({
        taskId,
        userId: Number(user?.userId),
      }).unwrap();

      // Set local start time immediately when starting timer
      setLocalStartTime(new Date());

      // If there are running timers, show confirmation dialog
      if (result.runningTimers && result.runningTimers.length > 0) {
        setConfirmationDialog({
          isOpen: true,
          runningTaskTitle: result.runningTimers[0].title,
          runningTaskId: result.runningTimers[0].id,
        });
        return;
      }

      refetchTimer();
      toast.success("Timer started");
    } catch (error: any) {
      console.error("Failed to start timer:", error);
      if (error.status === 409) {
        setConfirmationDialog({
          isOpen: true,
          runningTaskTitle: error.data.runningTimers[0].title,
          runningTaskId: error.data.runningTimers[0].id,
        });
      } else {
        toast.error(error.data?.message || "Failed to start timer");
      }
    }
  };

  const handleConfirmSwitch = async () => {
    try {
      await stopTimer({
        taskId: confirmationDialog.runningTaskId,
        userId: Number(user?.userId),
      }).unwrap();

      await startTimer({
        taskId,
        userId: Number(user?.userId),
      }).unwrap();

      // Set local start time when switching timers
      setLocalStartTime(new Date());

      refetchTimer();
      toast.success("Timer switched successfully");
    } catch (error: any) {
      console.error("Failed to switch timer:", error);
      toast.error("Failed to switch timer");
    } finally {
      setConfirmationDialog({
        isOpen: false,
        runningTaskTitle: "",
        runningTaskId: 0,
      });
    }
  };

  const handleCancelSwitch = () => {
    setConfirmationDialog({
      isOpen: false,
      runningTaskTitle: "",
      runningTaskId: 0,
    });
  };

  const handlePauseTimer = async () => {
    try {
      await pauseTimer({
        taskId,
        userId: Number(user?.userId),
      }).unwrap();
      setLocalStartTime(null); // Clear local start time when pausing
      refetchTimer();
      toast.success("Timer paused");
    } catch (error: any) {
      console.error("Failed to pause timer:", error);
      toast.error(error.data?.message || "Failed to pause timer");
    }
  };

  const handleStopTimer = async () => {
    try {
      await stopTimer({
        taskId,
        userId: Number(user?.userId),
      }).unwrap();
      setLocalStartTime(null); // Clear local start time when stopping
      refetchTimer();
      toast.success("Timer stopped");
    } catch (error: any) {
      console.error("Failed to stop timer:", error);
      toast.error(error.data?.message || "Failed to stop timer");
    }
  };

  return (
    <>
      <div 
        className="relative flex items-center justify-between gap-2 bg-gray-50 rounded-md dark:bg-transparent group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Timer display - hidden when hovered */}
        <div className={`flex-1 min-w-[85px] text-center transition-opacity duration-200 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
          <div className="text-sm font-mono text-gray-700 dark:text-gray-300">
            {formatTime(localTimer.totalElapsed)}
          </div>
        </div>

        {/* Timer controls - shown when hovered */}
        <div className={`absolute inset-0 flex items-center justify-center gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {!localTimer.isTimerRunning ? (
            <button
              onClick={handleStartTimer}
              className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors dark:hover:bg-green-900/30"
              title="Start Timer"
            >
              <Play size={16} />
            </button>
          ) : (
            <button
              onClick={handlePauseTimer}
              className="p-1.5 text-yellow-600 hover:bg-yellow-100 rounded-md transition-colors dark:hover:bg-yellow-900/30"
              title="Pause Timer"
            >
              <Pause size={16} />
            </button>
          )}
          
          <button
            onClick={handleStopTimer}
            disabled={!localTimer.isTimerRunning && localTimer.totalTimeSpent === 0}
            className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-red-900/30"
            title="Stop Timer"
          >
            <Square size={16} />
          </button>
        </div>
      </div>

      <TimerConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={handleCancelSwitch}
        onConfirm={handleConfirmSwitch}
        runningTaskTitle={confirmationDialog.runningTaskTitle}
      />
    </>
  );
};

export default TaskTimer;