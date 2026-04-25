import {
  useGetClientsQuery,
  useCreateTaskMutation,
  useGetUsersQuery,
  useUpdateTaskMutation,
  useAddCommentToTaskMutation,
  Task,
  useDeleteAttachmentMutation,
  useCreateSubtaskMutation,
  Attachment,
} from "@/state/api";
import Modal from "@/components/Modal";
import React, { useState, useEffect, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatISO, format } from "date-fns";
import { Status, Priority } from "@/state/api";
import { setHours } from "date-fns/setHours";
import { setMinutes } from "date-fns/setMinutes";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUploadAttachmentMutation } from "@/state/api";
import { FileUploader } from "react-drag-drop-files";
import { FileIcon, defaultStyles } from "react-file-icon";
import {
  FiX,
  FiUpload,
  FiCalendar,
  FiUser,
  FiFlag,
  FiClock,
  FiTrash2,
  FiEye,
  FiCheck,
} from "react-icons/fi";
import RichTextEditor from "@/components/RichTextEditor";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string | null;
  task?: any;
  onTaskCreatedOrUpdated?: () => void;
  assignedUsers?: any[];
   preSelectedAssigneeId?: string;
};

type TaskCreationResponse = {
  id: number;
  // Add other properties that your API returns when creating a task
};

type TaskCategory =
  | "Design"
  | "Development"
  | "ContentFillup"
  | "AMC"
  | "Other";
type ProjectType = "Portfolio" | "Ecommerce" | "Custom" | null;
type Page = {
  name: string;
  selected: boolean;
};

const CreateTask = ({
  isOpen,
  onClose,
  id = null,
  task = null,
  assignedUsers = [],
  onTaskCreatedOrUpdated,
   preSelectedAssigneeId, 
}: Props) => {
  const { user } = useAuth();
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [createSubtask] = useCreateSubtaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [addComment] = useAddCommentToTaskMutation();
  const { data: users, isLoading: isUsersLoading } = useGetUsersQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>(Status.ToDo);
  const [priority, setPriority] = useState<Priority>(Priority.Normal);
  const [tags, setTags] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const assignedBy = user?.email || "";
  const [searchKeyword, setSearchKeyword] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const { data: clients, isLoading: isClientsLoading } = useGetClientsQuery();
  const [category, setCategory] = useState<TaskCategory>("Design");

  // Page selection state
  const [showPageSelection, setShowPageSelection] = useState(false);
  const [projectType, setProjectType] = useState<ProjectType>(null);
  const [portfolioPages, setPortfolioPages] = useState<Page[]>([
    { name: "Home", selected: true },
    { name: "About", selected: true },
    { name: "Mission Vision", selected: true },
    { name: "Team", selected: true },
    { name: "Why Us", selected: true },
    { name: "Service", selected: true },
    { name: "Service Detail", selected: true },
    { name: "Product", selected: true },
    { name: "Product Detail", selected: true },
    { name: "Gallery", selected: true },
    { name: "Gallery Detail", selected: true },
    { name: "Blog", selected: true },
    { name: "Blog Detail", selected: true },
    { name: "FAQ", selected: true },
    { name: "Testimonial", selected: true },
    { name: "Contact", selected: true },
    { name: "Career", selected: true },
    { name: "404", selected: true },
  ]);

  const [ecommercePages, setEcommercePages] = useState<Page[]>([
    { name: "Home", selected: true },
    { name: "Product", selected: true },
    { name: "Product Detail", selected: true },
    { name: "Cart", selected: true },
    { name: "Checkout", selected: true },
    { name: "Order Confirmation", selected: true },
    { name: "Login", selected: true },
    { name: "Signup", selected: true },
    { name: "Forgot Password", selected: true },
    { name: "Dashboard", selected: true },
    { name: "Order History", selected: true },
    { name: "Wishlist", selected: true },
    { name: "Search Result", selected: true },
    { name: "About", selected: true },
    { name: "Contact", selected: true },
    { name: "FAQ", selected: true },
    { name: "Policy", selected: true },
    { name: "Terms & Conditions", selected: true },
    { name: "Blog", selected: true },
    { name: "Testimonial", selected: true },
    { name: "404", selected: true },
  ]);

  // Custom pages state
  const [customPages, setCustomPages] = useState<Page[]>([]);
  const [customPageInput, setCustomPageInput] = useState("");

  // Comment functionality
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [dateChangeComment, setDateChangeComment] = useState("");
  const [dateChanges, setDateChanges] = useState<{
    start?: { previous: Date | null; new: Date | null };
    due?: { previous: Date | null; new: Date | null };
  }>({});
  const formDataRef = useRef<any>(null);

  // File upload states
  const fileTypes = [
    "JPG",
    "JPEG",
    "PNG",
    "GIF",
    "PDF",
    "DOC",
    "DOCX",
    "XLS",
    "XLSX",
  ];
  const [files, setFiles] = useState<File[]>([]);
  const [uploadAttachment] = useUploadAttachmentMutation();
  const [deleteAttachment] = useDeleteAttachmentMutation();
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<number[]>([]);

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  const fileUploaderStyles = {
    width: "100%",
    height: "100px",
    border: "2px dashed hsl(var(--border))",
    borderRadius: "0.375rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    marginBottom: "1rem",
  };

  const handleFileChange = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    setFiles((prevFiles) => [...prevFiles, ...fileArray]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const uploadFiles = async (taskId: number) => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      await uploadAttachment({
        taskId,
        formData,
      }).unwrap();
      setFiles([]);
    } catch (error) {
      console.error("Error uploading attachments:", error);
      toast.error("Failed to upload some attachments");
    }
  };

  const handleDeleteAttachment = (attachmentId: number) => {
    setAttachmentsToDelete((prev) => [...prev, attachmentId]);
  };

  const clientOptions = clients
    ?.map((client) => ({
      value: client.id.toString(),
      label: client.domainName || client.companyName || "Unnamed Client",
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Add "No Project" option
  const clientOptionsWithNone = [
    { value: "", label: "No Project" },
    ...(clientOptions || []),
  ];

  const safeUserId = user?.userId ? user.userId.toString() : "";

  const userOptions = users
    ?.map((user) => ({
      value: user.userId?.toString() || "",
      label: user.username || user.email || "Unknown User",
      profilePictureUrl: user.profilePictureUrl,
      firstname: user.firstname,
      lastname: user.lastname,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const formatOptionLabel = ({
    label,
    profilePictureUrl,
    firstname,
    lastname,
  }: any) => (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        {profilePictureUrl ? (
          <AvatarImage
            src={buildImageUrl(profilePictureUrl)}
            alt={`${label}'s profile`}
          />
        ) : (
          <AvatarFallback className="text-xs">
            {firstname?.charAt(0)}
            {lastname?.charAt(0)}
          </AvatarFallback>
        )}
      </Avatar>
      <span>{label}</span>
    </div>
  );

  useEffect(() => {
    if (task) {
      // For duplicates, use the assignedTo array directly
      const assignedUsers = task._isDuplicate
        ? task.assignedTo
        : task.assignedUsers
          ? task.assignedUsers.map((user: any) => user.userId.toString())
          : task.assignedTo || [];

      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || Status.ToDo);
      setPriority(task.priority || Priority.Normal);
      setTags(task.tags || "");
      setStartDate(task.startDate ? new Date(task.startDate) : null);
      setDueDate(task.dueDate ? new Date(task.dueDate) : null);
      setAssignedTo(assignedUsers);
      setClientId(task.clientId?.toString() || "");
      setCategory(task.category || "Design");
    } else {
      // Reset form for new tasks
      setTitle("");
      setDescription("");
      setStatus(Status.ToDo);
      setPriority(Priority.Normal);
      setTags("");
      setStartDate(new Date());
      setDueDate(null);
        setAssignedTo(preSelectedAssigneeId ? [preSelectedAssigneeId] : []);
      setClientId(id || ""); // Can be empty string for no project
      setCategory("Design");
      setShowPageSelection(false);
      setProjectType(null);
      setPortfolioPages(portfolioPages.map((p) => ({ ...p, selected: true })));
      setEcommercePages(ecommercePages.map((p) => ({ ...p, selected: true })));
      setCustomPages([]);
      setCustomPageInput("");
    }
  }, [task, id, preSelectedAssigneeId]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);

    if (value.trim().toLowerCase() === "start design") {
      setShowPageSelection(true);
    } else if (showPageSelection) {
      setShowPageSelection(false);
      setProjectType(null);
    }
  };

  const togglePageSelection = (pageName: string, isPortfolio: boolean) => {
    if (isPortfolio) {
      setPortfolioPages((prev) =>
        prev.map((page) =>
          page.name === pageName ? { ...page, selected: !page.selected } : page,
        ),
      );
    } else {
      setEcommercePages((prev) =>
        prev.map((page) =>
          page.name === pageName ? { ...page, selected: !page.selected } : page,
        ),
      );
    }
  };

  const handleCustomPageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPageInput(e.target.value);
  };

  const addCustomPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && customPageInput.trim()) {
      e.preventDefault();
      const pageName = customPageInput.trim();
      if (!customPages.some((page) => page.name === pageName)) {
        setCustomPages([...customPages, { name: pageName, selected: true }]);
      }
      setCustomPageInput("");
    }
  };

  const removeCustomPage = (pageName: string) => {
    setCustomPages(customPages.filter((page) => page.name !== pageName));
  };

  const toggleCustomPageSelection = (pageName: string) => {
    setCustomPages((prev) =>
      prev.map((page) =>
        page.name === pageName ? { ...page, selected: !page.selected } : page,
      ),
    );
  };

  const createSubtasksFromSelectedPages = async () => {
    let selectedPages: Page[] = [];

    if (projectType === "Portfolio") {
      selectedPages = portfolioPages.filter((page) => page.selected);
    } else if (projectType === "Ecommerce") {
      selectedPages = ecommercePages.filter((page) => page.selected);
    } else if (projectType === "Custom") {
      selectedPages = customPages.filter((page) => page.selected);
    }

    if (selectedPages.length === 0) {
      toast.error("Please select at least one page");
      return;
    }

    try {
      const taskData: Partial<Task> = {
        title,
        description,
        priority,
        status: Status.ToDo,
        startDate: startDate ? formatISO(startDate) : undefined,
        dueDate: dueDate ? formatISO(dueDate) : undefined,
        assignedTo,
        assignedBy,
        category,
      };

      // Only add clientId if it has a value
      if (clientId && clientId.trim() !== "") {
        taskData.clientId = Number(clientId);
      }

      toast.success(
        <div className="flex flex-col">
          <span className="font-semibold">Main Task Created Successfully</span>
          <span className="text-sm">Creating Subtasks...</span>
        </div>,
        {
          duration: 4000, // Show for 4 seconds
        },
      );

      const result = await createTask(taskData).unwrap();

      // Create subtasks for each selected page
      for (const page of selectedPages) {
        // Only add "Page" for Portfolio and Ecommerce, not for Custom
        const subtaskTitle =
          projectType === "Custom" ? page.name : `${page.name} Page`;

        await createSubtask({
          parentTaskId: result.id,
          taskData: {
            title: subtaskTitle,
            status: Status.ToDo,
            assignedTo,
            assignedBy,
          },
        }).unwrap();
      }

      // Upload files after task is created
      if (files.length > 0 && result?.id) {
        await uploadFiles(result.id);
      }

      if (onTaskCreatedOrUpdated) {
        onTaskCreatedOrUpdated();
      }

      onClose();
    } catch (error) {
      toast.error("An error occurred while creating the task and subtasks.");
    }
  };

  const checkForDateChanges = () => {
    if (!task) return false;

    const changes: typeof dateChanges = {};
    let hasChanges = false;

    if (task.startDate) {
      if (startDate?.getTime() !== new Date(task.startDate).getTime()) {
        changes.start = {
          previous: task.startDate ? new Date(task.startDate) : null,
          new: startDate,
        };
        hasChanges = true;
      }
    }

    if (task.dueDate) {
      if (dueDate?.getTime() !== new Date(task.dueDate).getTime()) {
        changes.due = {
          previous: task.dueDate ? new Date(task.dueDate) : null,
          new: dueDate,
        };
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setDateChanges(changes);
    }

    return hasChanges;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Update validation: clientId is now optional
    if (!title || assignedTo.length === 0 || !category) {
      toast.error("Title, Category and at least one assignee are required");
      return;
    }

    // For duplicates, skip date change checks and just submit
    if (task?._isDuplicate) {
      await submitTask();
      return;
    }

    // For regular updates, check for date changes
    if (task) {
      const hasDateChanges = checkForDateChanges();
      if (hasDateChanges) {
        formDataRef.current = {
          title,
          description,
          status: Status.ToDo,
          priority,
          tags,
          startDate,
          dueDate,
          assignedTo,
          clientId,
          assignedBy,
          category,
        };
        setShowCommentModal(true);
        return;
      }
    }

    await submitTask();
  };

  const submitTask = async (taskDataOverride?: Partial<Task>) => {
    // Always use current form state values for duplicated tasks
    const isDuplicate = task?._isDuplicate;
    const taskData: Partial<Task> = {
      title,
      description,
      priority,
      status: status || undefined,
      startDate: startDate ? formatISO(startDate) : undefined,
      dueDate: dueDate ? formatISO(dueDate) : undefined,
      assignedTo: Array.isArray(assignedTo) ? assignedTo : [],
      assignedBy: assignedBy,
      category,
      ...(!isDuplicate && taskDataOverride ? taskDataOverride : {}), // Only apply override for non-duplicates
    };

    // Handle clientId - send null if "No Project" is selected, otherwise send the number
    if (clientId === "" || clientId === null) {
      // User wants to remove the project association
      taskData.clientId = null as any; // Send null to remove association
    } else if (clientId && clientId.trim() !== "") {
      // User selected a specific project
      taskData.clientId = Number(clientId);
    }
    // If clientId is undefined, don't include it in the update (keep existing)

    try {
      let result: TaskCreationResponse;
      if (task && !isDuplicate) {
        // Update existing task (non-duplicate)
        result = await updateTask({
          taskId: task.id,
          taskData,
        }).unwrap();
        toast.success("Task updated successfully!");

        // Handle attachment deletions for updates
        if (attachmentsToDelete.length > 0) {
          await Promise.all(
            attachmentsToDelete.map((attachmentId) =>
              deleteAttachment({
                taskId: task.id,
                attachmentId,
              }).unwrap(),
            ),
          );
          setAttachmentsToDelete([]);
        }
      } else {
        // Create new task (including duplicates)
        result = await createTask(taskData).unwrap();
        toast.success("Task created successfully!");

        // Handle subtask duplication if this is a duplicate
        if (isDuplicate && task?._duplicatedSubtasks?.length > 0) {
          await Promise.all(
            task._duplicatedSubtasks.map((subtask: any) =>
              createSubtask({
                parentTaskId: result.id,
                taskData: {
                  title: subtask.title,
                  status: Status.ToDo,
                  startDate: subtask.startDate,
                  dueDate: subtask.dueDate,
                  assignedTo: taskData.assignedTo, // Use the current assignedTo
                  assignedBy: assignedBy,
                },
              }).unwrap(),
            ),
          );
        }
      }

      // Upload new files if any
      if (files.length > 0 && result.id) {
        await uploadFiles(result.id);
      }

      if (onTaskCreatedOrUpdated) {
        onTaskCreatedOrUpdated();
      }

      onClose();
    } catch (error) {
      console.error("Error submitting task:", error);
      toast.error("An error occurred while saving the task.");
    }
  };

  const confirmDateChange = async () => {
    if (!dateChangeComment.trim()) {
      toast.error("Please enter a reason for the date change");
      return;
    }

    try {
      if (user?.userId && task?.id) {
        const comments: Promise<any>[] = [];

        if (dateChanges.start) {
          const commentContent = `${
            user.username || user.email
          } changed the start date from ${
            dateChanges.start.previous
              ? format(dateChanges.start.previous, "MMM d, yyyy hh:mm a")
              : "N/A"
          } to ${
            dateChanges.start.new
              ? format(dateChanges.start.new, "MMM d, yyyy hh:mm a")
              : "N/A"
          }\n\nReason: ${dateChangeComment}`;

          comments.push(
            addComment({
              taskId: task.id,
              content: commentContent,
              userId: Number(user.userId),
            }).unwrap(),
          );
        }

        if (dateChanges.due) {
          const commentContent = `${
            user.username || user.email
          } changed the due date from ${
            dateChanges.due.previous
              ? format(dateChanges.due.previous, "MMM d, yyyy hh:mm a")
              : "N/A"
          } to ${
            dateChanges.due.new
              ? format(dateChanges.due.new, "MMM d, yyyy hh:mm a")
              : "N/A"
          }\n\nReason: ${dateChangeComment}`;

          comments.push(
            addComment({
              taskId: task.id,
              content: commentContent,
              userId: Number(user.userId),
            }).unwrap(),
          );
        }

        await Promise.all(comments);
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment for date change");
    }

    setDateChangeComment("");
    setShowCommentModal(false);

    if (formDataRef.current) {
      const {
        title,
        description,
        status,
        priority,
        tags,
        startDate,
        dueDate,
        assignedTo,
        clientId,
        assignedBy,
      } = formDataRef.current;

      setTitle(title);
      setDescription(description);
      setStatus(status);
      setPriority(priority);
      setTags(tags);
      setStartDate(startDate);
      setDueDate(dueDate);
      setAssignedTo(assignedTo);
      setClientId(clientId);

      formDataRef.current = null;
    }

    await submitTask();
  };

  const formatDateForDisplay = (date: Date | null) => {
    return date ? format(date, "MMM d, yyyy hh:mm a") : "N/A";
  };

  return (
    <div className="dark:bg-secondary">
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        name={
          task
            ? task._isDuplicate
              ? "Duplicate Task"
              : "Edit Task"
            : "Create New Task"
        }
      >
        <form
          className="mt-4 space-y-6 rounded-md bg-white pt-2 text-gray-900 dark:bg-secondary dark:text-gray-100"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="mb-1 block text-sm font-medium dark:text-gray-200">
              Title *
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-secondary dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
              placeholder="Type 'Start Design' if you want pages for subtasks"
              value={title}
              onChange={handleTitleChange}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium dark:text-gray-200">
              Description
            </label>
            <RichTextEditor
              content={description}
              onContentChange={setDescription}
              placeholder="Enter task description..."
              className="min-h-[50px] dark:bg-secondary"
            />
          </div>

          {showPageSelection && (
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-4 text-sm font-medium">Select Project Type</h3>
              <div className="mb-6 flex gap-4">
                <button
                  type="button"
                  className={`flex-1 rounded-md border p-3 text-center ${
                    projectType === "Portfolio"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  onClick={() => setProjectType("Portfolio")}
                >
                  Portfolio
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-md border p-3 text-center ${
                    projectType === "Ecommerce"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  onClick={() => setProjectType("Ecommerce")}
                >
                  Ecommerce
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-md border p-3 text-center ${
                    projectType === "Custom"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  onClick={() => setProjectType("Custom")}
                >
                  Custom
                </button>
              </div>

              {projectType && (
                <>
                  <h3 className="mb-3 text-sm font-medium">
                    Select Pages for {projectType} Project
                  </h3>

                  {projectType === "Custom" ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="flex-1 rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-secondary-dark"
                          placeholder="Type page name and press Enter"
                          value={customPageInput}
                          onChange={handleCustomPageInput}
                          onKeyDown={addCustomPage}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {customPages.map((page) => (
                          <div
                            key={page.name}
                            className={`flex items-center justify-between rounded-md border p-3 ${
                              page.selected
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                          >
                            <span>{page.name}</span>
                            <div className="flex items-center gap-1">
                              {page.selected && (
                                <FiCheck className="text-blue-500" />
                              )}
                              <button
                                type="button"
                                onClick={() => removeCustomPage(page.name)}
                                className="ml-1 text-red-500 hover:text-red-700"
                              >
                                <FiX />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {(projectType === "Portfolio"
                        ? portfolioPages
                        : ecommercePages
                      ).map((page) => (
                        <button
                          key={page.name}
                          type="button"
                          className={`flex items-center justify-between rounded-md border p-3 ${
                            page.selected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          onClick={() =>
                            togglePageSelection(
                              page.name,
                              projectType === "Portfolio",
                            )
                          }
                        >
                          <span>{page.name}</span>
                          {page.selected && (
                            <FiCheck className="text-blue-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Task Category */}
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-gray-200">
                Task Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-secondary dark:text-gray-100 dark:focus:ring-blue-400"
                required
              >
                <option value="">Select Category *</option>
                <option value="Design">Design</option>
                <option value="Development">Development</option>
                <option value="ContentFillup">Content Fillup</option>
                <option value="AMC">AMC</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Project - Now Optional */}
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-gray-200">
                Project <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <Select
                options={clientOptionsWithNone}
                value={
                  clientOptionsWithNone?.find((option) => option.value === clientId) ||
                  null
                }
                onChange={(selectedOption) =>
                  setClientId(selectedOption?.value || "")
                }
                placeholder="Select Project (Optional)"
                isSearchable
                isClearable
                className="react-select-container"
                classNamePrefix="react-select"
                isLoading={isClientsLoading}
                noOptionsMessage={() => "No clients found"}
                styles={{
                  control: (base, { isFocused }) => ({
                    ...base,
                    backgroundColor: "hsl(var(--secondary))",
                    borderColor: isFocused
                      ? "hsl(var(--ring))"
                      : "hsl(var(--border))",
                    borderWidth: "1px",
                    borderRadius: "0.5rem",
                    boxShadow: isFocused
                      ? "0 0 0 1px hsl(var(--ring))"
                      : "none",
                    "&:hover": {
                      borderColor: "hsl(var(--ring))",
                    },
                    "@media (prefers-color-scheme: dark)": {
                      borderColor: isFocused
                        ? "hsl(var(--ring))"
                        : "rgba(255, 255, 255, 0.1)",
                    },
                    maxHeight: "20px",
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "hsl(var(--secondary))",
                    borderColor: "hsl(var(--border))",
                    borderWidth: "1px",
                    borderRadius: "0.5rem",
                    marginTop: "4px",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    zIndex: 9999,
                  }),
                  menuList: (base) => ({
                    ...base,
                    padding: 0,
                  }),
                  option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    backgroundColor: isSelected
                      ? "hsl(var(--accent))"
                      : isFocused
                        ? "hsl(var(--accent))"
                        : "transparent",
                    color:
                      isSelected || isFocused
                        ? "hsl(var(--accent-foreground))"
                        : "hsl(var(--secondary-foreground))",
                    borderBottom: "1px solid hsl(var(--border))",
                    "&:last-child": {
                      borderBottom: "none",
                    },
                    "&:active": {
                      backgroundColor: "hsl(var(--accent))",
                    },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "hsl(var(--secondary-foreground))",
                  }),
                  input: (base) => ({
                    ...base,
                    color: "hsl(var(--secondary-foreground))",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "hsl(var(--muted-foreground))",
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    color: "hsl(var(--muted-foreground))",
                    "&:hover": {
                      color: "hsl(var(--secondary-foreground))",
                    },
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    color: "hsl(var(--muted-foreground))",
                    "&:hover": {
                      color: "hsl(var(--secondary-foreground))",
                    },
                  }),
                  indicatorSeparator: (base) => ({
                    ...base,
                    backgroundColor: "hsl(var(--border))",
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: "8px 12px",
                  }),
                }}
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="mb-1 block text-sm font-medium dark:text-gray-200">
                Assign To *
              </label>
              <Select
                options={userOptions}
                value={
                  userOptions?.filter((option) =>
                    assignedTo.includes(option.value),
                  ) || []
                }
                onChange={(selectedOptions) =>
                  setAssignedTo(
                    selectedOptions
                      ? selectedOptions.map((option) => option.value)
                      : [],
                  )
                }
                placeholder="Select Teams"
                isMulti
                isSearchable
                className="react-select-container"
                classNamePrefix="react-select"
                isLoading={isUsersLoading}
                noOptionsMessage={() => "No users found"}
                formatOptionLabel={formatOptionLabel}
                styles={{
                  control: (base, { isFocused }) => ({
                    ...base,
                    backgroundColor: "hsl(var(--secondary))",
                    borderColor: isFocused
                      ? "hsl(var(--ring))"
                      : "hsl(var(--border))",
                    borderWidth: "1px",
                    borderRadius: "0.5rem",
                    boxShadow: isFocused
                      ? "0 0 0 1px hsl(var(--ring))"
                      : "none",
                    "&:hover": {
                      borderColor: "hsl(var(--ring))",
                    },
                        "@media (prefers-color-scheme: dark)": {
                      borderColor: isFocused
                        ? "hsl(var(--ring))"
                        : "rgba(255, 255, 255, 0.1)",
                    },
                    maxHeight: "20px",
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "hsl(var(--secondary))",
                    borderColor: "hsl(var(--border))",
                    borderWidth: "1px",
                    borderRadius: "0.5rem",
                    marginTop: "4px",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    zIndex: 9999,
                  }),
                  menuList: (base) => ({
                    ...base,
                    padding: 0,
                  }),
                  option: (base, { isFocused, isSelected }) => ({
                    ...base,
                    backgroundColor: isSelected
                      ? "hsl(var(--accent))"
                      : isFocused
                        ? "hsl(var(--accent))"
                        : "transparent",
                    color:
                      isSelected || isFocused
                        ? "hsl(var(--accent-foreground))"
                        : "hsl(var(--secondary-foreground))",
                    borderBottom: "1px solid hsl(var(--border))",
                    "&:last-child": {
                      borderBottom: "none",
                    },
                    "&:active": {
                      backgroundColor: "hsl(var(--accent))",
                    },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "hsl(var(--secondary-foreground))",
                  }),
                  input: (base) => ({
                    ...base,
                    color: "hsl(var(--secondary-foreground))",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "hsl(var(--muted-foreground))",
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    color: "hsl(var(--muted-foreground))",
                    "&:hover": {
                      color: "hsl(var(--secondary-foreground))",
                    },
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    color: "hsl(var(--muted-foreground))",
                    "&:hover": {
                      color: "hsl(var(--secondary-foreground))",
                    },
                  }),
                  indicatorSeparator: (base) => ({
                    ...base,
                    backgroundColor: "hsl(var(--border))",
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: "8px 12px",
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: "hsl(var(--accent))",
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: "hsl(var(--accent-foreground))",
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: "hsl(var(--accent-foreground))",
                    ":hover": {
                      backgroundColor: "hsl(var(--accent))",
                      color: "hsl(var(--accent-foreground))",
                    },
                  }),
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="w-full text-gray-900 dark:text-gray-100">
              <label className="mb-1 block text-sm font-medium dark:text-gray-200">
                <FiCalendar className="mr-1 inline" />
                Start Date
              </label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                showTimeSelect
                dateFormat="yyyy-MM-dd HH:mm"
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-secondary dark:text-gray-100 dark:focus:ring-blue-400"
                placeholderText="Start Date"
                minTime={setHours(setMinutes(new Date(), 0), 8)}
                maxTime={setHours(setMinutes(new Date(), 0), 19)}
              />
            </div>

            <div className="w-full text-gray-900 dark:text-gray-100">
              <label className="mb-1 block text-sm font-medium dark:text-gray-200">
                <FiClock className="mr-1 inline" />
                Due Date
              </label>
              <DatePicker
                selected={dueDate}
                onChange={(date) => setDueDate(date)}
                showTimeSelect
                dateFormat="yyyy-MM-dd HH:mm"
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-secondary dark:text-gray-100 dark:focus:ring-blue-400"
                placeholderText="Due Date"
                minTime={setHours(setMinutes(new Date(), 0), 8)}
                maxTime={setHours(setMinutes(new Date(), 0), 19)}
              />
            </div>

            <div className="w-full text-gray-900 dark:text-gray-100">
              <label className="mb-1 block text-sm font-medium dark:text-gray-200">
                <FiFlag className="mr-1 inline" />
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-secondary dark:text-gray-100 dark:focus:ring-blue-400"
              >
                <option value={Priority.Normal}>Normal</option>
                <option value={Priority.High}>High</option>
                <option value={Priority.Urgent}>Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium dark:text-gray-200">
              <FiUpload className="mr-1 inline" />
              Attachments
            </label>
            <FileUploader
              multiple={true}
              handleChange={handleFileChange}
              name="file"
              types={fileTypes}
              children={
                <div style={fileUploaderStyles}>
                  <div className="p-4 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-200">
                      <FiUpload className="h-5 w-5" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Drag & drop files here, or click to select
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports: JPG, PNG, GIF, PDF, DOC, XLS
                    </p>
                  </div>
                </div>
              }
            />

            {/* Existing attachments for editing */}
            {task?.attachments && task.attachments.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium">
                  Current Attachments:
                </h4>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {task.attachments
                    .filter(
                      (attachment: Attachment) =>
                        !attachmentsToDelete.includes(attachment.id),
                    )
                    .map((attachment: Attachment) => (
                      <div
                        key={attachment.id}
                        className="group relative flex items-center gap-3 rounded-lg border p-3 transition-all hover:border-blue-500"
                      >
                        <div className="h-10 w-10">
                          <FileIcon
                            extension={attachment.fileName.split(".").pop()}
                            {...defaultStyles[
                              attachment.fileName
                                .split(".")
                                .pop() as keyof typeof defaultStyles
                            ]}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {attachment.fileName}
                          </p>
                          <div className="flex gap-2">
                            <a
                              href={buildImageUrl(attachment.fileURL)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-xs text-blue-500 hover:underline"
                            >
                              <FiEye className="mr-1 h-3 w-3" /> View
                            </a>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-all group-hover:opacity-100"
                          title="Remove attachment"
                        >
                          <FiX className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Newly selected files */}
            {files.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium">
                  New Files to Upload:
                </h4>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="group relative flex items-center gap-3 rounded-lg border p-3 transition-all hover:border-blue-500"
                    >
                      <div className="h-10 w-10">
                        <FileIcon
                          extension={file.name.split(".").pop()}
                          {...defaultStyles[
                            file.name
                              .split(".")
                              .pop() as keyof typeof defaultStyles
                          ]}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-all group-hover:opacity-100"
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800"
            >
              Cancel
            </button>
            <button
              type={projectType ? "button" : "submit"}
              onClick={
                projectType ? createSubtasksFromSelectedPages : undefined
              }
              className={`flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800 ${
                isCreating || isUpdating
                  ? "cursor-not-allowed bg-gray-400 dark:bg-gray-600"
                  : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              }`}
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? (
                <>
                  <svg
                    className="-ml-1 mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {task?._isDuplicate ? "Duplicating..." : "Creating..."}
                </>
              ) : task ? (
                task._isDuplicate ? (
                  "Duplicate Task"
                ) : (
                  "Update Task"
                )
              ) : (
                "Create Task"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {showCommentModal && (
        <Modal
          isOpen={showCommentModal}
          onClose={() => setShowCommentModal(false)}
          name="Date Change Reason"
        >
          <div className="mt-4 space-y-4 rounded-md bg-white p-4 text-gray-900 dark:bg-gray-800 dark:text-gray-100">
            <div className="space-y-4">
              <p className="font-semibold">
                You're updating the following dates:
              </p>

              {dateChanges.start && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="h-full min-h-[40px] w-1 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Previous Start Date
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {formatDateForDisplay(dateChanges.start.previous)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 border-l-2 border-gray-200 pl-3 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      New Start Date
                    </p>
                    <p className="font-medium text-blue-600 dark:text-blue-400">
                      {formatDateForDisplay(dateChanges.start.new)}
                    </p>
                  </div>
                </div>
              )}

              {dateChanges.due && (
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="h-full min-h-[40px] w-1 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Previous Due Date
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {formatDateForDisplay(dateChanges.due.previous)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 border-l-2 border-gray-200 pl-3 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      New Due Date
                    </p>
                    <p className="font-medium text-blue-600 dark:text-blue-400">
                      {formatDateForDisplay(dateChanges.due.new)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4">
              <label
                htmlFor="dateChangeComment"
                className="block text-sm font-medium"
              >
                Reason for change <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  id="dateChangeComment"
                  className="w-full rounded-md border border-gray-300 bg-white p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-secondary-dark dark:text-gray-100 dark:focus:ring-blue-400"
                  rows={4}
                  value={dateChangeComment}
                  onChange={(e) => setDateChangeComment(e.target.value)}
                  placeholder="Please explain why you're changing these dates..."
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {dateChangeComment.length}/500
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={() => {
                  setShowCommentModal(false);
                  setDateChangeComment("");
                  formDataRef.current = null;
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`rounded-md px-4 py-2 text-white transition-colors dark:text-gray-100 ${
                  dateChangeComment.trim()
                    ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    : "cursor-not-allowed bg-gray-400 dark:bg-gray-600"
                }`}
                onClick={confirmDateChange}
                disabled={!dateChangeComment.trim()}
              >
                Confirm Changes
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CreateTask;