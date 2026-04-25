"use client";

import { useEffect, useState, useRef, useCallback, memo } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  useGetTasksForTaskPageQuery,
  useGetClientsQuery,
  useGetUsersQuery,
  useCreateTodayUpdateMutation,
  useSoftDeleteTaskMutation,
  useUpdateTaskStatusMutation,
} from "@/state/api";
import { Task as TaskType } from "@/state/api";
import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Plus,
  Search,
  X,
  CircleCheckBig,
  MoreVertical,
  Pencil,
  Trash2,
  TvMinimal,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import CreateTask from "@/components/Task/CreateTask";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import TodayUpdates from "@/components/TodayUpdates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TriangleAlert } from "lucide-react";
import { useTaskSocket } from "@/hooks/useTaskSocket";

type Status = "To Do" | "Work In Progress" | "Completed";

type BoardViewProps = {
  showSearchBar?: boolean;
  tvMode?: boolean; // When true, enables auto-scrolling marquee for TV display
  tvScrollSpeed?: number; // Duration in seconds for one full scroll cycle (default:120)
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Additional Update Popup Component
const AdditionalUpdatePopup = memo(
  ({
    isOpen,
    onClose,
    userName,
    onSubmit,
  }: {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    onSubmit: (content: string) => Promise<void>;
  }) => {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      if (!content.trim()) {
        toast.error("Please enter some content");
        return;
      }
      setIsSubmitting(true);
      try {
        await onSubmit(content);
        setContent("");
        onClose();
      } catch {
        toast.error("Failed to add additional update");
      } finally {
        setIsSubmitting(false);
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold dark:text-white">
            Add Additional Update for {userName}
          </h3>
          <textarea
            className="mb-4 h-32 w-full rounded-md border p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Write your additional update..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="rounded-md px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Update"}
            </button>
          </div>
        </div>
      </div>
    );
  },
);
AdditionalUpdatePopup.displayName = "AdditionalUpdatePopup";

// ─── TV Marquee Wrapper ───
// Renders children in an infinitely scrolling horizontal marquee.
// Uses pure CSS animation on the compositor thread — no JS timers, no layout recalc.
const TVMarquee = memo(
  ({
    children,
    speed = 120,
    paused = false,
  }: {
    children: React.ReactNode;
    speed?: number;
    paused?: boolean;
  }) => {
    return (
      <div className="w-full overflow-hidden">
        <div
          className="flex w-max gap-5 py-4 will-change-transform"
          style={{
            animation: `tv-scroll-left ${speed}s linear infinite`,
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {/* Render twice: the second copy makes the loop seamless */}
          {children}
          {children}
        </div>

        {/* Scoped keyframe — injected once via a style tag */}
        <style>{`
          @keyframes tv-scroll-left {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    );
  },
);
TVMarquee.displayName = "TVMarquee";

// ─── Horizontal Scroll Wrapper ───
// Renders children in a single row with horizontal scrolling (for non-TV mode)
const HorizontalScrollWrapper = memo(
  ({ children }: { children: React.ReactNode }) => {
    return (
      <div className="overflow-x-auto pb-4">
        <div className="flex w-max min-w-full gap-6">{children}</div>
      </div>
    );
  },
);
HorizontalScrollWrapper.displayName = "HorizontalScrollWrapper";

// ─── Main Board Component ───
const TasksBoardView = ({
  showSearchBar = true,
  tvMode = false,
  tvScrollSpeed = 120,
}: BoardViewProps) => {
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<
    string | undefined
  >(undefined);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { user } = useAuth();
  const userId = user?.userId?.toString();
  const userEmail = user?.email;
  useTaskSocket(userId);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [tvPaused, setTvPaused] = useState(false);
  const [tvSpeed, setTvSpeed] = useState(tvScrollSpeed);

  const [softDeleteTask, { isLoading: isSoftDeleting }] =
    useSoftDeleteTaskMutation();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [createUpdate] = useCreateTodayUpdateMutation();

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const debouncedGlobalSearchQuery = useDebounce(globalSearchQuery, 500);

  const {
    data: tasksResponse,
    isLoading,
    error,
    refetch,
  } = useGetTasksForTaskPageQuery({
    search: debouncedSearchQuery,
    page: currentPage,
    limit: 50,
  });

  const { data: clients } = useGetClientsQuery();
  const { data: users = [] } = useGetUsersQuery();

  const tasks = tasksResponse?.tasks || [];

  const handleEditTask = useCallback((task: TaskType) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteTask = useCallback((task: TaskType) => {
    setTaskToDelete(task);
    setDeleteTaskDialogOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
      try {
        await softDeleteTask(taskToDelete.id).unwrap();
        toast.success("Task Moved to Trash Successfully!");
        setDeleteTaskDialogOpen(false);
        setTaskToDelete(null);
        refetch();
      } catch (error) {
        console.error("Failed to soft delete the task:", error);
        toast.error("Failed to move task to Trash!");
      }
    }
  };

  const doesTaskMatchSearch = useCallback(
    (task: TaskType, searchTerm: string): boolean => {
      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();
      if (task.title?.toLowerCase().includes(lower)) return true;
      if (task.clientId) {
        const client = clients?.find((c) => c.id === task.clientId);
        if (client) {
          if (client.companyName?.toLowerCase().includes(lower)) return true;
          if (client.domainName?.toLowerCase().includes(lower)) return true;
        }
      }
      if (task.assignedUsers) {
        for (const assignedUser of task.assignedUsers) {
          const userDetails = users.find(
            (u) => u.userId === assignedUser.userId,
          );
          if (userDetails) {
            const userName =
              userDetails.username ||
              `${userDetails.firstname} ${userDetails.lastname}`;
            if (userName.toLowerCase().includes(lower)) return true;
          }
        }
      }
      return false;
    },
    [clients, users],
  );

  const getFilteredUsers = useCallback(() => {
    if (!globalSearchQuery.trim()) {
      const set = new Set<number>();
      tasks.forEach((task) =>
        task.assignedUsers?.forEach((a) => {
          if (a.userId) set.add(a.userId);
        }),
      );
      users.forEach((u) => {
        if (u.userId) set.add(u.userId);
      });
      return Array.from(set)
        .map((uid) => users.find((u) => u.userId === uid))
        .filter(Boolean);
    }

    const matchingUsers = users.filter((user) => {
      const userName = user.username || `${user.firstname} ${user.lastname}`;
      return userName.toLowerCase().includes(globalSearchQuery.toLowerCase());
    });
    if (matchingUsers.length > 0) return matchingUsers;

    const usersWithMatchingTasks = new Set<number>();
    tasks.forEach((task) => {
      if (doesTaskMatchSearch(task, globalSearchQuery)) {
        task.assignedUsers?.forEach((a) => {
          if (a.userId) usersWithMatchingTasks.add(a.userId);
        });
      }
    });
    return Array.from(usersWithMatchingTasks)
      .map((uid) => users.find((u) => u.userId === uid))
      .filter(Boolean);
  }, [globalSearchQuery, tasks, users, doesTaskMatchSearch]);

  const filteredUsers = getFilteredUsers();

  const sortedFilteredUsers = useCallback(() => {
    if (!user?.userId) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      if (a?.userId === user.userId) return -1;
      if (b?.userId === user.userId) return 1;
      return 0;
    });
  }, [filteredUsers, user?.userId])();

  const getUserTasks = useCallback(
    (uid: number) => {
      const userTasks = tasks.filter(
        (task) =>
          task.assignedUsers &&
          task.assignedUsers.some((a) => a.userId === uid),
      );
      if (globalSearchQuery.trim()) {
        return userTasks.filter((task) =>
          doesTaskMatchSearch(task, globalSearchQuery),
        );
      }
      return userTasks;
    },
    [tasks, globalSearchQuery, doesTaskMatchSearch],
  );

  const clearFilters = () => {
    setGlobalSearchQuery("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleAdditionalUpdateSubmit = useCallback(
    async (content: string) => {
      await createUpdate({ content }).unwrap();
      toast.success("Additional update added successfully!");
    },
    [createUpdate],
  );

  // Shared column renderer — used both in normal grid and TV marquee
  const renderColumns = (keyPrefix = "") =>
    sortedFilteredUsers.map((userInfo) => {
      if (!userInfo) return null;
      const userTasks = getUserTasks(userInfo.userId!);
      return (
        <div
          key={`${keyPrefix}${userInfo.userId}`}
          className={tvMode ? "w-80 flex-shrink-0" : "w-80 flex-shrink-0"}
        >
          <UserTaskColumn
            userName={
              userInfo.username || `${userInfo.firstname} ${userInfo.lastname}`
            }
            userId={userInfo.userId!}
            tasks={userTasks}
            getClientName={(clientId: number) => {
              const client = clients?.find((c) => c.id === clientId);
              return client
                ? client.domainName || client.companyName || "Unknown client"
                : "Unknown client";
            }}
            onAddTaskClick={() => {
              setSelectedAssigneeId(userInfo.userId?.toString());
              setIsCreateTaskOpen(true);
            }}
            moveTask={(taskId: number, toStatus: Status) => {
              if (!userId) return;
              updateTaskStatus({ taskId, status: toStatus, updatedBy: userId })
                .unwrap()
                .then(() => toast.success(`Task status updated to ${toStatus}`))
                .catch((err) => {
                  toast.error(
                    err.data?.message?.includes(
                      "must have both start and due dates",
                    )
                      ? err.data.message
                      : "Failed to update task status",
                  );
                });
            }}
            currentUserId={user?.userId}
            currentUserEmail={userEmail}
            onSubmitAdditionalUpdate={handleAdditionalUpdateSubmit}
            globalSearchQuery={globalSearchQuery}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            tvMode={tvMode}
          />
        </div>
      );
    });

  if (isLoading)
    return (
      <div className="p-4 dark:bg-primary-dark">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full dark:bg-dark-tertiary" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border p-4 dark:border-gray-700"
              >
                <Skeleton className="h-4 w-[200px] dark:bg-dark-tertiary" />
                <Skeleton className="mt-2 h-4 w-[150px] dark:bg-dark-tertiary" />
                <div className="mt-2 flex space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full dark:bg-dark-tertiary" />
                  <Skeleton className="h-4 w-4 rounded-full dark:bg-dark-tertiary" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

  if (error) return <div>An error occurred while fetching tasks</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="dark:bg-primary-dark">
        <CreateTask
          key={selectedAssigneeId || "new-task"} // Force re-mount when selected user changes
          isOpen={isCreateTaskOpen}
          onClose={() => {
            setIsCreateTaskOpen(false);
            setSelectedAssigneeId(undefined);
            refetch();
          }}
          preSelectedAssigneeId={selectedAssigneeId}
        />
        <CreateTask
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTask(null);
            refetch();
          }}
          id={selectedTask?.clientId?.toString()}
          task={selectedTask}
        />

        {/* ── Search Bar (hidden in TV mode) ── */}
        {showSearchBar && !tvMode && (
          <>
            <div className="mx-4 mb-4 mt-2 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Tasks
              </h1>

              <div className="flex items-center gap-4">
                <Link href="/today-tasks">
                  {" "}
                  <button className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5">
                    <TvMinimal className="h-4 w-4 text-gray-500 dark:text-gray-400" />{" "}
                    TV Mode
                  </button>
                </Link>

                <div className="relative w-[400px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search by task title, client name, domain, or user name"
                    className="w-full pl-9 pr-10 text-gray-700 dark:text-gray-300"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  />
                  {globalSearchQuery && (
                    <button
                      onClick={clearFilters}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            {globalSearchQuery && (
              <div className="mx-4 mb-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Showing {sortedFilteredUsers.length} users matching "
                    {globalSearchQuery}"
                  </p>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Clear search
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TV Mode: Marquee ── */}
        {tvMode && sortedFilteredUsers.length > 0 && (
          <div className="mx-4">
            <TVMarquee speed={tvSpeed} paused={tvPaused}>
              {renderColumns("copy-")}
            </TVMarquee>
          </div>
        )}

        {/* ── Normal Mode: Horizontal Scroll Row ── */}
        {!tvMode && (
          <div className="mx-4">
            <HorizontalScrollWrapper>{renderColumns()}</HorizontalScrollWrapper>
          </div>
        )}

        {/* ── Empty States ── */}
        {sortedFilteredUsers.length === 0 && globalSearchQuery && (
          <div className="mx-4 mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12 dark:border-gray-700">
            <Search size={48} className="text-gray-400 dark:text-gray-500" />
            <p className="mt-2 text-lg font-medium text-gray-500 dark:text-gray-400">
              No results found for "{globalSearchQuery}"
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Try searching by task title, client name, domain, or user name
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Clear search
            </button>
          </div>
        )}

        {sortedFilteredUsers.length === 0 && !globalSearchQuery && (
          <div className="mx-4 mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12 dark:border-gray-700">
            <CircleCheckBig
              size={48}
              className="text-gray-400 dark:text-gray-500"
            />
            <p className="mt-2 text-lg font-medium text-gray-500 dark:text-gray-400">
              No tasks found
            </p>
            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Create your first task
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteTaskDialogOpen}
        onOpenChange={setDeleteTaskDialogOpen}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center gap-4">
            <TriangleAlert className="h-12 w-12 text-destructive" />
            <div className="space-y-2 text-center">
              <AlertDialogTitle>Move to Trash?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Are you sure you want to move the task to Trash?
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter className="gap-4 sm:justify-center">
            <AlertDialogCancel
              className="mt-2"
              onClick={() => setDeleteTaskDialogOpen(false)}
            >
              No, Keep it.
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isSoftDeleting}
            >
              {isSoftDeleting ? "Moving..." : "Yes, Move to Trash!"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndProvider>
  );
};

// ─── UserTaskColumn Component ───
const UserTaskColumn = memo(
  ({
    userName,
    userId,
    tasks,
    getClientName,
    onAddTaskClick, // New prop
    moveTask,
    currentUserId,
    currentUserEmail,
    onSubmitAdditionalUpdate,
    globalSearchQuery = "",
    onEditTask,
    onDeleteTask,
    tvMode = false,
  }: {
    userName: string;
    userId: number;
    tasks: TaskType[];
    getClientName: (clientId: number) => string;
    onAddTaskClick: () => void; // New prop type
    moveTask: (taskId: number, toStatus: Status) => void;
    currentUserId?: number;
    currentUserEmail?: string;
    onSubmitAdditionalUpdate: (content: string) => Promise<void>;
    globalSearchQuery?: string;
    onEditTask?: (task: TaskType) => void;
    onDeleteTask?: (task: TaskType) => void;
    tvMode?: boolean;
  }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isAdditionalUpdateOpen, setIsAdditionalUpdateOpen] = useState(false);
    const [todayUpdatesCount, setTodayUpdatesCount] = useState(0);

    const isCurrentUserColumn = currentUserId === userId;

    const tasksByStatus = {
      "To Do": tasks.filter((t) => t.status === "To Do"),
      "Work In Progress": tasks.filter((t) => t.status === "Work In Progress"),
      Completed: tasks.filter((t) => t.status === "Completed"),
    };

    const activeTasksCount =
      tasksByStatus["To Do"].length + tasksByStatus["Work In Progress"].length;
    const totalCompletedItems =
      tasksByStatus.Completed.length + todayUpdatesCount;

    const getStatusColor = (status: string) => {
      switch (status) {
        case "To Do":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
        case "Work In Progress":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
        case "Completed":
          return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      }
    };

    const topSectionTasks = [
      ...tasksByStatus["Work In Progress"],
      ...tasksByStatus["To Do"],
    ];
    const completedTasks = tasksByStatus.Completed;

    const handleAddUpdateClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsAdditionalUpdateOpen(true);
    };

    const handleClosePopup = useCallback(
      () => setIsAdditionalUpdateOpen(false),
      [],
    );
    const handleUpdatesCountChange = useCallback((count: number) => {
      setTodayUpdatesCount(count);
    }, []);

    const highlightText = (text: string, searchTerm: string) => {
      if (!searchTerm || !text) return text;
      const regex = new RegExp(
        `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi",
      );
      const parts = text.split(regex);
      return parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-600/50"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      );
    };

    // In TV mode the column scrolls its own content; height is auto.
    // In normal mode the column uses fixed viewport height with internal scroll.
    const columnHeightClass = tvMode
      ? "max-h-[80vh]" // tall but not infinite — keeps the marquee visually consistent
      : "h-[calc(100vh-120px)]";

    return (
      <>
        <div
          className={`flex ${columnHeightClass} flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800`}
        >
          {/* User Header */}
          <div
            className={`flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700 ${!tvMode ? "cursor-pointer" : ""}`}
            onClick={() => !tvMode && setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold dark:text-white">
                  {highlightText(userName, globalSearchQuery)}
                </h3>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!tvMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddTaskClick();
                  }}
                  className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Plus
                    size={18}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </button>
              )}
              <div className="flex gap-2 rounded-full bg-gray-100 p-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{activeTasksCount}</span>
              </div>
            </div>
          </div>

          {/* Tasks grouped — always expanded in TV mode */}
          {(isExpanded || tvMode) && (
            <div className="flex flex-1 flex-col overflow-hidden p-3">
              {tasks.length > 0 ? (
                <>
                  {/* Top Section: WIP + To Do */}
                  <div className="flex flex-1 flex-col overflow-hidden border-b border-gray-200 dark:border-gray-700">
                    <div
                      className="flex-1 space-y-2 overflow-y-auto py-2"
                      style={{ minHeight: 0 }}
                    >
                      {topSectionTasks.length > 0 ? (
                        topSectionTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            getClientName={getClientName}
                            moveTask={moveTask}
                            currentStatus={task.status as Status}
                            isAssignee={currentUserId === userId}
                            globalSearchQuery={globalSearchQuery}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                            currentUserId={currentUserId}
                            currentUserEmail={currentUserEmail}
                            tvMode={tvMode}
                          />
                        ))
                      ) : (
                        <div className="flex h-full items-center justify-center py-8 text-center text-xs text-gray-400 dark:text-gray-500">
                          No active tasks
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Section: Completed */}
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex shrink-0 items-center justify-between">
                      <div
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-1 ${getStatusColor("Completed")}`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            Today Completed
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isCurrentUserColumn && !tvMode && (
                            <button
                              onClick={handleAddUpdateClick}
                              className="flex items-center gap-2 rounded-md border border-gray-300 p-0.5 px-2 py-1 transition-colors hover:bg-white/20"
                              title="Add additional update"
                            >
                              <Plus size={14} className="text-current" />
                              Additional
                            </button>
                          )}
                          <span className="text-xs font-medium">
                            {totalCompletedItems}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex-1 space-y-2 overflow-y-auto py-2"
                      style={{ minHeight: 0 }}
                    >
                      {completedTasks.length > 0 ? (
                        completedTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            getClientName={getClientName}
                            moveTask={moveTask}
                            currentStatus={task.status as Status}
                            isAssignee={currentUserId === userId}
                            globalSearchQuery={globalSearchQuery}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                            currentUserId={currentUserId}
                            currentUserEmail={currentUserEmail}
                            tvMode={tvMode}
                          />
                        ))
                      ) : (
                        <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
                          No completed tasks
                        </div>
                      )}
                      <div className="mt-4 pt-2">
                        <TodayUpdates
                          selectedUserId={userId}
                          currentDate={new Date()}
                          currentUser={{ userId: currentUserId }}
                          usersData={[]}
                          showInput={false}
                          onUpdatesCountChange={handleUpdatesCountChange}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 py-8 text-center text-gray-500 dark:text-gray-400">
                  No tasks assigned
                  {/* {!tvMode && (
                    <button
                      onClick={() => setIsCreateTaskOpen(true)}
                      className="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      Create task
                    </button>
                  )} */}
                </div>
              )}
            </div>
          )}
        </div>

        {!tvMode && (
          <AdditionalUpdatePopup
            isOpen={isAdditionalUpdateOpen}
            onClose={handleClosePopup}
            userName={userName}
            onSubmit={onSubmitAdditionalUpdate}
          />
        )}
      </>
    );
  },
);
UserTaskColumn.displayName = "UserTaskColumn";

// ─── TaskCard Component ───
const TaskCard = memo(
  ({
    task,
    getClientName,
    moveTask,
    currentStatus,
    isAssignee,
    globalSearchQuery = "",
    onEdit,
    onDelete,
    currentUserId,
    currentUserEmail,
    tvMode = false,
  }: {
    task: TaskType;
    getClientName: (clientId: number) => string;
    moveTask: (taskId: number, toStatus: Status) => void;
    currentStatus: Status;
    isAssignee: boolean;
    globalSearchQuery?: string;
    onEdit?: (task: TaskType) => void;
    onDelete?: (task: TaskType) => void;
    currentUserId?: number;
    currentUserEmail?: string;
    tvMode?: boolean;
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showStatusOptions, setShowStatusOptions] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const statusOptions: Status[] = ["To Do", "Work In Progress", "Completed"];
    const statusButtonRef = useRef<HTMLButtonElement>(null);
    const statusMenuRef = useRef<HTMLDivElement>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);
    const actionButtonRef = useRef<HTMLButtonElement>(null);

    const canModifyTask = useCallback(() => {
      if (!currentUserId) return false;
      const currentUserIdStr = String(currentUserId);
      const isAssignedToTask = task.assignedUsers?.some(
        (assignedUser) => String(assignedUser.userId) === currentUserIdStr,
      );
      let isAssignedByUser = false;
      if (task.assignedBy) {
        const assignedByStr = String(task.assignedBy);
        if (/^\d+$/.test(assignedByStr)) {
          isAssignedByUser = assignedByStr === currentUserIdStr;
        } else if (assignedByStr.includes("@") && currentUserEmail) {
          isAssignedByUser =
            assignedByStr.toLowerCase() ===
            String(currentUserEmail).toLowerCase();
        }
      }
      return isAssignedToTask || isAssignedByUser;
    }, [currentUserId, currentUserEmail, task.assignedUsers, task.assignedBy]);

    const highlightText = (text: string, searchTerm: string) => {
      if (!searchTerm || !text) return text;
      const regex = new RegExp(
        `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi",
      );
      const parts = text.split(regex);
      return parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-600/50"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      );
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          actionMenuRef.current &&
          !actionMenuRef.current.contains(event.target as Node) &&
          actionButtonRef.current &&
          !actionButtonRef.current.contains(event.target as Node)
        ) {
          setShowActionMenu(false);
        }
        if (
          statusMenuRef.current &&
          !statusMenuRef.current.contains(event.target as Node) &&
          statusButtonRef.current &&
          !statusButtonRef.current.contains(event.target as Node)
        ) {
          setShowStatusOptions(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleStatusSelect = (newStatus: Status) => {
      if (newStatus !== currentStatus && isAssignee)
        moveTask(task.id, newStatus);
      setShowStatusOptions(false);
    };

    const getStatusColorClass = (status: Status) => {
      switch (status) {
        case "To Do":
          return "bg-blue-500";
        case "Work In Progress":
          return "bg-yellow-500";
        case "Completed":
          return "bg-green-500";
        default:
          return "bg-gray-500";
      }
    };

    const getStatusIcon = () => {
      switch (currentStatus) {
        case "To Do":
          return <CircleCheckBig size={16} className="text-gray-400" />;
        case "Work In Progress":
          return <CircleCheckBig size={16} className="text-yellow-500" />;
        case "Completed":
          return <CircleCheckBig size={16} className="text-green-500" />;
        default:
          return <CircleCheckBig size={16} className="text-gray-400" />;
      }
    };

    const clientName = task.clientId ? getClientName(task.clientId) : "";

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onEdit && canModifyTask()) onEdit(task);
      setShowActionMenu(false);
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete && canModifyTask()) onDelete(task);
      setShowActionMenu(false);
    };

    // In TV mode: no action menus, no status dropdowns — read-only display
    const showActionMenuButton =
      !tvMode && (onEdit || onDelete) && canModifyTask();
    const allowStatusChange = !tvMode && isAssignee;

    return (
      <div
        className={`group relative rounded-lg border p-3 shadow-sm transition-all hover:shadow-md ${
          currentStatus === "Work In Progress"
            ? "border-yellow-400/50 bg-gradient-to-r from-yellow-50/50 to-white dark:from-yellow-950/20 dark:to-gray-800"
            : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
        }`}
        onMouseEnter={() => !tvMode && setIsHovered(true)}
        onMouseLeave={() => {
          if (!tvMode) {
            setIsHovered(false);
            setShowActionMenu(false);
          }
        }}
      >
        <div className="space-y-2">
          <div className="relative flex items-center justify-between overflow-visible">
            <div className="flex min-w-0 flex-1 items-center gap-1">
              {allowStatusChange && (
                <div
                  className={`flex-shrink-0 transition-all duration-200 ${
                    isHovered
                      ? "mr-1 w-auto translate-x-0 opacity-100"
                      : "mr-0 w-0 -translate-x-2 opacity-0"
                  }`}
                >
                  <button
                    ref={statusButtonRef}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowStatusOptions(!showStatusOptions);
                    }}
                    className="transition-transform hover:scale-110"
                    title="Change status"
                  >
                    {getStatusIcon()}
                  </button>
                </div>
              )}

              {tvMode ? (
                // In TV mode, no link — just the title (links can't be clicked on a TV)
                <h4 className="min-w-0 flex-1 text-sm font-medium text-gray-900 dark:text-white">
                  {task.title}
                </h4>
              ) : (
                <Link href={`/task/${task.id}`} className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-gray-900 transition-all duration-200 hover:text-blue-600 dark:text-white dark:hover:text-blue-400">
                    {highlightText(task.title, globalSearchQuery)}
                  </h4>
                </Link>
              )}
            </div>

            {/* Action Menu (hidden in TV mode) */}
            {showActionMenuButton && (
              <div className="ml-2 flex-shrink-0">
                <button
                  ref={actionButtonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActionMenu(!showActionMenu);
                  }}
                  className={`rounded-md p-1 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}
                  title="Task actions"
                >
                  <MoreVertical
                    size={16}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </button>

                {showActionMenu && (
                  <div
                    ref={actionMenuRef}
                    className="absolute right-0 top-6 z-20 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
                  >
                    {onEdit && (
                      <button
                        onClick={handleEdit}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Pencil size={14} />
                        Edit Task
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={handleDelete}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            {task.clientId && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tvMode
                  ? clientName
                  : highlightText(clientName, globalSearchQuery)}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs">
              {task.dueDate && (
                <div className="flex flex-shrink-0 items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(task.dueDate), "MMM d")}
                  </span>
                </div>
              )}
              <Avatar className="h-4 w-4">
                <AvatarFallback className="bg-blue-500 text-[8px] text-white">
                  {task.assignedBy
                    ? String(task.assignedBy).charAt(0).toUpperCase()
                    : "?"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {showStatusOptions && allowStatusChange && (
          <div
            ref={statusMenuRef}
            className="absolute left-6 top-8 z-20 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusSelect(status)}
                className={`flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  status === currentStatus
                    ? "bg-gray-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span
                  className={`mr-2 h-2 w-2 rounded-full ${getStatusColorClass(status)}`}
                />
                {status}
                {status === currentStatus && (
                  <span className="ml-auto text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
);
TaskCard.displayName = "TaskCard";

export default TasksBoardView;
