import { ChevronDown, ChevronUp, Plus } from "lucide-react";

interface SubtaskCountProps {
  completed: number;
  total: number;
  onAddSubtask: () => void;
  onToggleSubtasks: () => void;
  isSubtasksOpen: boolean;
}

const TinyProgressCircle = ({ percentage }: { percentage: number }) => {
  const radius = 7; // Smaller radius for h-5/w-5
  const strokeWidth = 3; // Thick stroke (visually ~12px)
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg className="h-6 w-6" viewBox="0 0 20 20">
      {/* Background track (light gray) */}
      <circle
        cx="10"
        cy="10"
        r={radius}
        fill="transparent"
        stroke="#e5e7eb" // bg-gray-200
        strokeWidth={strokeWidth}
      />
      {/* Progress indicator (green) */}
      <circle
        cx="10"
        cy="10"
        r={radius}
        fill="transparent"
        stroke="#22C55E" // text-green-500
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round" // Rounded line ends
        transform="rotate(-90 10 10)" // Start progress from top
      />
    </svg>
  );
};

const SubtaskCount = ({
  completed,
  total,
  onAddSubtask,
  onToggleSubtasks,
  isSubtasksOpen,
}: SubtaskCountProps) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {/* Custom SVG Progress Circle */}
        <TinyProgressCircle percentage={percentage} />

        {/* Subtask count */}
        <span className="text-sm font-normal text-gray-700 dark:text-gray-400">
          {completed}/{total} Subtasks
        </span>

        {/* Add subtask button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddSubtask();
          }}
          className="flex h-5 w-5 items-center justify-center rounded-full text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Plus size={14} /> {/* Slightly smaller icon for h-5 */}
        </button>
      </div>

      {/* Toggle subtasks button */}
      <button
        onClick={onToggleSubtasks}
        className="flex h-5 w-5 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        {isSubtasksOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
    </div>
  );
};

export default SubtaskCount;