// client/src/components/Task/TaskCard.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useDrag } from "react-dnd";
import { useAuth } from "../../context/AuthContext";
import {
  useAddCommentToTaskMutation,
  useDeleteTaskMutation,
  useGetClientsQuery,
  Task,
  Status,
  useSoftDeleteTaskMutation,
  useRestoreTaskMutation,
  usePermanentlyDeleteTaskMutation,
} from "@/state/api";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CircleCheckBig,
  CirclePlus,
  Download,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  SignalMedium,
  Trash2,
  User,
  Copy,
  ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import CreateTask from "./CreateTask";
import Subtasks from "@/components/SubTask/SubtaskCard";
import SubtaskForm from "@/components/SubTask/CreateSubtask";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import UserProfileCard from "@/components/UserProfileCard";
import toast from "react-hot-toast";
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
import TaskTimer from "./TaskTimer";

interface TaskProps {
  task: Task & {
    activityLogs?: ActivityLog[] | null;
    comments?: Comment[] | null;
    client?: ClientType;
  };
  getClientName: (clientId: number) => string;
}

type ActivityLog = {
  id: number;
  action: string;
  details: string | null;
  timestamp: string;
  userId: number;
  user?: {
    username?: string;
  };
};

type ClientType = {
  id: number;
  domainName?: string;
  companyName?: string;
  googleDriveLink?: string;
};

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  user?: {
    username?: string;
    firstname?: string;
    lastname?: string;
  };
};

type TaskType = {
  id: number;
  title: string;
  status?: Status | null;
  priority?: string;
  clientId: number;
  assignedUsers?: Array<{
    userId: number;
    firstname?: string;
    lastname?: string;
    profilePictureUrl?: string;
  }>;
  startDate?: string;
  dueDate?: string;
  tags?: string;
  comments?: Comment[];
  activityLogs?: ActivityLog[];
  attachments?: Array<{
    id: number;
    fileName: string;
    fileURL: string;
    createdAt: string;
    uploadedBy?: {
      username?: string;
      firstname?: string;
      lastname?: string;
    };
  }>;
  parentTaskId?: number;
};

enum Priority {
  Urgent = "Urgent",
  High = "High",
  Normal = "Normal",
}

const TaskCard = ({ task, getClientName }: TaskProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "task",
    item: { id: task.id },
    collect: (monitor: any) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [comments, setComments] = useState<Comment[]>(task.comments || []);
  const { user } = useAuth();
  const userId = user?.userId?.toString();
  const isAdmin = user?.role === "ADMIN";
  const isAdminOrDesignerOrDeveloper =
    user?.role === "ADMIN" ||
    user?.role === "DESIGNER" ||
    user?.role === "DEVELOPER";

  const { data: clients } = useGetClientsQuery();

  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
  const [hoveredSubtaskId, setHoveredSubtaskId] = useState<number | null>(null);

  const [showTitlePopup, setShowTitlePopup] = useState(false);
  const titlePopupRef = useRef<HTMLDivElement>(null);
  const [titleHoverTimeout, setTitleHoverTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Add this effect to handle hover with 2 second delay
  useEffect(() => {
    return () => {
      if (titleHoverTimeout) {
        clearTimeout(titleHoverTimeout);
      }
    };
  }, [titleHoverTimeout]);

  // Add hover handlers for the title
  const handleTitleMouseEnter = useCallback(() => {
    if (task.title.length > 600) {
      const timeout = setTimeout(() => {
        setShowTitlePopup(true);
      }, 2000);
      setTitleHoverTimeout(timeout);
    }
  }, [task.title.length]);

  const handleTitleMouseLeave = useCallback(() => {
    if (titleHoverTimeout) {
      clearTimeout(titleHoverTimeout);
      setTitleHoverTimeout(null);
    }
    setShowTitlePopup(false);
  }, [titleHoverTimeout]);

  // Add this effect to handle click outside the popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showTitlePopup &&
        titlePopupRef.current &&
        !titlePopupRef.current.contains(event.target as Node)
      ) {
        setShowTitlePopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTitlePopup]);

  // Add click handler for title
  const handleTitleClick = useCallback(
    (e: React.MouseEvent) => {
      if (task.title.length > 600) {
        e.stopPropagation();
        setShowTitlePopup(true);
      }
    },
    [task.title.length],
  );

  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);

  const [showCompletedSubtasks, setShowCompletedSubtasks] = useState(false);

  const [selectedSubtask, setSelectedSubtask] = useState<any>(null);
  const [softDeleteTask, { isLoading: isSoftDeleting }] =
    useSoftDeleteTaskMutation();

  const [taskOptionsVisible, setTaskOptionsVisible] = useState<
    Record<string | number, boolean>
  >({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showActivityPopup, setShowActivityPopup] = useState(false);
  const [showAttachmentsPopup, setShowAttachmentsPopup] = useState(false);

  const clientData = clients?.find((client) => client.id === task.clientId);

  const [showTimeDetailsPopup, setShowTimeDetailsPopup] = useState(false);
  const timeDetailsPopupRef = useRef<HTMLDivElement>(null);

  const handleEditClick = (task: any) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (taskOptionsVisible[task.id]) {
        const optionsMenu = document.querySelector(".task-options-menu");
        if (optionsMenu && !optionsMenu.contains(event.target as Node)) {
          setTaskOptionsVisible((prev) => ({ ...prev, [task.id]: false }));
        }
      }

      if (showActivityPopup) {
        const activityPopup = document.querySelector(".activity-popup");
        if (activityPopup && !activityPopup.contains(event.target as Node)) {
          setShowActivityPopup(false);
        }
      }
  
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [taskOptionsVisible, showActivityPopup, task.id]);

  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  const handleSoftDeleteClick = async (task: any) => {
    setTaskToDelete(task);
    setDeleteTaskDialogOpen(true);
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Plus size={16} className="text-blue-500" />;
      case "STATUS_UPDATE":
        return <Activity size={16} className="text-purple-500" />;
      case "DUE_DATE_UPDATE":
        return <ArrowRight size={16} className="text-orange-500" />;
      case "ASSIGNEE_UPDATE":
        return <User size={16} className="text-green-500" />;
      default:
        return <Activity size={16} className="text-gray-500" />;
    }
  };

  const formatActivityMessage = (log: ActivityLog) => {
    const { action, details, timestamp, user } = log;
    const formattedTime = format(new Date(timestamp), "MMM d, h:mm a");

    switch (action) {
      case "CREATE":
        return `${user?.username || "Someone"} created the task on ${formattedTime}`;
      case "STATUS_UPDATE":
        if (!details)
          return `${user?.username || "Someone"} updated the task status on ${formattedTime}`;
        const [fromStatus, toStatus] = details.split("|");
        return `${user?.username || "Someone"} updated status from ${fromStatus} to ${toStatus} on ${formattedTime}`;
      case "DUE_DATE_UPDATE":
        if (!details)
          return `${user?.username || "Someone"} updated the due date on ${formattedTime}`;
        const [oldDate, newDate] = details.split("|");
        return `${user?.username || "Someone"} changed due date from ${format(
          new Date(oldDate),
          "MMM d, h:mm a",
        )} to ${format(new Date(newDate), "MMM d, h:mm a")} on ${formattedTime}`;
      case "ASSIGNEE_UPDATE":
        return `${user?.username || "Someone"} reassigned the task on ${formattedTime}`;
      default:
        return `${user?.username || "Someone"} modified the task on ${formattedTime}`;
    }
  };

  const parseDateChangeComment = (content: string) => {
    const lines = content.split("\n");
    const dateChangeMatch = lines[0].match(
      /(changed the (start|due) date from (.+) to (.+))/,
    );

    if (dateChangeMatch) {
      const [_, changeText, dateType, oldDate, newDate] = dateChangeMatch;
      const reason = lines.slice(2).join("\n");

      return {
        isDateChange: true,
        dateType,
        oldDate,
        newDate,
        reason,
        originalContent: content,
      };
    }
    return { isDateChange: false, originalContent: content };
  };

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
        return <ImageIcon size={20} className="text-blue-500" />;
      case "pdf":
        return <FileText size={20} className="text-red-500" />;
      case "doc":
      case "docx":
        return <FileText size={20} className="text-blue-700" />;
      default:
        return <FileText size={20} className="text-gray-500" />;
    }
  };

  const isImageFile = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    return ["png", "jpg", "jpeg", "gif"].includes(extension || "");
  };

  const priorityStyles = {
    [Priority.Urgent]: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-800 dark:text-red-300",
      icon: (
        <AlertOctagon size={16} className="text-red-600 dark:text-red-400" />
      ),
    },
    [Priority.High]: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-800 dark:text-orange-300",
      icon: (
        <AlertTriangle
          size={16}
          className="text-orange-600 dark:text-orange-400"
        />
      ),
    },
    [Priority.Normal]: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-800 dark:text-green-300",
      icon: (
        <SignalMedium
          size={16}
          className="text-green-600 dark:text-green-400"
        />
      ),
    },
  };

  const formattedStartDate = task.startDate
    ? format(new Date(task.startDate), "MMM d, h:mm a")
    : "";

  const formattedDueDate = task.dueDate
    ? format(new Date(task.dueDate), "MMM d, h:mm a")
    : "";

  const getTimeLeft = () => {
    if (!task.dueDate || task.status === "QA" || task.status === "Completed")
      return null;

    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const diffMs = dueDate.getTime() - now.getTime();

    if (diffMs < 0) {
      const overdueMinutes = Math.abs(Math.floor(diffMs / (1000 * 60)));
      const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
      const overdueDays = Math.floor(overdueHours / 24);
      const overdueRemainingHours = overdueHours % 24;

      if (overdueMinutes < 60) {
        return {
          text: `- ${overdueMinutes}m `,
          color: "text-red-600 dark:text-red-500",
        };
      } else if (overdueHours < 24) {
        return {
          text: `- ${overdueHours}h `,
          color: "text-red-600 dark:text-red-500",
        };
      } else {
        return {
          text: `- ${overdueDays}d & ${overdueRemainingHours}h `,
          color: "text-red-600 dark:text-red-500",
        };
      }
    } else {
      const minutesLeft = Math.floor(diffMs / (1000 * 60));
      const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
      const daysLeft = Math.floor(hoursLeft / 24);
      const remainingHours = hoursLeft % 24;

      if (minutesLeft < 60) {
        return {
          text: `${minutesLeft}m left`,
          color: "text-green-600 dark:text-green-500",
        };
      } else if (hoursLeft < 24) {
        return {
          text: `${hoursLeft}h left`,
          color: "text-green-600 dark:text-green-500",
        };
      } else {
        return {
          text: `${daysLeft}d & ${remainingHours}h left`,
          color: "text-green-600 dark:text-green-500",
        };
      }
    }
  };

  const timeLeft = getTimeLeft();

  

  useEffect(() => {
    if (task.comments) {
      setComments(task.comments);
    }
  }, [task.comments]);

  useEffect(() => {
    if (showTimeDetailsPopup) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          timeDetailsPopupRef.current &&
          !timeDetailsPopupRef.current.contains(event.target as Node) &&
          showTimeDetailsPopup
        ) {
          setShowTimeDetailsPopup(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showTimeDetailsPopup]);

  const handleDuplicateClick = async (taskToDuplicate: any) => {
    console.log("Original task being duplicated:", taskToDuplicate);

    // Fetch subtasks for the task being duplicated
    const subtasks = taskToDuplicate.subtasks || [];

    // Create a new task object with the same properties but without the id
    const duplicatedTask = {
      ...taskToDuplicate,
      id: undefined, // Explicitly set to undefined
      _isDuplicate: true, // Add a flag to indicate this is a duplicate
      _duplicatedSubtasks: subtasks, // Include subtasks to be duplicated
      title: `${taskToDuplicate.title} (Copy)`, // Add (Copy) to the title
      assignedTo:
        taskToDuplicate.assignedUsers?.map((user: any) =>
          user.userId.toString(),
        ) ||
        taskToDuplicate.assignedTo ||
        [],
      comments: undefined, // Remove comments
      activityLogs: undefined, // Remove activity logs
      attachments: undefined, // Remove attachments
      startDate: null, // Reset dates
      dueDate: null,
    };

    console.log("Duplicated task before setting:", duplicatedTask);
    setSelectedTask(duplicatedTask);
    setIsEditModalOpen(true);
  };

  return (
    <div
      ref={(instance) => {
        drag(instance);
      }}
      className={`group mb-4 bg-white shadow dark:bg-secondary rounded-xl ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
      onMouseEnter={() => setHoveredTaskId(task.id)}
      onMouseLeave={() => setHoveredTaskId(null)}
    >
      <div className="relative cursor-pointer rounded-xl p-2 dark:border dark:border-gray-700/70 dark:bg-primary md:pb-4 md:pl-5 md:pr-5 md:pt-1">
        {/* Action buttons on hover */}
        <div
          className={`absolute right-2 top-2 z-10 flex gap-2 rounded-md border border-gray-400 bg-white p-1 shadow-md transition-opacity duration-200 dark:bg-dark-tertiary ${
            hoveredTaskId === task.id && hoveredSubtaskId === null
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          {/* Duplicate Button */}
          <Copy
            className="h-4 w-4 cursor-pointer hover:text-blue-500 dark:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicateClick(task);
            }}
          />
          {/* Add Subtask Button */}
          <CirclePlus
            className="h-4 w-4 cursor-pointer hover:text-blue-500 dark:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              setShowSubtaskForm(true);
            }}
          />
          {/* Edit Button */}
          <Pencil
            className="h-4 w-4 cursor-pointer hover:text-blue-500 dark:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(task);
            }}
          />
          {/* Delete Button (Admin only) */}
          {isAdminOrDesignerOrDeveloper && (
            <Trash2
              className="h-4 w-4 cursor-pointer hover:text-red-500 dark:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                handleSoftDeleteClick(task);
              }}
            />
          )}
        </div>
        <div className="mt-2 flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300">
          <div>
            {task.priority && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                  priorityStyles[task.priority as Priority]?.bg ||
                  "bg-gray-100 dark:bg-gray-700"
                } ${
                  priorityStyles[task.priority as Priority]?.text ||
                  "text-gray-800 dark:text-gray-300"
                }`}
              >
                {priorityStyles[task.priority as Priority]?.icon || null}
                {task.priority}
              </span>
            )}
          </div>
          <div>
            <Link
              href={`/projects/${task.clientId}`}
              className="rounded-md border dark:border-gray-700 bg-yellow-50 px-2 py-0.5 hover:text-blue-600 hover:underline dark:bg-transparent dark:hover:text-blue-400 dark:text-gray-300/70"
              onClick={(e) => e.stopPropagation()}
            >
              {getClientName(task.clientId)}
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="w-full">
            <div className="relative flex w-full items-center justify-between py-3">
              {/* Title container with relative positioning */}
              <div className="relative flex min-w-0 flex-shrink items-center hover:underline">
                <Link
                  href={`/task/${task.id}`}
                  className="cursor-pointer truncate text-base font-semibold text-dashboard-tasktitle  dark:text-gray-300/90"
                  onClick={(e) => e.stopPropagation()}
                >
                  {task.title.length > 600
                    ? `${task.title.substring(0, 600)}...`
                    : task.title}
                </Link>
                <ArrowUpRight size={12} className="ml-1 inline " />
              </div>

              <div className="flex-shrink-0">
                <TaskTimer
                  taskId={task.id}
                  initialIsRunning={task.isTimerRunning}
                  initialTimerStartTime={task.timerStartTime}
                  initialTimeSpent={task.timeSpent}
                  taskTitle={task.title}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1">
            {taskOptionsVisible[task.id] && (
              <div className="task-options-menu absolute right-10 z-50 mt-12 rounded bg-white shadow-lg">
                {isAdmin && (
                  <button
                    className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSoftDeleteClick(task);
                    }}
                    disabled={isSoftDeleting}
                  >
                    {isSoftDeleting ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between gap-4 dark:text-gray-300">
            <div>
              {task.assignedUsers && task.assignedUsers.length > 0 && (
                <div className="flex items-center">
                  <div className="flex items-center -space-x-2">
                    {task.assignedUsers.map((user) => {
                      const [showProfileCard, setShowProfileCard] =
                        useState(false);

                      let hoverTimeout: NodeJS.Timeout;

                      return (
                        <div
                          key={user.userId}
                          className="group relative"
                          onMouseEnter={() => {
                            hoverTimeout = setTimeout(() => {
                              setShowProfileCard(true);
                            }, 500);
                          }}
                          onMouseLeave={() => {
                            clearTimeout(hoverTimeout);
                            setShowProfileCard(false);
                          }}
                        >
                          {user.profilePictureUrl ? (
                            <Avatar className="h-6 w-6 cursor-pointer border dark:border-gray-600">
                              <AvatarImage
                                src={buildImageUrl(user.profilePictureUrl)}
                                alt={`${user.firstname} ${user.lastname}`}
                              />
                              <AvatarFallback className="text-xs">
                                {user.firstname?.charAt(0)}
                                {user.lastname?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-medium dark:border-dark-secondary dark:bg-gray-600">
                              {user.firstname?.charAt(0)}
                              {user.lastname?.charAt(0)}
                            </div>
                          )}

                          {showProfileCard && (
                            <UserProfileCard
                              user={user}
                              onClose={() => {
                                setShowProfileCard(false);
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center">
              {timeLeft && (
                <div className={`text-sm font-semibold ${timeLeft.color}`}>
                  {timeLeft.text}
                </div>
              )}
             
            </div>
          </div>
          <div className="flex items-center gap-2">
            {clientData?.googleDriveLink && (
              <a
                href={clientData?.googleDriveLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mr-1"
              >
                <img
                  src="/google-drive.png"
                  alt="Google Drive"
                  className="h-4 w-4 rounded-full"
                />
              </a>
            )}
            {/* Attachement Button */}
            {task.attachments && task.attachments.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAttachmentsPopup(true);
                }}
                className="flex items-center rounded-md hover:bg-gray-100 dark:hover:bg-dark-tertiary"
              >
                <Paperclip
                  size={16}
                  className="mr-1 text-gray-500 dark:text-gray-400"
                />
                <span className="mr-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {task.attachments?.length || 0}
                </span>
              </button>
            )}
            {/* Activity Button */}
            {/* <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActivityPopup(true);
              }}
              className="flex items-center rounded-md hover:bg-gray-100 dark:hover:bg-dark-tertiary"
            >
              <Activity
                size={16}
                className="mr-1 text-gray-500 dark:text-gray-400"
              />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {task.activityLogs?.length || 0}
              </span>
            </button> */}

            {/* Comments Button */}
            <a href={`/task/${task.id}`}>

           
            <button
              className="flex items-center rounded-md hover:bg-gray-100 dark:hover:bg-dark-tertiary"
            >
              <MessageSquare
                size={16}
                className="mr-1 text-gray-500 dark:text-gray-400"
              />
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {comments.length}
              </span>
            </button>
            </a>
           
          </div>

          {showAttachmentsPopup && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
              onClick={() => setShowAttachmentsPopup(false)}
            >
              <div
                className="relative max-h-[90vh] w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-dark-tertiary"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 rounded-t-lg bg-gray-50 px-6 py-4 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-semibold dark:text-gray-300">
                      Attachments
                    </h4>
                    <button
                      onClick={() => setShowAttachmentsPopup(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-6">
                  {task.attachments && task.attachments.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {task.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-start gap-4 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
                            {getFileIcon(attachment.fileName)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <a
                                href={buildImageUrl(attachment.fileURL)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-lg font-medium text-blue-600 hover:underline dark:text-blue-400"
                              >
                                {attachment.fileName}
                              </a>
                              <a
                                href={buildImageUrl(attachment.fileURL)}
                                download
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              >
                                <Download size={20} />
                              </a>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              Uploaded by{" "}
                              {attachment.uploadedBy?.username ||
                                `${attachment.uploadedBy?.firstname || ""} ${attachment.uploadedBy?.lastname || ""}` ||
                                "Unknown"}{" "}
                              on{" "}
                              {format(
                                new Date(attachment.createdAt),
                                "MMM d, yyyy 'at' h:mm a",
                              )}
                            </p>
                            {isImageFile(attachment.fileName) && (
                              <div className="mt-2">
                                <img
                                  src={buildImageUrl(attachment.fileURL)}
                                  alt={attachment.fileName}
                                  className="h-32 w-auto rounded-md object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Paperclip size={48} className="mb-4 text-gray-400" />
                      <p className="text-lg text-gray-500 dark:text-gray-400">
                        No attachments yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Activity Modal Start */}
          {showActivityPopup && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
              onClick={() => setShowActivityPopup(false)}
            >
              <div
                className="relative max-h-[90vh] w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-dark-tertiary"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 rounded-t-lg bg-gray-50 px-6 py-4 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-semibold dark:text-gray-300">
                      Activity History
                    </h4>
                    <button
                      onClick={() => setShowActivityPopup(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-6">
                  {task.activityLogs && task.activityLogs.length > 0 ? (
                    <div className="space-y-4">
                      {task.activityLogs.map((log, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-600">
                            {getActivityIcon(log.action)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-lg font-medium dark:text-gray-300">
                                {log.user?.username || "Anonymous"}
                              </p>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {format(
                                  new Date(log.timestamp),
                                  "MMM d, yyyy 'at' h:mm a",
                                )}
                              </span>
                            </div>
                            <p className="mt-2 text-gray-600 dark:text-gray-300">
                              {formatActivityMessage(log)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Activity size={48} className="mb-4 text-gray-400" />
                      <p className="text-lg text-gray-500 dark:text-gray-400">
                        No activity yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Activity Modal End */}


          {/* Subtasks Modal Start */}
          {showSubtaskForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <SubtaskForm
                parentTaskId={task.id}
                onClose={() => {
                  setShowSubtaskForm(false);
                  setSelectedSubtask(null);
                }}
                onSubtaskCreated={() => {
                  setShowSubtasks(true);
                  setShowSubtaskForm(false);
                }}
                assignedUsers={task.assignedUsers || []}
                subtask={selectedSubtask}
                parentTaskName={task.title}
                clientName={getClientName(task.clientId)}
              />
            </div>
          )}
          {/* Subtasks Modal End */}

          {showTimeDetailsPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div
                ref={timeDetailsPopupRef}
                className="relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-dark-secondary"
              >
                <button
                  onClick={() => setShowTimeDetailsPopup(false)}
                  className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  ×
                </button>
                <h3 className="mb-4 text-lg font-semibold dark:text-gray-300">
                  Task Dates
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400">
                      Start Date:
                    </h4>
                    <p className="text-sm text-gray-800 dark:text-gray-300">
                      {formattedStartDate || "Not specified"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400">
                      Due Date:
                    </h4>
                    <p className="text-sm text-gray-800 dark:text-gray-300">
                      {formattedDueDate || "Not specified"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400">
                      Status:
                    </h4>
                    <p
                      className={`text-sm font-semibold ${
                        timeLeft?.color || "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {timeLeft?.text || "No due date"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Subtasks
          parentTaskId={task.id}
          parentTaskTitle={task.title}
          clientId={task.clientId}
          getClientName={getClientName}
          assignedUsers={task.assignedUsers || []}
        />
      </div>

      {isEditModalOpen && (
        <CreateTask
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          id={selectedTask?.clientId?.toString()}
          task={selectedTask}
        />
      )}

      <AlertDialog
        open={deleteTaskDialogOpen}
        onOpenChange={setDeleteTaskDialogOpen}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center gap-4">
            {/* Big centered alert icon */}
            <TriangleAlert className="h-12 w-12 text-destructive" />

            {/* Title and description stacked vertically */}
            <div className="space-y-2 text-center">
              <AlertDialogTitle>Move to Trash?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Are you sure you want to move the task to Trash?
              </AlertDialogDescription>
            </div>
          </div>

          {/* Buttons centered below */}
          <AlertDialogFooter className="gap-4 sm:justify-center">
            <AlertDialogCancel
              className="mt-2"
              onClick={() => setDeleteTaskDialogOpen(false)}
            >
              No, Keep it.
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (taskToDelete) {
                  try {
                    await softDeleteTask(taskToDelete.id).unwrap();
                    toast.success("Task Moved to Trash Successfully!");
                  } catch (error) {
                    console.error("Failed to soft delete the task:", error);
                    toast.error("Failed to move task to Trash!");
                  }
                }
                setDeleteTaskDialogOpen(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isSoftDeleting}
            >
              {isSoftDeleting ? "Moving..." : "Yes, Move to Trash!"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskCard;
