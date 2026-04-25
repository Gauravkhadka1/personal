import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Download,
  SquareCheckBig,
  RotateCcw,
  TriangleAlert,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Attachment,
  useDeleteTaskMutation,
  useGetSubtasksQuery,
  useUpdateTaskStatusMutation,
  useSoftDeleteSubtaskMutation,
  useRestoreSubtaskMutation,
  usePermanentlyDeleteSubtaskMutation,
} from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import CreateSubtask from "@/components/SubTask/CreateSubtask";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SubtaskCount from "@/components/SubTask/SubtaskCount";
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
import { Checkbox } from "@/components/ui/checkbox";
import SubtaskTimer from "@/components/SubTask/SubtaskTimer";

interface SubtasksProps {
  parentTaskId: number;
  parentTaskTitle: string;
  clientId: number;
  getClientName: (clientId: number) => string;
  assignedUsers: any[];
  showOnlyMyTasks?: boolean;
}

const Subtask = ({
  parentTaskId,
  parentTaskTitle,
  clientId,
  getClientName,
  assignedUsers,
  showOnlyMyTasks = false,
}: SubtasksProps) => {
  const { user } = useAuth();
  const userId = user?.userId?.toString();
  const isAdmin = user?.role === "ADMIN";
  const isAdminOrDesignerOrDeveloper =
    user?.role === "ADMIN" ||
    user?.role === "DESIGNER" ||
    user?.role === "DEVELOPER";
  const [hoveredSubtaskId, setHoveredSubtaskId] = useState<number | null>(null);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<any>(null);
  const [showAttachmentsPopup, setShowAttachmentsPopup] = useState(false);
  const [selectedSubtaskForAttachments, setSelectedSubtaskForAttachments] =
    useState<any>(null);

  const { data: subtasks = [], refetch: refetchSubtasks } = useGetSubtasksQuery(
    parentTaskId,
    { skip: false },
  );

  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [selectedSubtaskForInfo, setSelectedSubtaskForInfo] =
    useState<any>(null);

  const handleCheckboxClick = async (subtask: any) => {
    try {
      const newStatus = subtask.status === "Completed" ? "To Do" : "Completed";
      await updateTaskStatus({
        taskId: subtask.id,
        status: newStatus,
        updatedBy: userId!,
      }).unwrap();
      toast.success(`Subtask marked as ${newStatus}`);
      refetchSubtasks();
    } catch (error) {
      console.error("Failed to update subtask status:", error);
      toast.error("Failed to update subtask status");
    }
  };

  const [deleteTask] = useDeleteTaskMutation();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [softDeleteSubtask] = useSoftDeleteSubtaskMutation();
  const [restoreSubtask] = useRestoreSubtaskMutation();
  const [permanentlyDeleteSubtask] = usePermanentlyDeleteSubtaskMutation();

  // Filter subtasks based on showOnlyMyTasks flag
  const filteredSubtasks = showOnlyMyTasks
    ? subtasks.filter((subtask) =>
        subtask.assignedUsers?.some(
          (user) => String(user.userId) === String(userId),
        ),
      )
    : subtasks;

  const completedSubtasks = filteredSubtasks.filter(
    (subtask) => subtask.status === "Completed",
  );
  const incompleteSubtasks = filteredSubtasks.filter(
    (subtask) => subtask.status !== "Completed",
  );

  const statusOptions = [
    { value: "To Do", label: "To Do" },
    { value: "Work In Progress", label: "WIP" },
    { value: "QA", label: "QA" },
    { value: "Completed", label: "Done" },
  ];

  const statusColors: Record<string, string> = {
    "To Do": "bg-blue-100 text-blue-800",
    "Work In Progress": "bg-yellow-100 text-yellow-800",
    QA: "bg-purple-100 text-purple-800",
    Completed: "bg-green-100 text-green-800",
  };

  const statusDotColors: Record<string, string> = {
    "To Do": "bg-blue-500",
    "Work In Progress": "bg-yellow-500",
    QA: "bg-purple-500",
    Completed: "bg-green-500",
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

  const getSubtaskTimeLeft = (subtask: any) => {
    if (
      !subtask.dueDate ||
      subtask.status === "QA" ||
      subtask.status === "Completed"
    )
      return null;

    const now = new Date();
    const dueDate = new Date(subtask.dueDate);
    const diffMs = dueDate.getTime() - now.getTime();

    if (diffMs < 0) {
      const overdueMinutes = Math.abs(Math.floor(diffMs / (1000 * 60)));
      const overdueHours = Math.abs(Math.floor(diffMs / (1000 * 60 * 60)));
      const overdueDays = Math.floor(overdueHours / 24);
      const overdueRemainingHours = overdueHours % 24;

      if (overdueMinutes < 60) {
        return {
          text: `${overdueMinutes}m overdue`,
          color: "text-red-600 dark:text-red-500",
        };
      } else if (overdueHours < 24) {
        return {
          text: `${overdueHours}h overdue`,
          color: "text-red-600 dark:text-red-500",
        };
      } else {
        return {
          text: `${overdueDays}d ${overdueRemainingHours}h overdue`,
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
          text: `${daysLeft}d ${remainingHours}h left`,
          color: "text-green-600 dark:text-green-500",
        };
      }
    }
  };

  const [deleteSubtaskDialogOpen, setDeleteSubtaskDialogOpen] = useState(false);
  const [subtaskToDelete, setSubtaskToDelete] = useState<any>(null);
  const [isSoftDeletingSubtask, setIsSoftDeletingSubtask] = useState(false);

  // Replace the handleSoftDeleteSubtask function with:
  const handleSoftDeleteSubtaskClick = async (subtask: any) => {
    setSubtaskToDelete(subtask);
    setDeleteSubtaskDialogOpen(true);
  };

  const handleStatusChange = async (subtaskId: number, newStatus: string) => {
    try {
      await updateTaskStatus({
        taskId: subtaskId,
        status: newStatus,
        updatedBy: userId!,
      }).unwrap();
      toast.success(`Subtask status updated to ${newStatus}`);
      refetchSubtasks();
    } catch (error) {
      console.error("Failed to update subtask status:", error);
      toast.error("Failed to update subtask status");
    }
  };

  const handleSubtaskCreated = () => {
    refetchSubtasks();
    setShowSubtaskForm(false);
    setSelectedSubtask(null);
  };

  if (filteredSubtasks.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
        <SubtaskCount
          completed={completedSubtasks.length}
          total={filteredSubtasks.length}
          onAddSubtask={() => setShowSubtaskForm(true)}
          onToggleSubtasks={() => setShowSubtasks(!showSubtasks)}
          isSubtasksOpen={showSubtasks}
        />
      </div>

      {showSubtasks && (
        <div className="mt-2 space-y-2">
          {/* Incomplete Subtasks */}
          {incompleteSubtasks.map((subtask) => {
  const currentStatus = subtask.status ?? "To Do";
  const statusColorClasses = statusColors[currentStatus] || statusColors["To Do"];
  const dotColor = statusDotColors[currentStatus] || statusDotColors["To Do"];

  return (
    <div
      key={subtask.id}
      className="group relative mb-2 flex items-center rounded-md bg-gray-50 p-3 dark:bg-[#333] border dark:border-gray-600"
      onMouseEnter={() => setHoveredSubtaskId(subtask.id)}
      onMouseLeave={() => setHoveredSubtaskId(null)}
    >
      {/* Checkbox */}
      <div className="mr-3 flex items-center">
        <Checkbox
          checked={subtask.status === "Completed"}
          onCheckedChange={() => handleCheckboxClick(subtask)}
          className="h-5 w-5 rounded-md border-gray-300 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 dark:border-gray-600"
        />
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Subtask Title */}
            <div className="text-sm font-medium dark:text-gray-300">
              {subtask.title}
            </div>

            {/* Info Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSubtaskForInfo(subtask);
                setShowInfoPopup(true);
              }}
              className="flex px-1.5 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300"
            >
              i
            </button>
          </div>

          
          <div className="flex items-center gap-2">
            <SubtaskTimer
              subtaskId={subtask.id}
              initialIsRunning={subtask.isTimerRunning || false}
              initialTimerStartTime={subtask.timerStartTime || null}
              initialTimeSpent={subtask.timeSpent || 0}
            />
          </div>
        

          {/* Assigned Users */}
          <div>
            {subtask.assignedUsers && subtask.assignedUsers.length > 0 && (
              <div className="flex items-center -space-x-2">
                {subtask.assignedUsers.map((user) => (
                  <div key={user.userId} className="relative">
                    {user.profilePictureUrl ? (
                      <Avatar className="h-6 w-6 cursor-pointer border dark:border-gray-600">
                        <AvatarImage
                          src={buildImageUrl(user.profilePictureUrl)}
                          alt={`${user.firstname} ${user.lastname}`}
                        />
                        <AvatarFallback className="text-xs dark:text-gray-400">
                          {user.firstname?.charAt(0)}
                          {user.lastname?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-medium dark:border-dark-secondary dark:bg-gray-600 dark:text-gray-400">
                        {user.firstname?.charAt(0)}
                        {user.lastname?.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      
      

        {/* Edit/Delete Icons (on hover) */}
        <div
          className={`absolute right-2 top-2 flex items-center gap-1 rounded-md border border-gray-400 bg-white px-2 py-1 transition-opacity duration-200 dark:border-gray-500 dark:bg-gray-800 ${
            hoveredSubtaskId === subtask.id ? "opacity-100" : "opacity-0"
          }`}
        >
          <Pencil
            className="h-3 w-3 cursor-pointer hover:text-blue-500 dark:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSubtask(subtask);
              setShowSubtaskForm(true);
            }}
          />
          {isAdminOrDesignerOrDeveloper && (
            <Trash2
              className="h-3 w-3 cursor-pointer hover:text-red-500 dark:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                handleSoftDeleteSubtaskClick(subtask);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
})}

          {/* Completed Subtasks Section */}
          {completedSubtasks.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm text-muted-foreground">Completed</p>
              {completedSubtasks.map((subtask) => {
                const currentStatus = subtask.status ?? "To Do";
                const statusColorClasses =
                  statusColors[currentStatus] || statusColors["To Do"];
                const dotColor =
                  statusDotColors[currentStatus] || statusDotColors["To Do"];

                return (
                  <div
                    key={subtask.id}
                    className="group relative mb-2 flex items-start rounded-md bg-gray-50 p-3 opacity-70 dark:bg-gray-800"
                    onMouseEnter={() => setHoveredSubtaskId(subtask.id)}
                    onMouseLeave={() => setHoveredSubtaskId(null)}
                  >
                    {/* Checkbox */}
                    <div className="mr-3 flex items-center">
                      <Checkbox
                        checked={subtask.status === "Completed"}
                        onCheckedChange={() => handleCheckboxClick(subtask)}
                        className="h-5 w-5 rounded-md border-gray-300 data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 dark:border-gray-600"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Subtask Title with strikethrough */}
                          <div className="text-sm font-medium text-muted-foreground line-through dark:text-gray-300">
                            {subtask.title}
                          </div>

                          {/* Info Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSubtaskForInfo(subtask);
                              setShowInfoPopup(true);
                            }}
                            className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300"
                          >
                            i
                          </button>
                        </div>

                        {/* Assigned Users */}
                        <div>
                          {subtask.assignedUsers &&
                            subtask.assignedUsers.length > 0 && (
                              <div className="flex items-center -space-x-2">
                                {subtask.assignedUsers.map((user) => (
                                  <div key={user.userId} className="relative">
                                    {user.profilePictureUrl ? (
                                      <Avatar className="h-6 w-6 cursor-pointer border dark:border-gray-600">
                                        <AvatarImage
                                          src={buildImageUrl(
                                            user.profilePictureUrl,
                                          )}
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
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Edit/Delete Icons (on hover) */}
                      <div
                        className={`absolute right-2 top-2 flex items-center gap-1 rounded-md border border-gray-400 bg-white px-2 py-1 transition-opacity duration-200 dark:border-gray-500 dark:bg-gray-800 ${
                          hoveredSubtaskId === subtask.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      >
                        <Pencil
                          className="h-3 w-3 cursor-pointer hover:text-blue-500 dark:text-gray-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubtask(subtask);
                            setShowSubtaskForm(true);
                          }}
                        />
                        {isAdminOrDesignerOrDeveloper && (
                          <Trash2
                            className="h-3 w-3 cursor-pointer hover:text-red-500 dark:text-gray-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSoftDeleteSubtaskClick(subtask);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* Info Popup */}
      {showInfoPopup && selectedSubtaskForInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setShowInfoPopup(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-dark-tertiary"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 rounded-t-lg bg-gray-50 px-6 py-4 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-semibold dark:text-gray-300">
                  {selectedSubtaskForInfo.title}
                </h4>
                <button
                  onClick={() => setShowInfoPopup(false)}
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
              <div className="space-y-4">
                {selectedSubtaskForInfo.startDate && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Start Date
                    </h5>
                    <p className="text-sm dark:text-gray-300">
                      {format(
                        new Date(selectedSubtaskForInfo.startDate),
                        "MMM d, yyyy 'at' h:mm a",
                      )}
                    </p>
                  </div>
                )}

                {selectedSubtaskForInfo.dueDate && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Due Date
                    </h5>
                    <p className="text-sm dark:text-gray-300">
                      {format(
                        new Date(selectedSubtaskForInfo.dueDate),
                        "MMM d, yyyy 'at' h:mm a",
                      )}
                    </p>
                  </div>
                )}

                {getSubtaskTimeLeft(selectedSubtaskForInfo) && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Time Remaining
                    </h5>
                    <p
                      className={`text-sm font-semibold ${getSubtaskTimeLeft(selectedSubtaskForInfo)?.color}`}
                    >
                      {getSubtaskTimeLeft(selectedSubtaskForInfo)?.text}
                    </p>
                  </div>
                )}

                {selectedSubtaskForInfo.attachments &&
                  selectedSubtaskForInfo.attachments.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Attachments ({selectedSubtaskForInfo.attachments.length}
                        )
                      </h5>
                      <div className="mt-2 space-y-2">
                        {selectedSubtaskForInfo.attachments
                          .slice(0, 3)
                          .map((attachment: Attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-2"
                            >
                              {getFileIcon(attachment.fileName)}
                              <span className="text-sm dark:text-gray-300">
                                {attachment.fileName}
                              </span>
                            </div>
                          ))}
                        {selectedSubtaskForInfo.attachments.length > 3 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            +{selectedSubtaskForInfo.attachments.length - 3}{" "}
                            more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAttachmentsPopup && selectedSubtaskForAttachments && (
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
                  Attachments for {selectedSubtaskForAttachments.title}
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
              {selectedSubtaskForAttachments.attachments &&
              selectedSubtaskForAttachments.attachments.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {selectedSubtaskForAttachments.attachments.map(
                    (attachment: Attachment) => (
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
                    ),
                  )}
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

      {showSubtaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <CreateSubtask
            parentTaskId={parentTaskId}
            onClose={() => {
              setShowSubtaskForm(false);
              setSelectedSubtask(null);
            }}
            onSubtaskCreated={handleSubtaskCreated}
            assignedUsers={assignedUsers}
            subtask={selectedSubtask}
            parentTaskName={parentTaskTitle}
            clientName={getClientName(clientId)}
          />
        </div>
      )}

      <AlertDialog
        open={deleteSubtaskDialogOpen}
        onOpenChange={setDeleteSubtaskDialogOpen}
      >
        <AlertDialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center gap-4">
            {/* Big centered alert icon */}
            <TriangleAlert className="h-12 w-12 text-destructive" />

            {/* Title and description stacked vertically */}
            <div className="space-y-2 text-center">
              <AlertDialogTitle>Move to Trash?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Are you sure you want to move this subtask to Trash?
              </AlertDialogDescription>
            </div>
          </div>

          {/* Buttons centered below */}
          <AlertDialogFooter className="gap-4 sm:justify-center">
            <AlertDialogCancel
              className="mt-2"
              onClick={() => setDeleteSubtaskDialogOpen(false)}
            >
              No, Keep it.
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (subtaskToDelete) {
                  setIsSoftDeletingSubtask(true);
                  try {
                    await softDeleteSubtask(subtaskToDelete.id).unwrap();
                    toast.success("Subtask moved to Trash!");
                    refetchSubtasks();
                  } catch (error) {
                    console.error("Failed to soft delete the subtask:", error);
                    toast.error("Failed to move subtask to Trash!");
                  } finally {
                    setIsSoftDeletingSubtask(false);
                  }
                }
                setDeleteSubtaskDialogOpen(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isSoftDeletingSubtask}
            >
              {isSoftDeletingSubtask ? "Moving..." : "Yes, Move to Trash!"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Subtask;
