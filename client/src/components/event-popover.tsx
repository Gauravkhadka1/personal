import { useGetClientsQuery, useCreateTaskMutation, useGetUsersQuery } from "@/state/api";
import Modal from "@/components/Modal";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatISO } from "date-fns";
import { Status, Priority } from "@/state/api"; 
import { setHours } from "date-fns/setHours";
import { setMinutes } from "date-fns/setMinutes";
import { useAuth } from "@/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  id?: string | null;
  task?: any;
  onTaskCreatedOrUpdated?: () => void;
};

const ModalNewTask = ({ isOpen, onClose, id = null, task = null, onTaskCreatedOrUpdated }: Props) => {
  const { user } = useAuth();
  const loggedInUserEmail = user?.email || "";
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const { data: clients, isLoading: isClientsLoading } = useGetClientsQuery();
  const { data: users, isLoading: isUsersLoading } = useGetUsersQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>(Status.ToDo);
  const [priority, setPriority] = useState("Backlog");
  const [tags, setTags] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [clientId, setClientId] = useState("");
  const assignedBy = loggedInUserEmail;

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  const clientOptions = clients
    ?.map((client) => ({
      value: client.id.toString(),
      label: client.domainName || client.companyName || "Unnamed Client",
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const userOptions = users
    ?.map((user) => ({
      value: user.userId?.toString() || "",
      label: user.username || user.email || "Unknown User",
      profilePictureUrl: user.profilePictureUrl,
      firstname: user.firstname,
      lastname: user.lastname,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const formatOptionLabel = ({ label, profilePictureUrl, firstname, lastname }: any) => (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        {profilePictureUrl ? (
          <AvatarImage src={buildImageUrl(profilePictureUrl)} alt={`${label}'s profile`} />
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
    // Set default client if id is provided
    if (id) {
      setClientId(id);
    }
    
    // Only set assignedTo if userId exists
    if (user?.userId) {
      setAssignedTo([user.userId.toString()]);
    }
    
    // Set default dates
    if (!startDate) {
      setStartDate(new Date());
    }
  }, [user, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !clientId || assignedTo.length === 0) {
      toast.error("Title, Client and at least one assignee are required");
      return;
    }

    try {
      const newTask = await createTask({
        title,
        description,
        status: status as Status,
        priority: priority as Priority,
        tags,
        startDate: startDate ? formatISO(startDate, { representation: "complete" }) : undefined,
        dueDate: dueDate ? formatISO(dueDate, { representation: "complete" }) : undefined,
        assignedTo,
        clientId: Number(clientId),
        assignedBy,
      }).unwrap();

      toast.success("Task created successfully!");
      if (onTaskCreatedOrUpdated) {
        onTaskCreatedOrUpdated();
      }
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task. Please try again.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} name="Create New Task">
      <form
        className="mt-4 space-y-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 pt-2 rounded-md"
        onSubmit={handleSubmit}
      >
        {/* Title input */}
        <input
          type="text"
          className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          placeholder="Title*"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        
        {/* Client Selection */}
        <div className="text-gray-900 dark:text-gray-100">
          <Select
            options={clientOptions}
            value={clientOptions?.find((option) => option.value === clientId) || null}
            onChange={(selectedOption) => setClientId(selectedOption?.value || "")}
            placeholder="Select Client*"
            isSearchable
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={isClientsLoading}
            noOptionsMessage={() => "No clients found"}
            isDisabled={!!id} // Disable if client ID is provided
            styles={{
              control: (base, { isFocused }) => ({
                ...base,
                backgroundColor: "hsl(var(--secondary))",
                borderColor: isFocused ? "hsl(var(--ring))" : "hsl(var(--border))",
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
              option: (base, { isFocused, isSelected }) => ({
                ...base,
                backgroundColor: isSelected
                  ? "hsl(var(--accent))"
                  : isFocused
                    ? "hsl(var(--accent))"
                    : "transparent",
                color: isSelected || isFocused
                  ? "hsl(var(--accent-foreground))"
                  : "hsl(var(--secondary-foreground))",
              }),
              singleValue: (base) => ({
                ...base,
                color: "hsl(var(--secondary-foreground))",
              }),
            }}
          />
        </div>

        {/* User Selection */}
        <div className="text-gray-900 dark:text-gray-100">
          <Select
            options={userOptions}
            value={userOptions?.filter((option) => assignedTo.includes(option.value)) || []}
            onChange={(selectedOptions) => 
              setAssignedTo(selectedOptions ? selectedOptions.map((option) => option.value) : [])
            }
            placeholder="Assign To*"
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
                borderColor: isFocused ? "hsl(var(--ring))" : "hsl(var(--border))",
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
              option: (base, { isFocused, isSelected }) => ({
                ...base,
                backgroundColor: isSelected
                  ? "hsl(var(--accent))"
                  : isFocused
                    ? "hsl(var(--accent))"
                    : "transparent",
                color: isSelected || isFocused
                  ? "hsl(var(--accent-foreground))"
                  : "hsl(var(--secondary-foreground))",
              }),
            }}
          />
        </div>

        {/* Date Pickers */}
        <div className="flex space-x-4">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            showTimeSelect
            dateFormat="yyyy-MM-dd HH:mm"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholderText="Start Date*"
            minTime={setHours(setMinutes(new Date(), 0), 8)}
            maxTime={setHours(setMinutes(new Date(), 0), 19)}
            required
          />

          <DatePicker
            selected={dueDate}
            onChange={(date) => setDueDate(date)}
            showTimeSelect
            dateFormat="yyyy-MM-dd HH:mm"
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholderText="Due Date*"
            minTime={setHours(setMinutes(new Date(), 0), 8)}
            maxTime={setHours(setMinutes(new Date(), 0), 19)}
            required
          />
        </div>

        <button
          type="submit"
          className={`mt-4 w-full rounded-md bg-blue-600 dark:bg-blue-500 px-4 py-2 text-white dark:text-gray-100 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create Task"}
        </button>
      </form>
    </Modal>
  );
};

export default ModalNewTask;