import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  useGetTasksByUserQuery,
  useUpdateTaskStatusMutation,
  useGetClientsQuery,
  useGetUsersQuery,
  useGetMyTasksCountQuery,
} from "@/state/api";
import { Task as TaskType } from "@/state/api";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Activity,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  Filter,
  Grid3x3,
  Plus,
  Search,
  Trash2,
  X,
  Calendar,
  CircleCheckBig,
} from "lucide-react";
import { format } from "date-fns";
import toast, { Toaster } from "react-hot-toast";
import CreateTask from "@/components/Task/CreateTask";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import TaskCard from "@/components/Task/TaskCard";
import { Input } from "@/components/ui/input";
import { debounce } from "lodash";
import { useTaskSocket } from "@/hooks/useTaskSocket"; 

type Status = "To Do" | "Work In Progress" | "QA" | "Completed";

type BoardProps = {
  id: string;
  setIsCreateTask: (isOpen: boolean) => void;
  activeTab: string;
  setActiveTab: (tabName: string) => void;
};

type TabButtonProps = {
  name: string;
  icon: React.ReactNode;
  setActiveTab: (tabName: string) => void;
  activeTab: string;
};

const taskStatus: Status[] = ["To Do", "Work In Progress", "QA", "Completed"];

const TabButton = ({ name, icon, setActiveTab, activeTab }: TabButtonProps) => {
  const isActive = activeTab === name;

  return (
    <button
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
        isActive
          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      }`}
      onClick={() => setActiveTab(name)}
    >
      {icon}
      {name}
    </button>
  );
};

const MyTaskBoardView = ({
  id,
  setIsCreateTask,
  activeTab,
  setActiveTab,
}: BoardProps) => {
  const { user } = useAuth();
  const userId = user?.userId?.toString();
  const isAdmin = user?.role === "ADMIN";
    useTaskSocket(userId);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Fetch tasks with search functionality
  const {
    data: tasksData,
    isLoading,
    error,
    refetch,
  } = useGetTasksByUserQuery(
    { 
      userId: Number(userId), 
      search: debouncedSearchQuery 
    },
    {
      skip: !userId,
    }
  );

  const tasks = tasksData?.tasks || [];
  const pagination = tasksData?.pagination;

  // Add this hook to get task counts
  const { data: myTasksCount } = useGetMyTasksCountQuery(undefined, {
    skip: !userId,
  });

  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const { data: clients } = useGetClientsQuery();
  const { data: users = [] } = useGetUsersQuery();

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string | null>(
    null,
  );

  const timeFilterOptions = [
    { label: "Today", value: "today" },
    { label: "Last 7 Days", value: "last7days" },
    { label: "Last 30 Days", value: "last30days" },
  ];

  // Debounce search input
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setDebouncedSearchQuery(query);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  // Get task status counts from myTasksCount
  const taskStatusCounts = myTasksCount || {
    "To Do": 0,
    "Work In Progress": 0,
    QA: 0,
    Completed: 0,
  };

  // Filter tasks locally for time and user filters

const filteredTasks = tasks.filter((task) => {
  // Apply time filter
  if (selectedTimeFilter) {
    const now = new Date();
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
  }

  // Apply user filter - safely handle undefined user IDs
  if (selectedUsers.length > 0) {
    return task.assignedUsers?.some(assignedUser => 
      assignedUser.userId !== undefined && 
      selectedUsers.includes(assignedUser.userId)
    );
  }

  return true;
});

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const clearFilters = () => {
    setSelectedUsers([]);
    setSelectedTimeFilter(null);
    setSearchQuery("");
    setDebouncedSearchQuery("");
  };

  const moveTask = (taskId: number, toStatus: Status) => {
    if (!userId) {
      console.error("No authenticated user found");
      return;
    }

    const taskToMove = tasks.find((task) => task.id === taskId);
    if (!taskToMove) {
      toast.error("Task not found");
      return;
    }

    // if (!taskToMove.startDate || !taskToMove.dueDate) {
    //   toast.error("Task must have both start and due dates to change status");
    //   return;
    // }

    // const isOverdue =
    //   taskToMove.dueDate && new Date(taskToMove.dueDate) < new Date();

    // const isUnderReviewToCompleted =
    //   taskToMove.status === "QA" && toStatus === "Completed";

    // if (isOverdue && !isUnderReviewToCompleted) {
    //   toast.error("Task is overdue. Please edit the due date.");
    //   return;
    // }

    updateTaskStatus({ taskId, status: toStatus, updatedBy: userId })
      .unwrap()
      .then(() => {
        toast.success(`Task status updated to ${toStatus}`);
        refetch(); // Refetch tasks after status update
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
    return client
      ? client.domainName || client.companyName || "Unknown Client"
      : "Unknown Client";
  };

  const displayTasks = () => {
    // If we have backend search results or local filters, use filteredTasks
    if (debouncedSearchQuery || selectedUsers.length > 0 || selectedTimeFilter) {
      return filteredTasks;
    }

    // Otherwise, return all tasks for the current user
    return tasks.filter(
      (task) =>
        task.assignedUsers?.some(
          (user) => String(user.userId) === String(userId),
        ) && !task.parentTaskId,
    );
  };

  return (
    <div className="dark:bg-primary-dark">
      {/* Header with search and filters */}
      <div className="sticky top-0 border-b border-t border-gray-200 bg-white px-4 py-2 dark:border-secondary dark:bg-secondary my-3 mx-4 rounded-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            {user.username} Task's
          </h1>
          <div className="flex items-center space-x-2">
            {/* Search Input */}
            <div className="relative rounded-md border dark:border-gray-600">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500  dark:text-gray-400" />
              <Input
                type="search"
                placeholder="Search tasks by title or projects"
                className="w-full pl-9 text-gray-500 dark:text-gray-300 md:w-80"
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

            <div className="flex gap-2">
              <TabButton
                name="Board"
                icon={<Grid3x3 className="h-5 w-5" />}
                setActiveTab={setActiveTab}
                activeTab={activeTab}
              />
              <TabButton
                name="Calendar"
                icon={<Calendar className="h-5 w-5" />}
                setActiveTab={setActiveTab}
                activeTab={activeTab}
              />
            </div>
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
                    <input
                      type="checkbox"
                      id={`time-${option.value}`}
                      checked={selectedTimeFilter === option.value}
                      onChange={() => {
                        setSelectedTimeFilter(
                          selectedTimeFilter === option.value
                            ? null
                            : option.value,
                        );
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                    />
                    <label
                      htmlFor={`time-${option.value}`}
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
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

      {/* Search results info */}
      {debouncedSearchQuery && (
        <div className="bg-blue-50 p-3 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Showing results for: <strong>{debouncedSearchQuery}</strong>
              {filteredTasks.length > 0 && (
                <span> ({filteredTasks.length} tasks found)</span>
              )}
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Clear search
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
            const tasksCount = taskStatusCounts[status] || 0;

            return (
              <TaskColumn
                key={status}
                status={status}
                tasks={statusTasks}
                allTasks={tasks}
                moveTask={moveTask}
                setIsCreateTask={setIsCreateTask}
                getClientName={getClientName}
                hasUserFilter={selectedUsers.length > 0}
                searchQuery={debouncedSearchQuery}
                tasksCount={tasksCount}
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
  setIsCreateTask: (isOpen: boolean) => void;
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
  setIsCreateTask,
  getClientName,
  hasUserFilter,
  searchQuery,
  tasksCount,
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
      className={`flex h-[80vh] flex-col justify-between rounded-lg pb-2 xl:px-2 ${statusColor[status]} ${statusBorderColor[status]} border ${isOver ? "ring-2 ring-blue-500 dark:ring-blue-400/50" : ""}`}
    >
      {/* Header */}
      <div
        className={`mb-3 flex w-full items-center justify-between rounded-t-lg border-b px-4 py-2 dark:border-gray-300/15 ${statusColor[status]} ${statusBorderColor[status]}`}
      >
        <h3 className="flex items-center text-base font-semibold text-gray-800 dark:text-gray-300">
          {status}
          <span
            className="ml-2 inline-block rounded-full bg-gray-200 p-1 text-center text-sm leading-none text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            style={{ width: "1.5rem", height: "1.5rem" }}
          >
            {tasksCount}
          </span>
        </h3>
        <div className="flex items-center gap-1">
          <button
            className="flex h-6 w-6 items-center justify-center rounded bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            onClick={() => setIsCreateTask(true)}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Task list area */}
      <div
        className={`px-2 ${tasks.length > 0 ? "custom-scrollbar flex-grow overflow-y-auto" : "flex items-center justify-center"}`}
      >
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="relative mb-4">
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
            <p className="font-medium"> All Clear</p>
          </div>
        )}
      </div>

      {/* Add Task button at the bottom */}
      <div
        className={`flex items-center gap-2 border-t px-4 py-3 pt-2 mt-2 dark:bg-secondary border dark:border-gray-300/10 rounded-lg ${statusBorderColor[status]} cursor-pointer hover:bg-opacity-70 ${statusColor[status]}`}
        onClick={() => setIsCreateTask(true)}
      >
        <Plus size={16} className="text-gray-600 dark:text-gray-300" />
        <span className="text-base text-gray-700 dark:text-gray-300">
          Add Task
        </span>
      </div>
    </div>
  );
};

export default MyTaskBoardView;