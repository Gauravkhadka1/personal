import { useState, useEffect } from "react";
import {
  useGetTasksQuery,
  useGetUsersQuery,
  useUpdateTaskStatusMutation,
  useCreateTaskMutation,
  useGetClientsQuery,
  useGetClientByIdQuery,
  useDeleteTaskMutation,
  useAddCommentToTaskMutation,
  useCreateSubtaskMutation,
  useGetSubtasksQuery,
} from "@/state/api";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Activity,
  ArrowRight,
  EllipsisVertical,
  MessageSquare,
  Plus,
  User,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  CirclePlus,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import CreateTask from "@/components/Task/CreateTask";
import Link from "next/link";
import Image from "next/image";
import SubtaskForm from "@/components/SubTask/CreateSubtask";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UserProfileCard from "@/components/UserProfileCard";
import TaskCard from "@/components/Task/TaskCard";

type Status = "To Do" | "Work In Progress" | "QA" | "Completed";

type BoardProps = {
  id: string;
  setIsCreateTaskOpen: (isOpen: boolean) => void;
};

interface ActivityLog {
  id: number;
  action: string;
  details: string | null;
  timestamp: string;
  userId: number;
  user?: {
    username?: string;
  };
}

interface User {
  userId: number;
  username: string;
  firstname: string;
  lastname: string;
  profilePictureUrl?: string;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: Status;
  priority: string | null;
  tags: string | null;
  startDate: string | null;
  dueDate: string | null;
  clientId: number;
  assignedBy: string | null;
  assignedUsers?: User[];
  comments?: Comment[];
  activityLogs?: ActivityLog[];
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  user?: {
    username?: string;
  };
}

const taskStatus: Status[] = ["To Do", "Work In Progress", "QA", "Completed"];

const BoardView = ({ id, setIsCreateTaskOpen }: BoardProps) => {
  const { user } = useAuth();
  const userId = user?.id;
  const isAdmin = user?.role === "ADMIN";
  const { data: clients } = useGetClientsQuery();
  const {
    data: tasksData, // Rename to tasksData to be more descriptive
    isLoading,
    error,
    refetch: refetchTasks,
  } = useGetTasksQuery({ clientId: Number(id) });

  const { refetch: refetchClients } = useGetClientByIdQuery(Number(id));

  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [createTask] = useCreateTaskMutation();

  const moveTask = async (taskId: number, toStatus: Status) => {
    if (!userId) {
      console.error("No authenticated user found");
      return;
    }

    try {
      await updateTaskStatus({
        taskId,
        status: toStatus,
        updatedBy: userId,
      }).unwrap();
      toast.success(`Task status updated to ${toStatus}`);
      await Promise.all([refetchTasks(), refetchClients()]);
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error occurred while fetching tasks</div>;

  // Extract tasks array from the response data
  const tasks = tasksData?.tasks || [];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        {taskStatus.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasks.filter(task => !task.parentTaskId)} // Use the extracted array
            moveTask={moveTask}
            setIsCreateTaskOpen={setIsCreateTaskOpen}
            isAdmin={isAdmin}
            clients={clients}
          />
        ))}
      </div>
    </DndProvider>
  );
};

type TaskColumnProps = {
  status: Status;
  tasks: any[];
  moveTask: (taskId: number, toStatus: Status) => void;
  setIsCreateTaskOpen: (isOpen: boolean) => void;
  isAdmin: boolean;
  clients?: any[];
};

const TaskColumn = ({
  status,
  tasks,
  moveTask,
  setIsCreateTaskOpen,
  isAdmin,
  clients,
}: TaskColumnProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "task",
    drop: (item: { id: number }) => moveTask(item.id, status),
    collect: (monitor: any) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const tasksCount = tasks.filter((task) => task.status === status).length;

  const statusColor: Record<Status, string> = {
    "To Do": "bg-blue-50 dark:bg-primary-dark",
    "Work In Progress": "bg-yellow-50 dark:bg-primary-dark",
    QA: "bg-purple-50 dark:bg-primary-dark",
    Completed: "bg-green-50 dark:bg-primary-dark",
  };

  const statusBorderColor: Record<Status, string> = {
    "To Do": "border-blue-100 dark:border-gray-800",
    "Work In Progress": "border-yellow-100 dark:border-gray-800",
    QA: "border-purple-100 dark:border-gray-800",
    Completed: "border-green-100 dark:border-gray-800",
  };

  return (
    <div
      ref={(instance) => {
        drop(instance);
      }}
      className={`flex h-[80vh] flex-col justify-between rounded-lg py-2 xl:px-2 ${statusColor[status]} ${statusBorderColor[status]} border ${isOver ? "ring-2 ring-blue-500 dark:ring-blue-400/50" : ""}`}
    >
      {/* Header */}
      <div
        className={`mb-3 flex w-full items-center justify-between rounded-t-lg border-b px-4 py-4 ${statusColor[status]} ${statusBorderColor[status]}`}
      >
        <h3 className="flex items-center text-base font-semibold dark:text-gray-300">
          {status}{" "}
          <span
            className="ml-2 inline-block rounded-full bg-gray-200 p-1 text-center text-sm leading-none dark:bg-dark-tertiary"
            style={{ width: "1.5rem", height: "1.5rem" }}
          >
            {tasksCount}
          </span>
        </h3>
        <div className="flex items-center gap-1">
          <button
            className="flex h-6 w-6 items-center justify-center rounded bg-gray-200 dark:bg-dark-tertiary dark:text-white"
            onClick={() => setIsCreateTaskOpen(true)}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="custom-scrollbar flex-grow overflow-y-auto px-2">
        {tasks
          .filter((task) => task.status === status)
          .map((task) => (
            <div key={task.id} className="relative">
              <TaskCard
                task={task}
                getClientName={(clientId) => {
                  const client = clients?.find((c) => c.id === clientId);
                  return (
                    client?.domainName ||
                    client?.companyName ||
                    "Unknown Client"
                  );
                }}
              />
            </div>
          ))}
      </div>
    </div>
  );
};

type TaskProps = {
  task: Task;
  isAdmin: boolean;
};

export default BoardView;
