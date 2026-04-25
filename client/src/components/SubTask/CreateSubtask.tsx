// client/src/components/CreateSubtask/index.tsx
import React, { useState, useRef } from "react";
import {
  Attachment,
  useCreateSubtaskMutation,
  useGetUsersQuery,
  useUpdateTaskStatusMutation,
  useUpdateSubtaskMutation,
  useDeleteAttachmentMutation,
  useAddCommentToTaskMutation,
} from "@/state/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatISO, format } from "date-fns";
import Select from "react-select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { setHours, setMinutes } from "date-fns";
import { FileUploader } from "react-drag-drop-files";
import { FileIcon, defaultStyles } from "react-file-icon";
import { useUploadAttachmentMutation } from "@/state/api";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";

interface SubtaskFormProps {
  parentTaskId: number;
  onClose: () => void;
  onSubtaskCreated: () => void;
  assignedUsers?: any[];
  subtask?: any;
  parentTaskName?: string;
  clientName: string;
}

const CreateSubtask = ({
  parentTaskId,
  onClose,
  onSubtaskCreated,
  assignedUsers = [],
  subtask,
  parentTaskName = "",
  clientName = "",
}: SubtaskFormProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(subtask?.title || "");
  const [status, setStatus] = useState(subtask?.status || "To Do");
  const [assignedTo, setAssignedTo] = useState<string[]>(
    subtask?.assignedUsers?.map((u: any) => u.userId.toString()) || [],
  );
  const [createSubtask, { isLoading }] = useCreateSubtaskMutation();
  const [updateSubtaskStatus] = useUpdateTaskStatusMutation();
  const { data: users, isLoading: isUsersLoading } = useGetUsersQuery();
  const assignedBy = user?.email || "";
  const [deleteAttachment] = useDeleteAttachmentMutation();
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<number[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>(
    subtask?.attachments || [],
  );
  const [addComment] = useAddCommentToTaskMutation();

  // Date change comment functionality
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [dateChangeComment, setDateChangeComment] = useState("");
  const [dateChanges, setDateChanges] = useState<{
    start?: { previous: Date | null; new: Date | null };
    due?: { previous: Date | null; new: Date | null };
  }>({});
  const formDataRef = useRef<any>(null);

  const now = new Date();
  const [startDate, setStartDate] = useState<Date | null>(
    subtask?.startDate ? new Date(subtask.startDate) : new Date(),
  );
  const [dueDate, setDueDate] = useState<Date | null>(
    subtask?.dueDate ? new Date(subtask.dueDate) : null,
  );

  // File upload related states and functions
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

  const uploadFiles = async (subtaskId: number) => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      await uploadAttachment({
        taskId: subtaskId,
        formData,
      }).unwrap();
      setFiles([]);
    } catch (error) {
      console.error("Error uploading attachments:", error);
      toast.error("Failed to upload some attachments");
    }
  };

  const statusOptions = [
    { value: "To Do", label: "To Do" },
    { value: "Work In Progress", label: "Work In Progress" },
    { value: "QA", label: "QA" },
    { value: "Completed", label: "Completed" },
  ];

  const [updateSubtask] = useUpdateSubtaskMutation();

  const checkForDateChanges = () => {
    if (!subtask) return false;

    const changes: typeof dateChanges = {};
    let hasChanges = false;

    if (subtask.startDate) {
      if (startDate?.getTime() !== new Date(subtask.startDate).getTime()) {
        changes.start = {
          previous: subtask.startDate ? new Date(subtask.startDate) : null,
          new: startDate,
        };
        hasChanges = true;
      }
    }

    if (subtask.dueDate) {
      if (dueDate?.getTime() !== new Date(subtask.dueDate).getTime()) {
        changes.due = {
          previous: subtask.dueDate ? new Date(subtask.dueDate) : null,
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

    if (!title || assignedTo.length === 0) {
      toast.error("Title and at least one assignee are required");
      return;
    }

    if (subtask) {
      const hasDateChanges = checkForDateChanges();

      if (hasDateChanges) {
        formDataRef.current = {
          title,
          status,
          startDate,
          dueDate,
          assignedTo,
        };

        setShowCommentModal(true);
        return;
      }
    }

    await submitSubtask();
  };

  const submitSubtask = async () => {
    try {
      let result;
      if (subtask) {
        // Update existing subtask
        result = await updateSubtask({
          subtaskId: subtask.id,
          taskData: {
            title,
            status,
            startDate: startDate ? formatISO(startDate) : undefined,
            dueDate: dueDate ? formatISO(dueDate) : undefined,
            assignedTo,
          },
        }).unwrap();

        // Delete attachments after successful update
        if (attachmentsToDelete.length > 0) {
          await Promise.all(
            attachmentsToDelete.map((attachmentId) =>
              deleteAttachment({
                taskId: subtask.id,
                attachmentId,
              }).unwrap(),
            ),
          );
          setAttachmentsToDelete([]);
        }
      } else {
        // Create new subtask
        result = await createSubtask({
          parentTaskId,
          taskData: {
            title,
            status,
            startDate: startDate ? formatISO(startDate) : undefined,
            dueDate: dueDate ? formatISO(dueDate) : undefined,
            assignedTo,
            assignedBy,
          },
        }).unwrap();
      }

      // Upload files after subtask is created/updated
      if (files.length > 0 && result?.id) {
        await uploadFiles(result.id);
      }

      onSubtaskCreated();
      onClose();
    } catch (error) {
      console.error("Failed to create/update subtask:", error);
      toast.error("Failed to create/update subtask");
    }
  };

  const confirmDateChange = async () => {
    if (!dateChangeComment.trim()) {
      toast.error("Please enter a reason for the date change");
      return;
    }

    try {
      if (user?.userId && subtask?.id) {
        const comments: Promise<any>[] = [];

        if (dateChanges.start) {
          const commentContent = `${user.username || user.email} changed the start date from ${
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
              taskId: subtask.id,
              content: commentContent,
              userId: Number(user.userId),
            }).unwrap(),
          );
        }

        if (dateChanges.due) {
          const commentContent = `${user.username || user.email} changed the due date from ${
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
              taskId: subtask.id,
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
      const { title, status, startDate, dueDate, assignedTo } = formDataRef.current;

      setTitle(title);
      setStatus(status);
      setStartDate(startDate);
      setDueDate(dueDate);
      setAssignedTo(assignedTo);

      formDataRef.current = null;
    }

    await submitSubtask();
  };

  const handleDeleteExistingAttachment = (attachmentId: number) => {
    setAttachmentsToDelete((prev) => [...prev, attachmentId]);
    setExistingAttachments((prev) =>
      prev.filter((att) => att.id !== attachmentId),
    );
  };

  const userOptions = assignedUsers.map((user) => ({
    value: user.userId?.toString() || "",
    label: user.username || user.email || "Unknown User",
    profilePictureUrl: user.profilePictureUrl,
    firstname: user.firstname,
    lastname: user.lastname,
  }));

  const formatOptionLabel = ({
    label,
    profilePictureUrl,
    firstname,
    lastname,
  }: any) => (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        {profilePictureUrl ? (
          <AvatarImage src={profilePictureUrl} alt={`${label}'s profile`} />
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

  return (
    <div className="rounded-lg bg-white p-4 shadow-md dark:bg-secondary-dark">
      <h3 className="mb-4 text-lg font-semibold dark:text-gray-200">
        {subtask ? "Edit Subtask" : "Create Subtask"}
        {clientName && parentTaskName && (
          <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-300">
            in {clientName} / {parentTaskName}
          </span>
        )}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 p-2 dark:bg-secondary-dark dark:text-gray-100"
          placeholder="Subtask Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="flex-col items-center justify-between">
          <div className="mb-4">
            <Select
              options={userOptions}
              value={userOptions.filter((option) =>
                assignedTo.includes(option.value),
              )}
              onChange={(selectedOptions) =>
                setAssignedTo(
                  selectedOptions
                    ? selectedOptions.map((option) => option.value)
                    : [],
                )
              }
              placeholder="Add assignee"
              isMulti
              isSearchable
              formatOptionLabel={formatOptionLabel}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (base, { isFocused }) => ({
                  ...base,
                  backgroundColor: "hsl(var(--secondary))",
                  borderColor: isFocused
                    ? "hsl(var(--ring))"
                    : "hsl(var(--border))",
                  borderWidth: "1px",
                  borderRadius: "0.375rem",
                  boxShadow: isFocused ? "0 0 0 1px hsl(var(--ring))" : "none",
                  "&:hover": {
                    borderColor: "hsl(var(--ring))",
                  },
                  minHeight: "42px",
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "hsl(var(--secondary))",
                  borderColor: "hsl(var(--border))",
                  borderWidth: "1px",
                  borderRadius: "0.375rem",
                  marginTop: "2px",
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

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-secondary-dark dark:text-gray-100 dark:focus:ring-blue-400"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex space-x-4">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            showTimeSelect
            dateFormat="yyyy-MM-dd HH:mm"
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-secondary-dark dark:text-gray-100 dark:focus:ring-blue-400"
            placeholderText="Start Date"
            minTime={setHours(setMinutes(new Date(), 0), 8)}
            maxTime={setHours(setMinutes(new Date(), 0), 19)}
          />
          <DatePicker
            selected={dueDate}
            onChange={(date) => setDueDate(date)}
            showTimeSelect
            dateFormat="yyyy-MM-dd HH:mm"
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-secondary-dark dark:text-gray-100 dark:focus:ring-blue-400"
            placeholderText="Due Date"
            minTime={setHours(setMinutes(new Date(), 0), 8)}
            maxTime={setHours(setMinutes(new Date(), 0), 19)}
          />
        </div>

        {/* File Upload Section */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">Attachments</label>

          {/* Show existing attachments when editing */}
          {subtask && existingAttachments.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium">
                Existing Attachments:
              </h4>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                {existingAttachments
                  .filter(
                    (attachment) =>
                      !attachmentsToDelete.includes(attachment.id),
                  )
                  .map((attachment) => (
                    <div
                      key={attachment.id}
                      className="relative flex items-center gap-2 rounded-md border p-2"
                    >
                      <div className="h-8 w-8">
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
                        <p className="truncate text-sm">
                          {attachment.fileName}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteExistingAttachment(attachment.id)
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <FileUploader
            multiple={true}
            handleChange={handleFileChange}
            name="file"
            types={fileTypes}
            children={
              <div style={fileUploaderStyles}>
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPG, JPEG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX
                  </p>
                </div>
              </div>
            }
          />

          {files.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium">New Files:</h4>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative flex items-center gap-2 rounded-md border p-2"
                  >
                    <div className="h-8 w-8">
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
                      <p className="truncate text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {isLoading
              ? subtask
                ? "Updating..."
                : "Creating..."
              : subtask
                ? "Update"
                : "Create"}
          </button>
        </div>
      </form>

      {/* Date Change Comment Modal */}
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
                        {dateChanges.start.previous ? format(dateChanges.start.previous, "MMM d, yyyy hh:mm a") : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 border-l-2 border-gray-200 pl-3 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      New Start Date
                    </p>
                    <p className="font-medium text-blue-600 dark:text-blue-400">
                      {dateChanges.start.new ? format(dateChanges.start.new, "MMM d, yyyy hh:mm a") : "N/A"}
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
                        {dateChanges.due.previous ? format(dateChanges.due.previous, "MMM d, yyyy hh:mm a") : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 border-l-2 border-gray-200 pl-3 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      New Due Date
                    </p>
                    <p className="font-medium text-blue-600 dark:text-blue-400">
                      {dateChanges.due.new ? format(dateChanges.due.new, "MMM d, yyyy hh:mm a") : "N/A"}
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

export default CreateSubtask;