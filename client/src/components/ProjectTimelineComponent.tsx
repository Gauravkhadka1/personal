"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { ProjectTimeline, ProjectTimelineStatus } from "@/state/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Edit,
  Trash2,
  Circle,
  Plus,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../context/AuthContext";

interface ProjectTimelineComponentProps {
  timelines: ProjectTimeline[];
  clientId: number;
  onUpdate: (timelines: ProjectTimeline[]) => void;
  isUpdating?: boolean;
  isLoading?: boolean;
}

const ProjectTimelineComponent: React.FC<ProjectTimelineComponentProps> = ({
  timelines = [],
  clientId,
  onUpdate,
  isUpdating = false,
  isLoading = false,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTimeline, setEditingTimeline] =
    useState<ProjectTimeline | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timelineForm = useForm<{
    title: string;
    description: string;
    deadline: string;
    status: ProjectTimelineStatus;
  }>();

  // Function to get current Nepal time
  const getNepalTime = (): Date => {
    const now = new Date();
    // Nepal is UTC+5:45
    const nepaliOffset = 5 * 60 + 45; // 5 hours 45 minutes in minutes
    const localOffset = now.getTimezoneOffset(); // in minutes
    const totalOffset = nepaliOffset + localOffset; // total difference in minutes

    const nepalTime = new Date(now.getTime() + totalOffset * 60 * 1000);
    return nepalTime;
  };

  // Function to calculate days left in Nepal time
  const calculateDaysLeft = (deadline: string | Date): string => {
    const deadlineDate =
      typeof deadline === "string" ? new Date(deadline) : deadline;
    const nepalNow = getNepalTime();

    // Reset both dates to start of day for accurate day calculation
    const nepalToday = new Date(nepalNow);
    nepalToday.setHours(0, 0, 0, 0);

    const deadlineStart = new Date(deadlineDate);
    deadlineStart.setHours(0, 0, 0, 0);

    const diffInMs = deadlineStart.getTime() - nepalToday.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Due today";
    if (diffInDays === 1) return "1 day left";
    if (diffInDays > 1) return `${diffInDays} days left`;
    if (diffInDays === -1) return "1 day overdue";
    if (diffInDays < 0) return `${Math.abs(diffInDays)} days overdue`;

    return "Due today";
  };

  const openDialog = (timeline?: ProjectTimeline) => {
    if (timeline) {
      setEditingTimeline(timeline);
      timelineForm.setValue("title", timeline.title || "");
      timelineForm.setValue("description", timeline.description || "");
      timelineForm.setValue(
        "deadline",
        timeline.deadline
          ? format(new Date(timeline.deadline), "yyyy-MM-dd")
          : "",
      );
      timelineForm.setValue("status", timeline.status);
    } else {
      setEditingTimeline(null);
      timelineForm.reset({
        title: "",
        description: "",
        deadline: "",
        status: ProjectTimelineStatus.ToDo,
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingTimeline(null);
    timelineForm.reset();
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const timelineData: ProjectTimeline = {
        ...(editingTimeline || {}),
        title: data.title,
        description: data.description,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
        status: data.status,
        clientId,
      };

      let updatedTimelines: ProjectTimeline[];

      if (editingTimeline) {
        updatedTimelines = timelines.map((tl) =>
          tl.id === editingTimeline.id ? timelineData : tl,
        );
      } else {
        const newTimeline = {
          ...timelineData,
          id: Date.now(), // Temporary ID for local state
        };
        updatedTimelines = [...timelines, newTimeline];
      }

      onUpdate(updatedTimelines);
      closeDialog();
    } catch (error) {
      console.error("Error updating timeline:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTimeline = (id: number) => {
    const updatedTimelines = timelines.filter((tl) => tl.id !== id);
    onUpdate(updatedTimelines);
  };

  const getStatusIcon = (status: ProjectTimelineStatus) => {
    switch (status) {
      case ProjectTimelineStatus.Completed:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case ProjectTimelineStatus.InProgress:
        return <Circle className="h-4 w-4 fill-blue-500 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusConfig = (status: ProjectTimelineStatus) => {
    const config = {
      [ProjectTimelineStatus.ToDo]: {
        label: "To Do",
        variant: "secondary" as const,
        color: "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
      },
      [ProjectTimelineStatus.InProgress]: {
        label: "In Progress",
        variant: "default" as const,
        color: "text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-300",
      },
      [ProjectTimelineStatus.Completed]: {
        label: "Completed",
        variant: "success" as const,
        color:
          "text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300",
      },
    };
    return config[status];
  };

  const getStatusBadge = (status: ProjectTimelineStatus) => {
    const config = getStatusConfig(status);
    return (
      <Badge
        variant={config.variant}
        className={`${config.color} flex items-center gap-1`}
      >
        {getStatusIcon(status)}
        {config.label}
      </Badge>
    );
  };

  // Format date relative to now - Fixed TypeScript error
  const formatRelativeTime = (dateString: string | Date) => {
    // Ensure we have a Date object
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    const now = getNepalTime(); // Use Nepal time for relative formatting
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
    const diffInDays = Math.floor(diffInSeconds / 86400);

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Tomorrow";
    if (diffInDays === -1) return "Yesterday";
    if (diffInDays > 0 && diffInDays < 7) return `In ${diffInDays} days`;
    if (diffInDays < 0 && diffInDays > -7)
      return `${Math.abs(diffInDays)} days ago`;

    return format(date, "MMM dd, yyyy");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="relative">
          <div className="absolute left-2 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>

          <div className="space-y-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="relative pl-8">
                <Skeleton className="absolute left-0 top-2 h-3 w-3 rounded-full" />
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { user, loading } = useAuth();

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Project Timeline
        </h2>
        {isAdmin && (
          <Button
            onClick={() => openDialog()}
            disabled={isUpdating}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Milestone
          </Button>
        )}
      </div>

      {timelines.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Calendar className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            No timeline items
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Get started by adding your first project milestone.
          </p>
          <Button onClick={() => openDialog()} className="mt-4" type="button">
            <Plus className="mr-2 h-4 w-4" />
            Add Milestone
          </Button>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-2 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>

          <div className="space-y-6">
            {/* Render all timelines in their original order */}
            {timelines.map((timeline, index) => (
              <div key={timeline.id} className="relative pl-8">
                <div
                  className={`absolute left-0 top-2 z-10 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${
                    timeline.status === ProjectTimelineStatus.Completed
                      ? "bg-green-500"
                      : timeline.status === ProjectTimelineStatus.InProgress
                        ? "bg-blue-500"
                        : "bg-gray-400 dark:bg-gray-500"
                  }`}
                ></div>
                <TimelineCard
                  timeline={timeline}
                  onEdit={openDialog}
                  onDelete={deleteTimeline}
                  isUpdating={isUpdating}
                  formatRelativeTime={formatRelativeTime}
                  getStatusBadge={getStatusBadge}
                  calculateDaysLeft={calculateDaysLeft}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTimeline ? "Edit Timeline Item" : "Add Timeline Item"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={timelineForm.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title *
              </label>
              <input
                type="text"
                {...timelineForm.register("title", {
                  required: "Title is required",
                })}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                placeholder="Enter milestone title"
              />
              {timelineForm.formState.errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {timelineForm.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                {...timelineForm.register("description")}
                rows={3}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                placeholder="Enter milestone description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Deadline
                </label>
                <input
                  type="date"
                  {...timelineForm.register("deadline")}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  {...timelineForm.register("status")}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                >
                  <option value={ProjectTimelineStatus.ToDo}>To Do</option>
                  <option value={ProjectTimelineStatus.InProgress}>
                    In Progress
                  </option>
                  <option value={ProjectTimelineStatus.Completed}>
                    Completed
                  </option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingTimeline
                    ? "Update"
                    : "Add"}{" "}
                Milestone
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Separate component for timeline card
interface TimelineCardProps {
  timeline: ProjectTimeline;
  onEdit: (timeline: ProjectTimeline) => void;
  onDelete: (id: number) => void;
  isUpdating: boolean;
  formatRelativeTime: (dateString: string | Date) => string;
  getStatusBadge: (status: ProjectTimelineStatus) => React.ReactNode;
  calculateDaysLeft: (deadline: string | Date) => string;
}

const TimelineCard: React.FC<TimelineCardProps> = ({
  timeline,
  onEdit,
  onDelete,
  isUpdating,
  formatRelativeTime,
  getStatusBadge,
  calculateDaysLeft,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className="p-4 transition-shadow duration-200 hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-3">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {timeline.title}
            </h4>
            {getStatusBadge(timeline.status)}
          </div>

          {timeline.description && (
            <p className="mb-3 whitespace-pre-line text-gray-600 dark:text-gray-300">
              {timeline.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {timeline.deadline && (
                <>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {timeline.deadline
                        ? format(new Date(timeline.deadline), "MMM dd, yyyy")
                        : "No deadline"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-medium">
                    <span
                      className={
                        calculateDaysLeft(timeline.deadline).includes("overdue")
                          ? "text-red-600 dark:text-red-400"
                          : calculateDaysLeft(timeline.deadline).includes(
                                "left",
                              )
                            ? "text-green-600 dark:text-green-400"
                            : "text-orange-600 dark:text-orange-400"
                      }
                    >
                      {calculateDaysLeft(timeline.deadline)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons - only visible on hover */}
        <div
          className={`ml-4 flex gap-2 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <Button
            variant="ghost"
            type="button"
            size="sm"
            onClick={() => onEdit(timeline)}
            disabled={isUpdating}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            type="button"
            size="sm"
            onClick={() => onDelete(timeline.id!)}
            disabled={isUpdating}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProjectTimelineComponent;
