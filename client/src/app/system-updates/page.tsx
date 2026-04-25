"use client";
import React, { useState } from "react";
import {
  useGetSystemUpdatesQuery,
  useCreateSystemUpdateMutation,
  useUpdateSystemUpdateMutation,
  useDeleteSystemUpdateMutation,
} from "@/state/api";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import withRoleAuth from "../../hoc/withRoleAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import RichTextEditor from "@/components/RichTextEditor";

const SystemUpdates = () => {
  const {
    data: updates,
    isLoading,
    isError,
    refetch,
  } = useGetSystemUpdatesQuery();
  const [createUpdate] = useCreateSystemUpdateMutation();
  const [updateUpdate] = useUpdateSystemUpdateMutation();
  const [deleteUpdate] = useDeleteSystemUpdateMutation();
  const { user } = useAuth();

  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleCreateUpdate = async () => {
    if (!content.trim()) {
      toast.error("Update content cannot be empty");
      return;
    }

    try {
      await createUpdate({ content }).unwrap();
      setContent("");
      toast.success("Update created successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to create update");
      console.error(error);
    }
  };

  const handleStartEdit = (update: any) => {
    setEditingId(update.id);
    setEditContent(update.content);
  };

  const handleUpdate = async () => {
    if (!editingId || !editContent.trim()) return;

    try {
      await updateUpdate({ id: editingId, content: editContent }).unwrap();
      setEditingId(null);
      toast.success("Update edited successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to edit update");
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this update?")) return;

    try {
      await deleteUpdate(id).unwrap();
      toast.success("Update deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete update");
      console.error(error);
    }
  };

  const renderContentWithLinks = (content: string) => {
    if (content.startsWith("<")) {
      return (
        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Format date in Nepal time (UTC+5:45)
  const formatNepalTime = (dateString: string) => {
    const date = new Date(dateString);
    // Add 5 hours and 45 minutes to convert to Nepal time
    date.setHours(date.getHours() + 5);
    date.setMinutes(date.getMinutes() + 45);

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;

    const diffInDays = Math.floor(diffInSeconds / 86400);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group updates by date (Today, Yesterday, etc.)
  const groupedUpdates = updates?.reduce(
    (acc: Record<string, any[]>, update) => {
      const date = new Date(update.createdAt);
      // Add 5 hours and 45 minutes to convert to Nepal time
      date.setHours(date.getHours() + 5);
      date.setMinutes(date.getMinutes() + 45);

      const now = new Date();
      const updateDate = date.toDateString();
      const today = now.toDateString();

      let key;
      if (updateDate === today) {
        key = "Today";
      } else {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (updateDate === yesterday.toDateString()) {
          key = "Yesterday";
        } else {
          key = date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          });
        }
      }

      if (!acc[key]) acc[key] = [];
      acc[key].push(update);
      return acc;
    },
    {},
  );

  if (isLoading) return (
    <div className="flex w-full flex-col p-8">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-2 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>
        
        <div className="space-y-8">
          {[1, 2, 3].map((day) => (
            <div key={day} className="relative pl-12 pb-8">
              {/* Date dot */}
              <Skeleton className="absolute left-0 top-1 h-4 w-4 rounded-full z-10" />
              
              {/* Date header */}
              <div className="flex items-center mb-4">
                <Skeleton className="h-6 w-32" />
              </div>

              {/* Updates list */}
              <div className="space-y-4">
                {[1, 2].map((update, index) => (
                  <div key={update} className="relative pl-6">
                    {/* Small dot connector */}
                    {index > 0 && (
                      <Skeleton className="absolute left-0 top-0 h-6 w-0.5" />
                    )}
                    <Skeleton className="absolute left-0 top-6 h-2 w-2 rounded-full" />
                    
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isError) return <div className="p-8">Error loading updates</div>;

  return (
    <div className="flex w-full flex-col p-8 dark:text-gray-300">
      <div className="mb-6 flex text-2xl items-center justify-between">
        <Header name="What's New" />
        {user?.userId === 11 && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>Post Update</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Post a new update</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <RichTextEditor
                  content={content}
                  onContentChange={setContent}
                  placeholder="Write your update here..."
                />
                <Button onClick={handleCreateUpdate} className="w-full">
                  Post
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[2.5px] top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700"></div>
        
        {groupedUpdates &&
          Object.entries(groupedUpdates).map(([date, dateUpdates], groupIndex) => (
            <div key={date} className="relative pl-8 pb-5">
              {/* Date dot */}
              <div className="absolute left-0 top-7 h-2 w-2 rounded-full bg-blue-400  dark:bg-blue-600 border-2 border-blue-400 dark:border-blue-600 z-10"></div>
              
              <div className="dark:bg-secondary-dark p-4 rounded-lg shadow-sm bg-white">
              {/* Date header */}
              <div className="flex items-center mb-3 pt-1">
                <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-200">
                  {date}
                </h2>
              </div>

              {/* Updates list */}
              <div className="space-y-2">
                {dateUpdates.map((update, index) => (
                  <div key={update.id} className="relative pl-6">
                  
                    <div className="absolute left-0 top-2 h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500"></div>
                    
                    {editingId === update.id ? (
                      <div className="space-y-2">
                        <RichTextEditor
                          content={editContent}
                          onContentChange={setEditContent}
                          placeholder="Edit your update here..."
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleUpdate}>Save</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="group relative">
                        <div className="whitespace-pre-line text-base text-gray-600 dark:text-gray-300 pr-8">
                          {renderContentWithLinks(update.content)}
                        </div>
                        {update.userId === user?.userId && (
                          <div className="absolute right-0 top-0 z-10 flex space-x-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleStartEdit(update)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDelete(update.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default withRoleAuth(SystemUpdates, ["ADMIN", "DESIGNER", "DEVELOPER"]);