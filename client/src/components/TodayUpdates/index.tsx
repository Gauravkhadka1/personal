"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useTodayUpdateSocket } from "@/hooks/useTodayUpdateSocket";
import {
  useGetTodayUpdatesByUserAndDateQuery,
  useCreateTodayUpdateMutation,
  useUpdateTodayUpdateMutation,
  useDeleteTodayUpdateMutation,
  useLikeTodayUpdateMutation,
  useUnlikeTodayUpdateMutation,
  useCreateReplyMutation,
  useLikeReplyMutation,
  useUnlikeReplyMutation,
} from "@/state/api";
import { User } from "@/state/api";
import {
  Edit,
  Trash,
  MessageCircle,
  Send,
  X,
  ThumbsUp,
  Plus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RichTextEditor from "@/components/RichTextEditor";

interface TodayUpdatesProps {
  selectedUserId: number | null;
  currentDate: Date;
  currentUser: any;
  usersData: User[] | undefined;
  showInput?: boolean;
  onUpdatesCountChange?: (count: number) => void; // Add this prop
}

interface ReplyFormState {
  updateId: number;
  content: string;
}

interface EditFormState {
  updateId: number;
  content: string;
}

const TodayUpdates: React.FC<TodayUpdatesProps> = ({
  selectedUserId,
  currentDate,
  currentUser,
  usersData,
  showInput = true,
  onUpdatesCountChange, // Add this prop
}) => {
  const [newUpdateContent, setNewUpdateContent] = useState("");
  const [replyForm, setReplyForm] = useState<ReplyFormState | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [currentLikes, setCurrentLikes] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [hoveredUpdateId, setHoveredUpdateId] = useState<number | null>(null);

  // Fetch today's updates for the selected user and date
  const {
    data: updates,
    isLoading,
    error,
    refetch,
  } = useGetTodayUpdatesByUserAndDateQuery(
    {
      userId: selectedUserId!,
      date: format(currentDate, "yyyy-MM-dd"),
    },
    {
      skip: !selectedUserId,
    },
  );

  const [createUpdate] = useCreateTodayUpdateMutation();
  const [updateUpdate] = useUpdateTodayUpdateMutation();
  const [deleteUpdate] = useDeleteTodayUpdateMutation();
  const [likeUpdate] = useLikeTodayUpdateMutation();
  const [unlikeUpdate] = useUnlikeTodayUpdateMutation();
  const [createReply] = useCreateReplyMutation();
  const [likeReply] = useLikeReplyMutation();
  const [unlikeReply] = useUnlikeReplyMutation();

  const userId = currentUser?.userId?.toString();
  useTodayUpdateSocket(userId);

  // Call onUpdatesCountChange whenever updates change
  useEffect(() => {
    if (onUpdatesCountChange && updates) {
      onUpdatesCountChange(updates.length);
    }
  }, [updates, onUpdatesCountChange]);

  const handleCreateUpdate = async () => {
    if (!newUpdateContent.trim()) return;
    setIsAdding(true);

    try {
      await createUpdate({ content: newUpdateContent }).unwrap();
      setNewUpdateContent("");
      toast.success("Additional Updates Added Successfully!");
      // Refetch to update the count
      refetch();
    } catch (error) {
      toast.error("Failed to create additional update.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateUpdate = async () => {
    if (!editForm?.content.trim() || !editForm?.updateId) return;

    try {
      await updateUpdate({
        id: editForm.updateId,
        content: editForm.content,
      }).unwrap();
      setEditForm(null);
      toast.success("Additional Updates updated Successfully!");
      // Refetch to update the count
      refetch();
    } catch (error) {
      toast.error("Failed to update post.");
    }
  };

  const handleDeleteUpdate = async (updateId: number) => {
    try {
      await deleteUpdate(updateId).unwrap();
      toast.success("Additional Updates deleted successfully!");
      // Refetch to update the count
      refetch();
    } catch (error) {
      toast.error("Failed to delete additional updates.");
    }
  };

  const handleLikeUpdate = async (updateId: number) => {
    try {
      const isLiked = updates
        ?.find((u: any) => u.id === updateId)
        ?.likes?.some((like: any) => like.userId === currentUser?.userId);

      if (isLiked) {
        await unlikeUpdate({ updateId }).unwrap();
      } else {
        await likeUpdate({ updateId }).unwrap();
      }
    } catch (error) {
      toast.error("Failed to like/unlike update.");
    }
  };

  const handleUnlikeUpdate = async (updateId: number) => {
    try {
      await unlikeUpdate({ updateId }).unwrap();
    } catch (error) {
      toast.error("Failed to unlike update.");
    }
  };

  const handleCreateReply = async () => {
    if (!replyForm?.content.trim() || !replyForm?.updateId) return;

    try {
      await createReply({
        updateId: replyForm.updateId,
        content: replyForm.content,
      }).unwrap();
      setReplyForm(null);
      toast.success("Reply posted successfully!");
      // Refetch to update the count (replies don't affect main count, but good practice)
      refetch();
    } catch (error) {
      toast.error("Failed to post reply.");
    }
  };

  const handleLikeReply = async (replyId: number) => {
    try {
      await likeReply({ replyId }).unwrap();
    } catch (error) {
      toast.error("Failed to like reply.");
    }
  };

  const handleUnlikeReply = async (replyId: number) => {
    try {
      await unlikeReply({ replyId }).unwrap();
    } catch (error) {
      toast.error("Failed to unlike reply.");
    }
  };

  const isLikedByCurrentUser = (likes: any[]) => {
    return likes.some((like) => like.userId === currentUser?.userId);
  };

  const isReplyLikedByCurrentUser = (likes: any[]) => {
    return likes.some((like) => like.userId === currentUser?.userId);
  };

  const showLikes = (likes: any[]) => {
    setCurrentLikes(likes);
    setLikesDialogOpen(true);
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

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  if (!selectedUserId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Additional Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select a user to view their updates.
          </p>
        </CardContent>
      </Card>
    );
  }

  // HIDE THE ENTIRE CARD when there are no updates, not loading, and showInput is false
  if (!isLoading && (!updates || updates.length === 0) && !showInput) {
    return null;
  }

  return (
    <div className="w-full">
      {showInput && (
        <div className="pb-2">
          <h3 className="text-lg font-semibold dark:text-gray-300">
            Additional Updates - {format(currentDate, "PPP")}
            {updates && updates.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({updates.length})
              </span>
            )}
          </h3>
        </div>
      )}
      <div className="space-y-4 dark:text-gray-300">
        {/* Create new update */}
        {showInput && selectedUserId === currentUser?.userId && (
          <div className="space-y-2">
            <RichTextEditor
              content={newUpdateContent}
              onContentChange={setNewUpdateContent}
              placeholder="Write your additional update..."
              className="bg-gray-50 dark:bg-secondary"
            />
            <Button
              onClick={handleCreateUpdate}
              disabled={!newUpdateContent.trim() || isAdding}
              className="dark:border dark:border-gray-500"
            >
              {isAdding ? (
                "Adding..."
              ) : (
                <>
                  <Plus className="h-5 w-5 cursor-pointer" />
                  Add Update
                </>
              )}
            </Button>
          </div>
        )}

        {/* Updates list */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-destructive">
            Error loading additional updates. Please try again.
          </div>
        ) : updates && updates.length > 0 ? (
          <div className="space-y-4">
            {updates.map((update: any) => (
              <div 
                key={update.id} 
                className="pb-2 border rounded-md p-4 dark:border-gray-600"
                onMouseEnter={() => setHoveredUpdateId(update.id)}
                onMouseLeave={() => setHoveredUpdateId(null)}
              >
                {/* Update header */}
                <div className="flex items-center justify-between">
                  {showInput && (
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        {update?.user?.firstname} {update?.user?.lastname}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(update.createdAt), "p")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Update content */}
                {editForm?.updateId === update.id ? (
                  <div className="space-y-1">
                    <RichTextEditor
                      content={editForm?.content || ""}
                      onContentChange={(content) => {
                        if (editForm) {
                          setEditForm({ ...editForm, content });
                        }
                      }}
                      placeholder="Edit your update..."
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleUpdateUpdate}>
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditForm(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      {renderContentWithLinks(update.content)}
                    </div>
                    {update.userId === currentUser?.userId && (
                      <div className={`flex space-x-1 transition-opacity duration-200 ${hoveredUpdateId === update.id ? 'opacity-100' : 'opacity-0'}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditForm({
                              updateId: update.id,
                              content: update.content,
                            })
                          }
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUpdate(update.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {showInput && (
                  <div>
                    {/* Like and comment buttons */}
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikeUpdate(update.id)}
                          className="h-8 px-2"
                        >
                          <ThumbsUp
                            className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${
                              isLikedByCurrentUser(update.likes || [])
                                ? "fill-blue-500 text-blue-500"
                                : ""
                            }`}
                          />
                        </Button>
                        <span
                          className="cursor-pointer text-xs text-muted-foreground hover:underline"
                          onClick={() => showLikes(update.likes || [])}
                        >
                          {update.likes?.length || 0}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setReplyForm(
                            replyForm?.updateId === update.id
                              ? null
                              : { updateId: update.id, content: "" },
                          )
                        }
                        className="h-8 px-2"
                      >
                        <MessageCircle className="mr-1 h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Reply
                        </span>
                      </Button>
                    </div>

                    {/* Reply form */}
                    {replyForm?.updateId === update.id && (
                      <div className="space-y-2 mt-2">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyForm?.content || ""}
                          onChange={(e) => {
                            if (replyForm && replyForm.updateId) {
                              setReplyForm({
                                updateId: replyForm.updateId,
                                content: e.target.value,
                              });
                            }
                          }}
                          rows={2}
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleCreateReply}>
                            <Send className="mr-1 h-4 w-4" />
                            Post Reply
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReplyForm(null)}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {update.replies && update.replies.length > 0 && (
                      <div className="space-y-3 border-l-2 border-muted pl-6 mt-2">
                        {update.replies.map((reply: any) => (
                          <div key={reply.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">
                                  {reply.user.firstname} {reply.user.lastname}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(reply.createdAt), "p")}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm">{reply.content}</p>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  isReplyLikedByCurrentUser(reply.likes || [])
                                    ? handleUnlikeReply(reply.id)
                                    : handleLikeReply(reply.id)
                                }
                                className="h-7 px-2"
                              >
                                <ThumbsUp
                                  className={`mr-1 h-3 w-3 ${
                                    isReplyLikedByCurrentUser(reply.likes || [])
                                      ? "fill-blue-500 text-blue-500"
                                      : ""
                                  }`}
                                />
                              </Button>
                              <span
                                className="cursor-pointer text-xs text-muted-foreground hover:underline"
                                onClick={() => showLikes(reply.likes || [])}
                              >
                                {reply.likes?.length || 0}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
            {showInput && (
              <p className="text-center text-muted-foreground">
                No Additional updates for {format(currentDate, "PPP")}.
              </p>
            )}
          </>
        )}
      </div>

      {/* Likes Dialog */}
      <Dialog open={likesDialogOpen} onOpenChange={setLikesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Likes</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {currentLikes?.length === 0 ? (
              <p className="text-center text-muted-foreground">No likes yet</p>
            ) : (
              <div className="space-y-2">
                {currentLikes.map((like) => (
                  <div key={like.id} className="flex items-center gap-3 p-2">
                    <Avatar className="h-8 w-8">
                      {like.user.profilePictureUrl ? (
                        <AvatarImage
                          src={buildImageUrl(like.user.profilePictureUrl)}
                        />
                      ) : (
                        <AvatarFallback>
                          {like.user.firstname?.charAt(0)}
                          {like.user.lastname?.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span>
                      {like.user.username ||
                        `${like.user.firstname} ${like.user.lastname}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TodayUpdates;