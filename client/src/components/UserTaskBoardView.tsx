"use client";
import { useEffect, useState } from "react";
import {
  useGetTasksByUserQuery,
  useUpdateTaskStatusMutation,
  useGetClientsQuery,
  useGetUsersQuery,
  useCreateTaskMutation,
  useAddCommentToTaskMutation,
  useCreateSubtaskMutation,
  useGetSubtasksQuery,
  useDeleteTaskMutation,
} from "@/state/api";
import { Task as TaskType, ClientType, Comment } from "@/state/api";
import React from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Activity,
  ArrowRight,
  EllipsisVertical,
  MessageSquareMore,
  Pencil,
  Plus,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  Trash2,
  Filter,
  X,
  Search,
  User,
} from "lucide-react";
import {
  format,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from "date-fns";
import Image from "next/image";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import SubtaskForm from "@/components/SubTask/CreateSubtask";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UserProfileCard from "@/components/UserProfileCard";
import CreateTask from "@/components/Task/CreateTask";
import { debounce } from "lodash";
import TaskCard from "@/components/Task/TaskCard";

type Status = "To Do" | "Work In Progress" | "QA" | "Completed";

interface UserTaskBoardViewProps {
  userId: number;
  activeTab: string;
  setActiveTab: (tabName: string) => void;
  setIsCreateTaskOpen: (isOpen: boolean) => void; // Add this
}

const taskStatus: Status[] = ["To Do", "Work In Progress", "QA", "Completed"];

const UserTaskBoardView = ({
  userId,
  activeTab,
  setActiveTab,
}: UserTaskBoardViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const {
    data: tasksData,
    isLoading,
    error,
    refetch,
  } = useGetTasksByUserQuery(
    {
      userId: Number(userId),
      search: debouncedSearchQuery,
    },
    {
      skip: !userId,
    },
  );

  const refetchTasks = () => {
    refetch();
  };

  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [createTask] = useCreateTaskMutation();
  const { data: clients } = useGetClientsQuery();
  const { data: users = [] } = useGetUsersQuery();

  // State for task creation and filtering
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<TaskType[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string | null>(
    null,
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Time filter options
  const timeFilterOptions = [
    { label: "Today", value: "today" },
    { label: "Last 7 Days", value: "last7days" },
    { label: "Last 30 Days", value: "last30days" },
  ];

  // Apply filters to tasks
  useEffect(() => {
    if (tasksData?.tasks) {
      // Changed from tasks to tasksData?.tasks
      let result = [...tasksData.tasks];

      // Apply user filter if any users are selected
      if (selectedUsers.length > 0) {
        result = result.filter((task) => {
          return task.assignedUsers?.some(
            (user) =>
              user.userId !== undefined && selectedUsers.includes(user.userId),
          );
        });
      }

      // Apply time filter
      if (selectedTimeFilter) {
        const now = new Date();
        result = result.filter((task) => {
          if (!task.dueDate) return false;
          const dueDate = new Date(task.dueDate);

          switch (selectedTimeFilter) {
            case "today":
              return (
                dueDate.getDate() === now.getDate() &&
                dueDate.getMonth() === now.getMonth() &&
                dueDate.getFullYear() === now.getFullYear()
              );
            case "last7days":
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(now.getDate() - 7);
              return dueDate >= sevenDaysAgo && dueDate <= now;
            case "last30days":
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(now.getDate() - 30);
              return dueDate >= thirtyDaysAgo && dueDate <= now;
            default:
              return true;
          }
        });
      }

      // Apply search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter((task) => {
          const clientName =
            clients
              ?.find((p) => p.id === task.clientId)
              ?.domainName.toLowerCase() || "";
          return (
            task.title?.toLowerCase().includes(query) ||
            (task.description?.toLowerCase().includes(query) ?? false) ||
            task.assignedUsers?.some(
              (user) =>
                (user.username?.toLowerCase().includes(query) ?? false) ||
                (user.firstname?.toLowerCase().includes(query) ?? false) ||
                (user.lastname?.toLowerCase().includes(query) ?? false),
            ) ||
            clientName.includes(query)
          );
        });
      }

      setFilteredTasks(result);
    }
  }, [
    tasksData?.tasks,
    selectedUsers,
    searchQuery,
    clients,
    selectedTimeFilter,
  ]);

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const clearFilters = () => {
    setSelectedUsers([]);
    setSearchQuery("");
    setSelectedTimeFilter(null);
  };

  const moveTask = (taskId: number, toStatus: Status) => {
    // Find the task being moved from all tasks - FIX HERE
    const taskToMove = tasksData?.tasks?.find((task) => task.id === taskId); // Changed from tasks to tasksData?.tasks
    if (!taskToMove) {
      toast.error("Task not found");
      return;
    }

    if (!taskToMove.startDate || !taskToMove.dueDate) {
      toast.error("Task must have both start and due dates to change status");
      return;
    }

    // Check if task is overdue
    const isOverdue =
      taskToMove.dueDate && new Date(taskToMove.dueDate) < new Date();

    // Special case: Allow moving from QA to Completed even if overdue
    const isUnderReviewToCompleted =
      taskToMove.status === "QA" && toStatus === "Completed";

    if (isOverdue && !isUnderReviewToCompleted) {
      toast.error("Task is overdue. Please edit the due date.");
      return;
    }

    updateTaskStatus({ taskId, status: toStatus, updatedBy: userId })
      .unwrap()
      .then(() => {
        toast.success(`Task status updated to ${toStatus}`);
      })
      .catch((error) => {
        if (
          error.data?.message?.includes("must have both start and due dates")
        ) {
          toast.error(error.data.message);
        } else {
          toast.error("Failed to update task status");
        }
      });
  };

  if (isLoading)
    return (
      <div className="grid grid-cols-1 gap-4 p-4 dark:bg-primary-dark md:grid-cols-2 xl:grid-cols-4">
        {taskStatus.map((status) => (
          <div key={status} className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-4 rounded-full dark:bg-dark-tertiary" />
              <Skeleton className="h-4 w-[100px] dark:bg-dark-tertiary" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="space-y-2 rounded-lg border p-4 dark:border-gray-700"
                >
                  <Skeleton className="h-4 w-[200px] dark:bg-dark-tertiary" />
                  <Skeleton className="h-4 w-[150px] dark:bg-dark-tertiary" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full dark:bg-dark-tertiary" />
                    <Skeleton className="h-4 w-4 rounded-full dark:bg-dark-tertiary" />
                    <Skeleton className="h-4 w-4 rounded-full dark:bg-dark-tertiary" />
                  </div>
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-4 w-[60px] dark:bg-dark-tertiary" />
                    <Skeleton className="h-4 w-[60px] dark:bg-dark-tertiary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  if (error) return <div>An error occurred while fetching tasks</div>;

  const getClientName = (clientId: number) => {
    const client = clients?.find((client) => client.id === clientId);
    return client ? client.domainName : "Unknown client";
  };

  const displayTasks = () => {
    if (searchQuery && filteredTasks.length === 0) {
      return [];
    }

    if (selectedUsers.length > 0) {
      const userFilteredTasks = filteredTasks.filter(
        (task) => !task.parentTaskId,
      );
      return userFilteredTasks.length > 0 ? userFilteredTasks : [];
    }

    // Default behavior - FIX HERE
    return filteredTasks.length > 0
      ? filteredTasks.filter((task) => !task.parentTaskId)
      : (tasksData?.tasks || []).filter((task) => !task.parentTaskId); // Changed from tasks to tasksData?.tasks
  };

  return (
    <div className="dark:bg-primary-dark">
      <CreateTask
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onTaskCreatedOrUpdated={refetchTasks}
      />

      {/* Header with title and filters */}
      <div className="sticky top-0 z-10 border-b border-t border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-secondary-dark">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            My Tasks
          </h1>
          <div className="flex items-center space-x-2">
            {/* Search Input */}
            <div className="relative rounded-md border dark:border-gray-600">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 border text-gray-500 dark:border-gray-700 dark:text-gray-400" />
              <Input
                type="search"
                placeholder="Search tasks..."
                className="w-full pl-9 dark:text-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center space-x-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
              {(selectedUsers.length > 0 || selectedTimeFilter) && (
                <Badge variant="secondary" className="px-1.5 py-0.5">
                  {selectedUsers.length + (selectedTimeFilter ? 1 : 0)}
                </Badge>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Sidebar */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-80 flex-col bg-white shadow-lg dark:bg-secondary-dark">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-800 dark:text-gray-300">
                Filter Tasks
              </h2>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by User
              </h3>

              <ScrollArea className="rounded-md border p-2 dark:border-gray-700">
                {users
                  .filter(
                    (
                      user,
                    ): user is (typeof users)[number] & { userId: number } =>
                      user.userId !== undefined,
                  )
                  .map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center space-x-2 py-2"
                    >
                      <Checkbox
                        id={`user-${user.userId}`}
                        checked={selectedUsers.includes(user.userId)}
                        onCheckedChange={() => toggleUserSelection(user.userId)}
                      />
                      <label
                        htmlFor={`user-${user.userId}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                      >
                        {user.username || `${user.firstname} ${user.lastname}`}
                      </label>
                    </div>
                  ))}
              </ScrollArea>
            </div>

            {/* Time filter section */}
            <div className="mt-6 p-4">
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Time
              </h3>
              <div className="space-y-2 border p-2 dark:border-gray-700">
                {timeFilterOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-2 py-2"
                  >
                    <Checkbox
                      id={`time-${option.value}`}
                      checked={selectedTimeFilter === option.value}
                      onCheckedChange={() => {
                        setSelectedTimeFilter(
                          selectedTimeFilter === option.value
                            ? null
                            : option.value,
                        );
                      }}
                    />
                    <label
                      htmlFor={`time-${option.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 dark:border-gray-700">
              <button
                onClick={clearFilters}
                className="w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Board */}
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
          {taskStatus.map((status) => {
            const statusTasks = displayTasks().filter(
              (task) => task.status === status,
            );
            return (
              <TaskColumn
                key={status}
                status={status}
                tasks={statusTasks}
                allTasks={tasksData?.tasks || []} 
                moveTask={moveTask}
                setIsCreateTaskOpen={setIsCreateTaskOpen}
                getClientName={getClientName}
                hasUserFilter={selectedUsers.length > 0}
                searchQuery={searchQuery}
                userId={userId}
              />
            );
          })}
        </div>
      </DndProvider>
    </div>
  );
};

type TaskColumnProps = {
  status: Status;
  tasks: TaskType[];
  allTasks: TaskType[];
  moveTask: (taskId: number, toStatus: Status) => void;
  setIsCreateTaskOpen: (isOpen: boolean) => void;
  getClientName: (clientId: number) => string;
  hasUserFilter: boolean;
  searchQuery: string;
  userId: number;
};

const TaskColumn = ({
  status,
  tasks,
  allTasks,
  moveTask,
  setIsCreateTaskOpen,
  getClientName,
  hasUserFilter,
  searchQuery,
  userId,
}: TaskColumnProps) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "task",
    drop: (item: { id: number }) => {
      const task = allTasks.find((t) => t.id === item.id);
      if (task) {
        moveTask(task.id, status);
      }
    },
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

      <div
        className={`px-2 ${tasks.length > 0 ? "custom-scrollbar flex-grow overflow-y-auto" : "flex items-center justify-center"}`}
      >
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="relative">
            <TaskCard task={task} getClientName={getClientName} />
            </div>
          ))
        ) : searchQuery ? (
          <div className="mt-10 flex h-full items-start justify-center text-gray-500 dark:text-gray-400">
            No Task found.
          </div>
        ) : hasUserFilter ? (
          <div className="mt-10 flex h-full items-start justify-center text-gray-500 dark:text-gray-400">
            No tasks for selected users
          </div>
        ) : (
          <div className="mt-10 flex h-full items-start justify-center text-gray-500 dark:text-gray-400">
            No tasks in this status
          </div>
        )}
      </div>
      {/* Add Task button at the bottom */}
      <div
        className={`flex items-center gap-2 border-t px-4 py-3 pt-2 ${statusBorderColor[status]} cursor-pointer hover:bg-opacity-70 ${statusColor[status]}`}
        onClick={() => setIsCreateTaskOpen(true)}
      >
        <Plus size={16} className="text-gray-600 dark:text-gray-300" />
        <span className="text-base text-gray-700 dark:text-gray-300">
          Add Task
        </span>
      </div>
    </div>
  );
};

export default UserTaskBoardView;
