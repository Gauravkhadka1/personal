"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  useGetTasksQuery,
  useGetAllTasksCountQuery,
  useUpdateTaskStatusMutation,
  useCreateTaskMutation,
  useGetClientsQuery,
  useDeleteTaskMutation,
  useAddCommentToTaskMutation,
  useCreateSubtaskMutation,
  useGetSubtasksQuery,
  useGetUsersQuery,
} from "@/state/api";
import { Task as TaskType, ClientType, Comment, Priority } from "@/state/api";
import React from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Activity,
  ArrowRight,
  EllipsisVertical,
  MessageSquare,
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
  Paperclip,
  FileText,
  Image as ImageIcon,
  Download,
  SquareCheckBig,
  AlertTriangle,
  SignalMedium,
  SignalHigh,
  AlertOctagon,
  CircleCheckBig,
  ChevronLeft,
  ChevronsLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsRight,
} from "lucide-react";
import {
  format,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from "date-fns";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import CreateTask from "@/components/Task/CreateTask";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import SubtaskForm from "@/components/SubTask/CreateSubtask";
import withRoleAuth from "../../hoc/withRoleAuth";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UserProfileCard from "@/components/UserProfileCard";
import TaskCard from "@/components/Task/TaskCard";
import AllSubtasks from "@/components/AllTasks/AllSubtasks";
import { useTaskSocket } from "@/hooks/useTaskSocket"; 

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

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const taskStatus: Status[] = ["To Do", "Work In Progress", "QA", "Completed"];

const Tasks = () => {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const { user } = useAuth();
  const userId = user?.userId?.toString();
  const isAdmin = user?.role === "ADMIN";
     useTaskSocket(userId);

  // Filter state - removed filter sidebar state
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  
  // New state for user tabs scrolling
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const usersContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Updated to handle the new response structure with search parameters
  const {
    data: tasksResponse,
    isLoading,
    error,
  } = useGetTasksQuery({
    search: debouncedSearchQuery,
    assignedTo: selectedUsers.length > 0 ? selectedUsers[0] : undefined,
    page: currentPage,
    limit: 50, // Increase limit to show more tasks
  });

  const { data: allTasksCount } = useGetAllTasksCountQuery();
  const { data: clients } = useGetClientsQuery();
  const { data: users = [] } = useGetUsersQuery();

  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [createTask] = useCreateTaskMutation();

  // Extract tasks array from response
  const tasks = tasksResponse?.tasks || [];
  const pagination = tasksResponse?.pagination;

  const moveTask = (taskId: number, toStatus: Status) => {
    if (!userId) {
      console.error("No authenticated user found");
      return;
    }

    // Find the task being moved from all tasks
    const taskToMove = tasks.find((task) => task.id === taskId);
    if (!taskToMove) {
      toast.error("Task not found");
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

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [userId], // Changed to select only one user at a time for tab behavior
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers([]); // Empty array means show all users
  };

  const clearFilters = () => {
    setSelectedUsers([]);
    setSearchQuery("");
    setSelectedTimeFilter(null);
    setCurrentPage(1);
  };

  const getClientName = (clientId: number) => {
    const client = clients?.find((client) => client.id === clientId);
    return client
      ? client.domainName || client.companyName || "Unknown client"
      : "Unknown client";
  };

  const displayTasks = () => {
    return tasks.filter((task) => !task.parentTaskId);
  };

  // Function to handle user tabs scrolling
  const scrollUsers = (direction: 'left' | 'right') => {
    if (usersContainerRef.current) {
      const scrollAmount = 200;
      const currentScroll = usersContainerRef.current.scrollLeft;
      
      if (direction === 'left') {
        usersContainerRef.current.scrollLeft = currentScroll - scrollAmount;
      } else {
        usersContainerRef.current.scrollLeft = currentScroll + scrollAmount;
      }
      
      // Update arrow visibility after scroll
      setTimeout(checkScrollPosition, 100);
    }
  };

  // Check scroll position to show/hide arrows
  const checkScrollPosition = () => {
    if (usersContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = usersContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  // Check scroll position on mount and when users change
  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, [users]);

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

  return (
    <div className="dark:bg-primary-dark">
      <CreateTask
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
      />
      {/* Header with title, user tabs, and search */}
      <div className="sticky top-0 mx-4 my-3 rounded-lg border-b border-t border-gray-200 bg-white px-4 py-2 dark:border-secondary dark:bg-secondary">
        <div className="flex flex-col space-y-3">
          {/* Title and Search Row */}
          <div className="flex items-center justify-between">
           
            {/* User Tabs Row */}
          <div className="flex items-center">
            {/* All Tasks Tab */}
            <button
              onClick={selectAllUsers}
              className={`rounded-l-lg px-4 py-2 text-sm font-medium transition-colors ${selectedUsers.length === 0 
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              All Tasks
            </button>

        

            {/* Users Container with horizontal scroll */}
            <div 
              ref={usersContainerRef}
              className="flex flex-1 overflow-x-hidden"
              onScroll={checkScrollPosition}
            >
              <div className="flex">
                {users
                  .filter(
                    (user): user is (typeof users)[number] & { userId: number } =>
                      user.userId !== undefined,
                  )
                  .map((userItem) => {
                    const isSelected = selectedUsers.includes(userItem.userId);
                    return (
                      <button
                        key={userItem.userId}
                        onClick={() => toggleUserSelection(userItem.userId)}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${isSelected 
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" 
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        {userItem.username || `${userItem.firstname} ${userItem.lastname}`}
                      </button>
                    );
                  })}
              </div>
            </div>

       
          </div>
            <div className="flex items-center space-x-2">
              {/* Search Input */}
              <div className="relative rounded-md border dark:border-gray-600">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search tasks by title or project name"
                  className="w-[260px] pl-9 text-gray-400 dark:text-gray-300"
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
            </div>
          </div>

          
        </div>
      </div>

      {/* Search Results Info */}
      {(searchQuery || selectedUsers.length > 0) && (
        <div className="bg-blue-50 p-3 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {searchQuery && `Search results for "${searchQuery}"`}
              {searchQuery && selectedUsers.length > 0 && " and "}
              {selectedUsers.length > 0 && (
                <>
                  Showing tasks for{" "}
                  {users
                    .find(u => u.userId === selectedUsers[0])
                    ?.username || 
                    users
                      .find(u => u.userId === selectedUsers[0])
                      ?.firstname + " " + 
                    users
                      .find(u => u.userId === selectedUsers[0])
                      ?.lastname}
                </>
              )}
              {tasks.length === 0 && " - No tasks found"}
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Task Board */}
      <DndProvider backend={HTML5Backend}>
        <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 xl:grid-cols-4">
          {taskStatus.map((status) => {
            const statusTasks = displayTasks().filter(
              (task) => task.status === status,
            );
            const statusCount = allTasksCount
              ? allTasksCount[status as keyof typeof allTasksCount] || 0
              : 0;
            return (
              <TaskColumn
                key={status}
                status={status}
                tasks={statusTasks}
                allTasks={tasks}
                moveTask={moveTask}
                setIsCreateTaskOpen={setIsCreateTaskOpen}
                getClientName={getClientName}
                hasUserFilter={selectedUsers.length > 0}
                searchQuery={searchQuery}
                tasksCount={statusCount}
              />
            );
          })}
        </div>
      </DndProvider>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 p-4">
          <button
            onClick={() => setCurrentPage(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-600"
          >
            Next
          </button>
        </div>
      )}
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
  tasksCount: number;
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
  tasksCount,
}: TaskColumnProps & { tasksCount: number }) => {
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

  const statusColor: Record<Status, string> = {
    "To Do": "bg-blue-50 dark:bg-secondary",
    "Work In Progress": "bg-yellow-50 dark:bg-secondary",
    QA: "bg-purple-50 dark:bg-secondary",
    Completed: "bg-green-50 dark:bg-secondary",
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
      className={`flex h-[80vh] flex-col justify-between rounded-lg lg:px-1 ${statusColor[status]} ${statusBorderColor[status]} border ${isOver ? "ring-2 ring-blue-500 dark:ring-blue-400/50" : ""}`}
    >
      {/* Header */}
      <div
        className={`mb-2 flex w-full items-center justify-between rounded-t-lg border-b px-4 py-2 dark:border-gray-300/10 ${statusColor[status]} ${statusBorderColor[status]}`}
      >
        <h3 className="flex items-center text-base font-semibold dark:text-gray-300">
          {status}{" "}
          <span
            className="ml-2 inline-block rounded-full bg-gray-200 p-2 text-center text-sm leading-none dark:bg-dark-tertiary"
          >
            {tasksCount}
          </span>
        </h3>
        <div className="flex items-center gap-1">
          <button className="flex h-6 w-5 items-center justify-center dark:text-neutral-500">
            {/* <EllipsisVertical size={26} /> */}
          </button>
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
          <div className="mt-10 flex h-full flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
            <CircleCheckBig
              size={20}
              className="text-gray-600 dark:text-gray-300"
            />
            <p className="font-medium">All Clear</p>
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

export default withRoleAuth(Tasks, ["ADMIN", "DESIGNER", "DEVELOPER"]);