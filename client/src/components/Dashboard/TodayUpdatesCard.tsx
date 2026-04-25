import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetTodayUpdatesQuery,
  useGetUserTodayUpdatesQuery,
  useCreateTodayUpdateMutation,
  useUpdateTodayUpdateMutation,
  useDeleteTodayUpdateMutation,
  useLikeTodayUpdateMutation,
  useUnlikeTodayUpdateMutation,
  useCreateReplyMutation,
  useLikeReplyMutation,
  useUnlikeReplyMutation,
} from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Pencil,
  Trash,
  Filter,
  ThumbsUp,
  ChevronDown,
  Heart,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useGetUsersQuery } from "@/state/api";
import Select from "react-select";

import { UserStatus } from "@/components/UserStatus";

import { formatDistanceToNow, isSameDay } from "date-fns";
import { toZonedTime, format } from "date-fns-tz";
import RichTextEditor from "@/components/RichTextEditor";

const TodayUpdatesCard = () => {
  const { user } = useAuth();
  const userId = user?.userId;
  const isAdmin = user?.role === "ADMIN";
  const isAdminOrDesignerOrDeveloper =
    user?.role === "ADMIN" ||
    user?.role === "DESIGNER" ||
    user?.role === "DEVELOPER";
  const [newUpdate, setNewUpdate] = useState("");
  const [editingUpdate, setEditingUpdate] = useState<any>(null);
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<number | null>(null);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(
    null,
  );
  const [replyingToUpdate, setReplyingToUpdate] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [currentLikes, setCurrentLikes] = useState<any[]>([]);
  const [showReplies, setShowReplies] = useState<Record<number, boolean>>({});

  const [creatingUpdate, setCreatingUpdate] = useState(false);
  const [updatingUpdate, setUpdatingUpdate] = useState(false);
  const [likingUpdateId, setLikingUpdateId] = useState<number | null>(null);
  const [likingReplyId, setLikingReplyId] = useState<number | null>(null);
  const [replyingUpdateId, setReplyingUpdateId] = useState<number | null>(null);

  // Update the handleCreateUpdate and handleUpdateUpdate functions to remove isRichText checks
  const handleCreateUpdate = async () => {
    const content = newUpdate;
    if (!content) {
      toast.error("Update content is required");
      return;
    }

    setCreatingUpdate(true);
    try {
      await createUpdate({ content }).unwrap();
      setNewUpdate("");
      setIsAddingUpdate(false);
      toast.success("Update created successfully");
    } catch (error) {
      toast.error("Failed to create update");
    } finally {
      setCreatingUpdate(false);
    }
  };

  const handleUpdateUpdate = async () => {
    if (!editingUpdate) return;
    const content = editingUpdate.content;

    setUpdatingUpdate(true);
    try {
      await updateUpdate({
        id: editingUpdate.id,
        content,
      }).unwrap();
      setEditingUpdate(null);
      toast.success("Update updated successfully");
    } catch (error) {
      toast.error("Failed to update update");
    } finally {
      setUpdatingUpdate(false);
    }
  };

  // Modify the update display to render HTML content safely
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

  const handleDeleteClick = (id: number) => {
    setUpdateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (updateToDelete) {
      await handleDeleteUpdate(updateToDelete);
      setDeleteDialogOpen(false);
      setUpdateToDelete(null);
    }
  };

  const nepalTimeZone = "Asia/Kathmandu";

  // Fetch data
  const { data: allUpdates } = useGetTodayUpdatesQuery();
  const { data: userUpdates } = useGetUserTodayUpdatesQuery(userId);
  const { data: users } = useGetUsersQuery();
  const [createUpdate] = useCreateTodayUpdateMutation();
  const [updateUpdate] = useUpdateTodayUpdateMutation();
  const [deleteUpdate] = useDeleteTodayUpdateMutation();
  const [likeUpdate] = useLikeTodayUpdateMutation();
  const [unlikeUpdate] = useUnlikeTodayUpdateMutation();
  const [createReply] = useCreateReplyMutation();
  const [likeReply] = useLikeReplyMutation();
  const [unlikeReply] = useUnlikeReplyMutation();

  const isTodayInNepal = (date: string) => {
    const updateDate = toZonedTime(new Date(date), nepalTimeZone);
    const today = toZonedTime(new Date(), nepalTimeZone);
    return isSameDay(updateDate, today);
  };

  // Replace the existing updates filtering logic

  let updates = isAdminOrDesignerOrDeveloper ? allUpdates : userUpdates;
  updates = updates?.filter((update) => isTodayInNepal(update.createdAt));
  if (isAdminOrDesignerOrDeveloper && selectedUserFilter) {
    updates = updates?.filter(
      (update) => update.userId.toString() === selectedUserFilter,
    );
  } else if (!isAdmin && isAdminOrDesignerOrDeveloper) {
    updates = updates?.filter(
      (update) => ![11, 24, 30].includes(update.userId),
    );
  }

  const handleDeleteUpdate = async (id: number) => {
    try {
      await deleteUpdate(id).unwrap();
      toast.success("Update deleted successfully");
    } catch (error) {
      toast.error("Failed to delete update");
    }
  };

  const handleLikeUpdate = async (updateId: number) => {
    setLikingUpdateId(updateId);
    try {
      const isLiked = updates
        ?.find((u) => u.id === updateId)
        ?.likes?.some((like) => like.userId === userId);

      if (isLiked) {
        await unlikeUpdate({ updateId }).unwrap();
      } else {
        await likeUpdate({ updateId }).unwrap();
      }
    } catch (error) {
      toast.error("Failed to like/unlike update");
    } finally {
      setLikingUpdateId(null);
    }
  };

  const handleLikeReply = async (replyId: number) => {
    setLikingReplyId(replyId);
    try {
      let isLiked = false;
      updates?.forEach((update) => {
        update.replies?.forEach((reply) => {
          if (
            reply.id === replyId &&
            reply.likes?.some((like) => like.userId === userId)
          ) {
            isLiked = true;
          }
        });
      });

      if (isLiked) {
        await unlikeReply({ replyId }).unwrap();
      } else {
        await likeReply({ replyId }).unwrap();
      }
    } catch (error) {
      toast.error("Failed to like/unlike reply");
    } finally {
      setLikingReplyId(null);
    }
  };

  const handleReplySubmit = async (updateId: number) => {
    if (!replyContent) {
      toast.error("Reply content is required");
      return;
    }
    setReplyingUpdateId(updateId);

    try {
      await createReply({ updateId, content: replyContent }).unwrap();
      setReplyContent("");
      setReplyingToUpdate(null);
      setShowReplies((prev) => ({ ...prev, [updateId]: true }));
      toast.success("Reply added successfully");
    } catch (error) {
      toast.error("Failed to add reply");
    } finally {
      setReplyingUpdateId(null);
    }
  };

  const toggleReplies = (updateId: number) => {
    setShowReplies((prev) => ({ ...prev, [updateId]: !prev[updateId] }));
  };

  const showLikes = (likes: any[]) => {
    setCurrentLikes(likes);
    setLikesDialogOpen(true);
  };

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  return (
    <Card className="w-full border border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-secondary-dark">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-8">
          <div>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-2xl font-semibold dark:text-gray-300">
                {isAdmin ? "Today Updates" : "Today Updates"}
              </CardTitle>
              {user?.picture && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.picture} />
                  <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>

          {isAdminOrDesignerOrDeveloper ? (
            <div className="flex justify-end">
              <Select
                className="w-64 text-sm"
                options={[
                  { value: null, label: "All Team Members" },
                  ...(users
                    ?.filter(
                      (user) =>
                        isAdmin
                          ? user.userId !== undefined // ADMIN sees all users
                          : user.userId !== undefined &&
                            ["DESIGNER", "DEVELOPER"].includes(user.role) &&
                            ![11, 24, 26, 30].includes(user.userId), // DESIGNER/DEVELOPER exclude specific IDs
                    )
                    .map((user) => ({
                      value: user.userId!.toString(),
                      label:
                        user.username || `${user.firstname} ${user.lastname}`,
                      image: user.profilePictureUrl,
                    })) || []),
                ]}
                value={
                  selectedUserFilter
                    ? {
                        value: selectedUserFilter,
                        label:
                          users?.find(
                            (u) => u.userId?.toString() === selectedUserFilter,
                          )?.username ||
                          `${users?.find((u) => u.userId?.toString() === selectedUserFilter)?.firstname || ""} ${
                            users?.find(
                              (u) =>
                                u.userId?.toString() === selectedUserFilter,
                            )?.lastname || ""
                          }`.trim(),
                        image: users?.find(
                          (u) => u.userId?.toString() === selectedUserFilter,
                        )?.profilePictureUrl,
                      }
                    : { value: null, label: "Filter by user" }
                }
                onChange={(selectedOption) => {
                  setSelectedUserFilter(selectedOption?.value || null);
                }}
                isSearchable
                placeholder="Filter by user..."
                formatOptionLabel={(user) => (
                  <div className="flex items-center gap-2">
                    {user.value && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={
                            user.image ? buildImageUrl(user.image) : undefined
                          }
                        />
                        <AvatarFallback>
                          {user.label
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="dark:text-gray-300">{user.label}</span>
                  </div>
                )}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: "36px",
                    height: "36px",
                    backgroundColor: "hsl(var(--background))",
                    borderColor: state.isFocused
                      ? "hsl(var(--ring))"
                      : "hsl(var(--border))",
                    boxShadow: state.isFocused
                      ? "0 0 0 1px hsl(var(--ring))"
                      : "none",
                    "&:hover": {
                      borderColor: "hsl(var(--ring))",
                    },
                  }),
                  input: (base) => ({
                    ...base,
                    color: "hsl(var(--foreground))",
                    margin: "0px",
                    paddingBottom: "0px",
                    paddingTop: "0px",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "hsl(var(--muted-foreground))",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "hsl(var(--foreground))",
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    padding: "4px",
                    color: "hsl(var(--muted-foreground))",
                    "&:hover": {
                      color: "hsl(var(--foreground))",
                    },
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    padding: "4px",
                    color: "hsl(var(--muted-foreground))",
                    "&:hover": {
                      color: "hsl(var(--foreground))",
                    },
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: "0px 8px",
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                  }),
                  option: (base, state) => ({
                    ...base,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: state.isSelected
                      ? "hsl(var(--accent))"
                      : state.isFocused
                        ? "hsl(var(--accent))"
                        : "transparent",
                    color: state.isSelected
                      ? "hsl(var(--accent-foreground))"
                      : "hsl(var(--foreground))",
                    "&:active": {
                      backgroundColor: "hsl(var(--accent))",
                    },
                  }),
                  indicatorSeparator: (base) => ({
                    ...base,
                    backgroundColor: "hsl(var(--border))",
                  }),
                }}
                classNames={{
                  control: ({ isFocused }) =>
                    `dark:bg-secondary-dark dark:border-gray-700 ${
                      isFocused ? "dark:ring-1 dark:ring-gray-500" : ""
                    }`,
                  menu: () => "dark:bg-secondary-dark dark:border-gray-700",
                  option: ({ isSelected, isFocused }) =>
                    `dark:hover:bg-gray-700 ${
                      isSelected
                        ? "dark:bg семь-gray-700"
                        : isFocused
                          ? "dark:bg-gray-800"
                          : ""
                    }`,
                }}
              />
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Updates List */}
        <div
          className="custom-scrollbar divide-y divide-gray-200 dark:divide-gray-600"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {updates?.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-base text-muted-foreground">
                {selectedUserFilter
                  ? "No updates from this user yet today"
                  : "No updates yet for today"}
              </p>
            </div>
          )}
          {updates?.map((update) => (
            <div
              key={update.id}
              className="group relative p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {editingUpdate?.id === update.id ? (
                <div className="space-y-4">
                  <RichTextEditor
                    content={editingUpdate.content}
                    onContentChange={(content) =>
                      setEditingUpdate({
                        ...editingUpdate,
                        content,
                      })
                    }
                    placeholder="Edit your update..."
                    className="min-h-[200px]"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleUpdateUpdate}>
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUpdate(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {update.user && (
                        <Avatar className="relative mb-3 h-12 w-12 cursor-pointer">
                          {update.user.profilePictureUrl ? (
                            <AvatarImage
                              src={buildImageUrl(update.user.profilePictureUrl)}
                              alt={`${update.user.firstname} ${update.user.lastname}`}
                            />
                          ) : (
                            <AvatarFallback className="text-xl">
                              {update.user.firstname?.charAt(0)}
                              {update.user.lastname?.charAt(0)}
                            </AvatarFallback>
                          )}
                          <UserStatus
                            lastSeenAt={update.user.lastSeenAt}
                            className="absolute -bottom-0 -right-0"
                            showOnlyDot
                          />
                        </Avatar>
                      )}
                      <div>
                        {update.user && (
                          <span className="dark:gray-200 text-base text-gray-600">
                            {update.user.username ||
                              `${update.user.firstname} ${update.user.lastname}`}
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(update.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {" "}
                      {format(new Date(update.createdAt), "MMMM d, h:mm a", {
                        timeZone: nepalTimeZone,
                      })}
                    </div>
                  </div>
                  <div className="overflow-hidden whitespace-pre-wrap break-words text-base text-gray-600 dark:text-gray-300">
                    {renderContentWithLinks(update.content)}
                  </div>

                  {/* Like and Reply Actions */}
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 p-0 text-muted-foreground hover:text-primary"
                        onClick={() => handleLikeUpdate(update.id)}
                        disabled={likingUpdateId === update.id}
                      >
                        {likingUpdateId === update.id ? (
                          <div className="relative h-4 w-4">
                            <ThumbsUp className="absolute h-4 w-4 animate-[spin_1s_linear_infinite] fill-blue-500 text-blue-500 opacity-70" />
                            <ThumbsUp className="absolute h-4 w-4 scale-150 animate-[pulse_1.5s_ease-in-out_infinite] opacity-40" />
                          </div>
                        ) : (
                          <ThumbsUp
                            className={`h-4 w-4 ${
                              update.likes?.some(
                                (like) => like.userId === userId,
                              )
                                ? "fill-current text-blue-400"
                                : ""
                            }`}
                          />
                        )}
                      </Button>
                      <span
                        className="cursor-pointer text-xs text-muted-foreground hover:underline"
                        onClick={() => showLikes(update.likes || [])}
                      >
                        {update.likes?.length || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 p-0 text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setReplyingToUpdate(update.id);
                          setShowReplies((prev) => ({
                            ...prev,
                            [update.id]: true,
                          }));
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <span
                        className="cursor-pointer text-xs text-muted-foreground hover:underline"
                        onClick={() => toggleReplies(update.id)}
                      >
                        {update.replies?.length} replies
                      </span>
                    </div>
                  </div>

                  {/* Reply Form */}
                  {replyingToUpdate === update.id && (
                    <div className="ml-12 mt-3">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        rows={2}
                        className="mb-2 w-full resize-none rounded-lg border border-gray-200 p-2 text-sm dark:border-gray-600"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReplyingToUpdate(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReplySubmit(update.id)}
                          disabled={replyingUpdateId === update.id}
                        >
                          {replyingUpdateId === update.id ? (
                            <span className="flex items-center justify-center">
                              <svg
                                className="-ml-1 mr-3 h-4 w-4 animate-spin text-white"
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
                              Replying...
                            </span>
                          ) : (
                            "Reply"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Replies Section */}
                  {showReplies[update.id] && update.replies?.length > 0 && (
                    <div className="ml-12 mt-3 space-y-3 border-l-2 border-gray-200 pl-3 dark:border-gray-600">
                      {update.replies.map((reply) => (
                        <div key={reply.id} className="group relative">
                          <div className="flex items-start gap-2">
                            {reply.user && (
                              <Avatar className="h-8 w-8">
                                {reply.user.profilePictureUrl ? (
                                  <AvatarImage
                                    src={buildImageUrl(
                                      reply.user.profilePictureUrl,
                                    )}
                                    alt={`${reply.user.firstname} ${reply.user.lastname}`}
                                  />
                                ) : (
                                  <AvatarFallback>
                                    {reply.user.firstname?.charAt(0)}
                                    {reply.user.lastname?.charAt(0)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            )}
                            <div className="flex-1">
                              <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {reply.user?.username ||
                                      `${reply.user?.firstname} ${reply.user?.lastname}`}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(
                                      new Date(reply.createdAt),
                                      {
                                        addSuffix: true,
                                      },
                                    )}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm">{reply.content}</p>
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 p-0 text-xs text-muted-foreground hover:text-primary"
                                  onClick={() => handleLikeReply(reply.id)}
                                  disabled={likingReplyId === reply.id}
                                >
                                  {likingReplyId === reply.id ? (
                                    <div className="relative mr-1 h-3 w-3">
                                      <ThumbsUp className="absolute h-3 w-3 animate-[spin_1s_linear_infinite] fill-blue-500 text-blue-500 opacity-70" />
                                      <ThumbsUp className="absolute h-3 w-3 scale-150 animate-[pulse_1.5s_ease-in-out_infinite] opacity-40" />
                                    </div>
                                  ) : (
                                    <ThumbsUp
                                      className={`mr-1 h-3 w-3 ${
                                        reply.likes.some(
                                          (like) => like.userId === userId,
                                        )
                                          ? "fill-current text-blue-400"
                                          : ""
                                      }`}
                                    />
                                  )}
                                  Like
                                </Button>
                                <span
                                  className="cursor-pointer text-xs text-muted-foreground hover:underline"
                                  onClick={() => showLikes(reply.likes)}
                                >
                                  {reply.likes?.length} likes
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {update.userId === userId && (
                    <div className="absolute right-2 top-2 z-10 flex space-x-1 rounded-lg border border-gray-200 bg-white/90 p-1 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-900/90">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingUpdate(update)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(update.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Update Section */}
        <div className="border-t p-4">
          {isAddingUpdate ? (
            <div className="space-y-4">
              <RichTextEditor
                content={newUpdate}
                onContentChange={setNewUpdate}
                placeholder="Write your update..."
                className="min-h-[200px]"
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleCreateUpdate}
                  disabled={creatingUpdate}
                >
                  {creatingUpdate ? "Adding..." : "Add Update"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingUpdate(false);
                    setNewUpdate("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setIsAddingUpdate(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your Today's Updates
            </Button>
          )}
        </div>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              update.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </Card>
  );
};

export default TodayUpdatesCard;
