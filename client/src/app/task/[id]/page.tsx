"use client";

import React, { useState } from "react";
import { useGetTaskByIdQuery, useGetTaskCommentsQuery } from "@/state/api";
import { useParams } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import RichTextEditor from "@/components/RichTextEditor";
import CommentInput from "@/components/Task/CommentInput";
import Comment from "@/components/Task/Comment";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

// Define proper TypeScript interfaces
interface ActivityItem {
  type: "activity";
  id: number;
  content: string;
  timestamp: string;
  user: any; // Replace 'any' with your User type
  action: string;
}

interface CommentItem {
  type: "comment";
  id: number;
  content: string;
  timestamp: string;
  user: any; // Replace 'any' with your User type
  commentData: any; // Replace 'any' with your Comment type
}

type CombinedItem = ActivityItem | CommentItem;

// Type guard functions
const isActivityItem = (item: CombinedItem): item is ActivityItem => {
  return item.type === "activity";
};

const isCommentItem = (item: CombinedItem): item is CommentItem => {
  return item.type === "comment";
};

const TaskDetail = () => {
  const params = useParams();
  const taskId = Number(params.id);
  const { user } = useAuth();
  const [refreshComments, setRefreshComments] = useState(0);

  const { data: task, isLoading, error } = useGetTaskByIdQuery(taskId);
  const { 
    data: comments = [], 
    refetch: refetchComments 
  } = useGetTaskCommentsQuery(taskId);

  // Function to trigger comment refresh
  const handleCommentUpdate = () => {
    setRefreshComments(prev => prev + 1);
    refetchComments();
  };

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading task details...
      </div>
    );
  if (error || !task)
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        Error loading task details
      </div>
    );

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${formattedDate} at ${formattedTime}`;
  };

  // Combine and sort activities and comments by date in descending order
  const combinedActivities: CombinedItem[] = [
    ...(task.activityLogs?.map((log) => ({
      type: "activity" as const,
      id: log.id,
      content: log.details,
      timestamp: log.timestamp,
      user: log.user,
      action: log.action,
    })) || []),
    ...(comments.map((comment) => ({
      type: "comment" as const,
      id: comment.id,
      content: comment.content,
      timestamp: comment.createdAt,
      user: comment.user,
      commentData: comment, // Pass full comment data
    })) || []),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="flex h-screen items-start gap-4 p-5">
      <div className="w-[65%]">
        {/* Task Header */}
        <div className="mb-5 rounded-lg bg-white dark:bg-secondary p-5 shadow-sm">
          <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-300">{task.title}</h1>
              {task.client && (
                <p className="text-base font-medium text-gray-600 dark:text-gray-400">
                  ({task.client.domainName})
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium text-white ${
                  task.status === "Completed" ? "bg-green-500" : "bg-orange-500"
                }`}
              >
                {task.status}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium text-white ${
                  task.priority === "High" ? "bg-red-500" : "bg-blue-500"
                }`}
              >
                {task.priority}
              </span>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="space-y-2 border dark:border-gray-700 p-4 rounded-lg">
              <p className="flex items-center justify-between dark:text-gray-400">
                <strong className="text-gray-700 dark:text-gray-400">Start Date:</strong>{" "}
                {formatDate(task.startDate)}
              </p>
              <p className="flex items-center justify-between dark:text-gray-400">
                <strong className="text-gray-700 dark:text-gray-400">Due Date:</strong>{" "}
                {formatDate(task.dueDate)}
              </p>
              <div className="flex items-center justify-between ">
                <p className="text-sm text-gray-600 dark:text-gray-400">Time Spent</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-400">
                  {task.formattedTimeSpent || "00:00:00"}
                </p>
              </div>
            </div>

            <div className="space-y-2 border dark:border-gray-700 p-4 rounded-lg">
              {task.assignedUsers && task.assignedUsers.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="mb-2 font-medium text-gray-700 dark:text-gray-400">Assigned to:</p>
                  <div className="flex flex-wrap gap-3">
                    {task.assignedUsers.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-6 w-6">
                          {user.profilePictureUrl ? (
                            <AvatarImage
                              src={buildImageUrl(user.profilePictureUrl)}
                              alt={`${user.firstname} ${user.lastname}`}
                            />
                          ) : (
                            <AvatarFallback className="text-sm dark:text-gray-400 border dark:border-gray-600 p-2">
                              {user.firstname?.charAt(0)}
                              {user.lastname?.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm dark:text-gray-400">
                          {user.firstname} {user.lastname}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="flex items-center justify-between dark:text-gray-400">
                <strong className="text-gray-700 dark:text-gray-400">Assigned by:</strong>{" "}
                {task.assignedBy}
              </p>
              {task.client && (
                <p className="flex items-center justify-between dark:text-gray-400">
                  <strong className="text-gray-700 dark:text-gray-400">Client:</strong>{" "}
                  {task.client.companyName} ({task.client.domainName})
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="rounded-lg bg-white dark:bg-secondary p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-300">
            Description
          </h2>
          {task.description ? (
            <RichTextEditor
              content={task.description}
              onContentChange={() => {}} // Read-only mode
              className="min-h-[200px] bg-gray-50 dark:bg-secondary "
              readOnly
            />
          ) : (
            <p className="text-gray-400 italic">No description available.</p>
          )}
        </div>
      </div>

      {/* Right Column - Comments Section */}
      <div className="w-[35%] rounded-lg bg-white dark:bg-secondary p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-300">
          Activity & Comments ({combinedActivities.length})
        </h3>
        <div className="h-[calc(100vh-200px)] overflow-y-auto">
          {combinedActivities.length > 0 ? (
            combinedActivities.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="border-b border-gray-100 dark:border-gray-600 py-3 last:border-b-0"
              >
                {isCommentItem(item) ? (
                  // Render comment with full functionality
                  <Comment 
                    comment={item.commentData} 
                    taskId={taskId}
                    onUpdate={handleCommentUpdate}
                  />
                ) : isActivityItem(item) ? (
                  // Render activity log
                  <>
                    <div className="mb-2 flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {item.user?.profilePictureUrl ? (
                          <AvatarImage
                            src={buildImageUrl(item.user.profilePictureUrl)}
                            alt={`${item.user.firstname} ${item.user.lastname}`}
                          />
                        ) : (
                          <AvatarFallback className="text-sm">
                            {item.user?.firstname?.charAt(0)}
                            {item.user?.lastname?.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col">
                        <strong className="text-sm dark:text-gray-300">
                          {item.user?.firstname} {item.user?.lastname}
                        </strong>
                        <span className="text-xs capitalize text-gray-500 dark:text-gray-400">
                          {item.action}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {item.content && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.content}</p>
                      )}
                      
                      <small className="text-xs text-gray-500 dark:text-gray-400 self-end">
                        {formatDate(item.timestamp)}
                      </small>
                    </div>
                  </>
                ) : null}
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-gray-500">
              No activities or comments yet.
            </p>
          )}
        </div>

        {/* Comment Input */}
        <CommentInput 
          taskId={taskId} 
          onCommentAdded={handleCommentUpdate}
        />
      </div>
    </div>
  );
};

export default TaskDetail;