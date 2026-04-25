// client\src\components\KnowledgeSharing\KnowledgeSharing.tsx
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetKnowledgeSharingsQuery,
  useCreateKnowledgeSharingMutation,
  useUpdateKnowledgeSharingMutation,
  useDeleteKnowledgeSharingMutation,
  useDeleteKnowledgeSharingAttachmentMutation,
  useLikeKnowledgeSharingMutation,
  useUnlikeKnowledgeSharingMutation,
  useCreateCommentMutation,
  useDeleteCommentMutation,
} from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Pencil,
  Trash,
  Paperclip,
  X,
  Image as ImageIcon,
  Heart,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  MoreHorizontal,
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
import { formatDistanceToNow } from "date-fns";
import { UserStatus } from "@/components/UserStatus";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  YouTubeEmbed,
  extractYouTubeVideoId,
  isYouTubeUrl,
} from "@/components/KnowledgeSharing/YouTubePreview";
import UserListSidebar from "@/components/KnowledgeSharing/UserListSidebar";
import RichTextEditor from "@/components/RichTextEditor";

const KnowledgeSharingCard = () => {
  const { user } = useAuth();
  const userId = user?.userId;
  const [newKnowledgeSharing, setNewKnowledgeSharing] = useState("");
  const [editingKnowledgeSharing, setEditingKnowledgeSharing] =
    useState<any>(null);
  const [isAddingKnowledgeSharing, setIsAddingKnowledgeSharing] =
    useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [knowledgeSharingToDelete, setKnowledgeSharingToDelete] = useState<
    number | null
  >(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(
    null,
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [expandedComments, setExpandedComments] = useState<
    Record<number, boolean>
  >({});
  const [newComments, setNewComments] = useState<Record<number, string>>({});
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [currentLikes, setCurrentLikes] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filteredUserId, setFilteredUserId] = useState<number | null>(null);

  const { data: knowledgeSharings, refetch } = useGetKnowledgeSharingsQuery();
  const [createKnowledgeSharing] = useCreateKnowledgeSharingMutation();
  const [updateKnowledgeSharing] = useUpdateKnowledgeSharingMutation();
  const [deleteKnowledgeSharing] = useDeleteKnowledgeSharingMutation();
  const [deleteAttachment] = useDeleteKnowledgeSharingAttachmentMutation();
  const [likeKnowledgeSharing] = useLikeKnowledgeSharingMutation();
  const [unlikeKnowledgeSharing] = useUnlikeKnowledgeSharingMutation();
  const [createComment] = useCreateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const renderContentWithLinks = (content: string) => {
    if (!content) return null;

    // Check if content contains YouTube links (either in HTML or plain text)
    const hasYouTubeLinks = 
      (content.startsWith("<") && content.includes('youtube.com')) || 
      (!content.startsWith("<") && isYouTubeUrl(content));

    if (hasYouTubeLinks) {
      return <YouTubeEmbed html={content.startsWith("<") ? content : undefined} text={content.startsWith("<") ? undefined : content} />;
    }

    // For HTML content without YouTube links
    if (content.startsWith("<")) {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }

    // For plain text without YouTube links
    return (
      <div className="space-y-2">
        {content.split(/(\s+)/).map((part, index) => {
          const isUrl = /^https?:\/\/[^\s]+$/.test(part);
          return isUrl ? (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {part}
            </a>
          ) : (
            <span key={index}>{part}</span>
          );
        })}
      </div>
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachments([...attachments, ...files]);

      // Create previews for images
      const newPreviews = files.map((file) => {
        if (file.type.startsWith("image/")) {
          return URL.createObjectURL(file);
        }
        return "";
      });
      setAttachmentPreviews([...attachmentPreviews, ...newPreviews]);
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);

    const newPreviews = [...attachmentPreviews];
    const removedPreview = newPreviews.splice(index, 1)[0];
    if (removedPreview.startsWith("blob:")) {
      URL.revokeObjectURL(removedPreview);
    }
    setAttachmentPreviews(newPreviews);
  };

  const handleCreateKnowledgeSharing = async () => {
    if (!newKnowledgeSharing && attachments.length === 0) {
      toast.error("Either content or attachment is required");
      return;
    }

    try {
      await createKnowledgeSharing({
        content: newKnowledgeSharing,
        attachments,
      }).unwrap();
      setNewKnowledgeSharing("");
      setAttachments([]);
      setAttachmentPreviews([]);
      setIsAddingKnowledgeSharing(false);
      toast.success("Knowledge Shared successfully");
    } catch (error) {
      toast.error("Failed to Share knowledge");
    }
  };

  const handleUpdateKnowledgeSharing = async () => {
    if (!editingKnowledgeSharing) return;

    if (!editingKnowledgeSharing.content && attachments.length === 0) {
      toast.error("Either content or attachment is required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", editingKnowledgeSharing.content);

      // Add new attachments if any
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      await updateKnowledgeSharing({
        id: editingKnowledgeSharing.id,
        formData,
      }).unwrap();

      setEditingKnowledgeSharing(null);
      setAttachments([]);
      setAttachmentPreviews([]);
      toast.success("Knowledge sharing updated successfully");
    } catch (error) {
      toast.error("Failed to update knowledge sharing");
    }
  };

  const handleDeleteKnowledgeSharing = async (id: number) => {
    try {
      await deleteKnowledgeSharing(id).unwrap();
      toast.success("KnowledgeSharing deleted successfully");
    } catch (error) {
      toast.error("Failed to delete knowledgeSharing");
    }
  };

  const handleDeleteAttachment = async (
    knowledgeSharingId: number,
    attachmentId: number,
  ) => {
    try {
      await deleteAttachment({ knowledgeSharingId, attachmentId }).unwrap();
      toast.success("Attachment deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete attachment");
    }
  };

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

    // Remove any leading slashes or backslashes from the imagePath
    const cleanPath = imagePath.replace(/^[\\/]/, "");

    // Check if the path already contains 'uploads' to avoid duplication
    if (cleanPath.includes("uploads/")) {
      return `${baseUrl}/${cleanPath}`;
    }

    return `${baseUrl}/uploads/${cleanPath}`;
  };

  const toggleLike = async (knowledgeSharingId: number, isLiked: boolean) => {
    try {
      if (isLiked) {
        await unlikeKnowledgeSharing(knowledgeSharingId).unwrap();
      } else {
        await likeKnowledgeSharing(knowledgeSharingId).unwrap();
      }
    } catch (error) {
      toast.error("Failed to update like");
    }
  };

  const toggleComments = (knowledgeSharingId: number) => {
    setExpandedComments((prev) => ({
      ...prev,
      [knowledgeSharingId]: !prev[knowledgeSharingId],
    }));
  };

  const handleCommentChange = (knowledgeSharingId: number, content: string) => {
    setNewComments((prev) => ({
      ...prev,
      [knowledgeSharingId]: content,
    }));
  };

  const submitComment = async (knowledgeSharingId: number) => {
    if (!newComments[knowledgeSharingId]?.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      await createComment({
        knowledgeSharingId,
        content: newComments[knowledgeSharingId],
      }).unwrap();
      setNewComments((prev) => ({
        ...prev,
        [knowledgeSharingId]: "",
      }));
    } catch (error) {
      toast.error("Failed to post comment");
    }
  };

  const handleDeleteComment = async (
    knowledgeSharingId: number,
    commentId: number,
  ) => {
    try {
      await deleteComment({ knowledgeSharingId, commentId }).unwrap();
      toast.success("Comment deleted successfully");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const showLikes = (likes: any[]) => {
    setCurrentLikes(likes);
    setLikesDialogOpen(true);
  };

  const navigateImage = (direction: "prev" | "next", knowledgeSharing: any) => {
    const imageAttachments = knowledgeSharing.attachments.filter(
      (attachment: any) =>
        attachment.fileName.match(/\.(jpeg|jpg|gif|png|webp)$/i),
    );

    if (direction === "prev") {
      setCurrentImageIndex((prev) =>
        prev === 0 ? imageAttachments.length - 1 : prev - 1,
      );
    } else {
      setCurrentImageIndex((prev) =>
        prev === imageAttachments.length - 1 ? 0 : prev + 1,
      );
    }
  };

  const renderAttachments = (attachments: any[]) => {
    if (!attachments || attachments.length === 0) return null;

    const imageAttachments = attachments.filter((attachment) =>
      attachment.fileName.match(/\.(jpeg|jpg|gif|png|webp)$/i),
    );
    const otherAttachments = attachments.filter(
      (attachment) => !attachment.fileName.match(/\.(jpeg|jpg|gif|png|webp)$/i),
    );

    return (
      <div className="mt-3 space-y-2">
        {/* Image attachments */}
        {imageAttachments.length > 0 && (
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns:
                imageAttachments.length === 1
                  ? "1fr"
                  : imageAttachments.length === 2
                    ? "1fr 1fr"
                    : "1fr 1fr",
            }}
          >
            {imageAttachments.slice(0, 4).map((attachment, index) => (
              <div
                key={attachment.id}
                className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                onClick={() => {
                  const url = buildImageUrl(attachment.fileURL);
                  setViewingAttachment(url);
                  setCurrentImageIndex(index);
                }}
              >
                <img
                  src={buildImageUrl(attachment.fileURL)}
                  alt={attachment.fileName}
                  className="h-full w-full cursor-pointer object-cover transition-opacity hover:opacity-90"
                />
                {index === 3 && imageAttachments.length > 4 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-bold text-white">
                    +{imageAttachments.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Other attachments */}
        {otherAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {otherAttachments.map((attachment) => (
              <div key={attachment.id} className="relative">
                <div
                  className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-muted-foreground hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                  onClick={() => {
                    const url = buildImageUrl(attachment.fileURL);
                    window.open(url, "_blank");
                  }}
                >
                  <Paperclip className="h-3 w-3" />
                  <span className="max-w-[120px] truncate">
                    {attachment.fileName}
                  </span>
                </div>
                {attachment.uploadedById === userId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-destructive/80 p-0 text-white hover:bg-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAttachment(
                        attachment.knowledgeSharingId,
                        attachment.id,
                      );
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const userPostCounts = knowledgeSharings?.reduce(
    (acc, ks) => {
      acc[ks.userId] = (acc[ks.userId] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  return (
    <div className="flex gap-12">
      <Card className="w-[70%] border border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-secondary-dark">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold dark:text-gray-300">
            Knowledge Sharing
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div
            className="custom-scrollbar divide-y divide-gray-200 dark:divide-gray-600"
            style={{ maxHeight: "600px", overflowY: "auto" }}
          >
            {!knowledgeSharings ? (
              // Loading state
              <div className="space-y-4 p-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : knowledgeSharings.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No knowledgeSharing yet
                </p>
              </div>
            ) : (
              (filteredUserId
                ? knowledgeSharings.filter((ks) => ks.userId === filteredUserId)
                : knowledgeSharings
              ).map((knowledgeSharing: any) => (
                <div
                  key={knowledgeSharing.id}
                  className="group relative p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {editingKnowledgeSharing?.id === knowledgeSharing.id ? (
                    <div className="space-y-4">
                      <RichTextEditor
                        content={editingKnowledgeSharing.content}
                        onContentChange={(content) =>
                          setEditingKnowledgeSharing({
                            ...editingKnowledgeSharing,
                            content,
                          })
                        }
                        placeholder="Share your knowledge..."
                        withAttachments={true}
                        attachments={attachments}
                        onAttachmentsChange={setAttachments}
                        attachmentPreviews={attachmentPreviews}
                        onRemoveAttachment={removeAttachment}
                      />

                      {/* Show existing attachments with delete option */}
                      {(knowledgeSharing.attachments?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {(knowledgeSharing.attachments ?? []).map(
                            (attachment: any) => (
                              <div key={attachment.id} className="relative">
                                {attachment.fileName.match(
                                  /\.(jpeg|jpg|gif|png|webp)$/i,
                                ) ? (
                                  <div className="h-16 w-16 overflow-hidden rounded-md border border-gray-200">
                                    <img
                                      src={buildImageUrl(attachment.fileURL)}
                                      alt={attachment.fileName}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex h-16 w-16 items-center justify-center rounded-md border border-gray-200 bg-gray-100">
                                    <Paperclip className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-destructive/80 p-0 text-white hover:bg-destructive"
                                  onClick={() =>
                                    handleDeleteAttachment(
                                      knowledgeSharing.id,
                                      attachment.id,
                                    )
                                  }
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ),
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Paperclip className="mr-2 h-4 w-4" />
                            Add Files
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              multiple
                              className="hidden"
                              accept="image/*,.pdf,.doc,.docx"
                            />
                          </Button>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingKnowledgeSharing(null);
                              setAttachments([]);
                              setAttachmentPreviews([]);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleUpdateKnowledgeSharing}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {knowledgeSharing.user && (
                            <Avatar className="relative mb-3 h-12 w-12 cursor-pointer">
                              {knowledgeSharing.user.profilePictureUrl ? (
                                <AvatarImage
                                  src={buildImageUrl(
                                    knowledgeSharing.user.profilePictureUrl,
                                  )}
                                  alt={`${knowledgeSharing.user.firstname} ${knowledgeSharing.user.lastname}`}
                                />
                              ) : (
                                <AvatarFallback className="text-xl">
                                  {knowledgeSharing.user.firstname?.charAt(0)}
                                  {knowledgeSharing.user.lastname?.charAt(0)}
                                </AvatarFallback>
                              )}
                              <UserStatus
                                lastSeenAt={knowledgeSharing.user.lastSeenAt}
                                className="absolute -bottom-0 -right-0"
                                showOnlyDot
                              />
                            </Avatar>
                          )}
                          <div>
                            {knowledgeSharing.user && (
                              <span className="text-sm text-muted-foreground">
                                {knowledgeSharing.user.username ||
                                  `${knowledgeSharing.user.firstname} ${knowledgeSharing.user.lastname}`}
                              </span>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(knowledgeSharing.createdAt),
                                {
                                  addSuffix: true,
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        {knowledgeSharing.userId === userId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  setEditingKnowledgeSharing(knowledgeSharing)
                                }
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setKnowledgeSharingToDelete(
                                    knowledgeSharing.id,
                                  );
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      <div className="overflow-hidden whitespace-pre-wrap break-words text-base text-gray-600 dark:text-gray-300">
                        {renderContentWithLinks(knowledgeSharing.content)}
                      </div>

                      {/* Attachments */}
                      {renderAttachments(knowledgeSharing.attachments || [])}

                      {/* Like and Comment Section */}
                      <div className="mt-3 flex items-center justify-between border-t pt-3">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 p-0 text-muted-foreground hover:text-primary"
                              onClick={() =>
                                toggleLike(
                                  knowledgeSharing.id,
                                  knowledgeSharing.likes?.some(
                                    (like: any) => like.userId === userId,
                                  ) || false,
                                )
                              }
                            >
                              <ThumbsUp
                                className={`h-4 w-4 ${
                                  knowledgeSharing.likes?.some(
                                    (like: any) => like.userId === userId,
                                  )
                                    ? "fill-current text-blue-400"
                                    : ""
                                }`}
                              />
                            </Button>
                            <span
                              className="cursor-pointer text-xs text-muted-foreground hover:underline"
                              onClick={() =>
                                showLikes(knowledgeSharing.likes || [])
                              }
                            >
                              {knowledgeSharing._count?.likes || 0}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => toggleComments(knowledgeSharing.id)}
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>
                              {knowledgeSharing._count?.comments || 0}
                            </span>
                          </Button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      {expandedComments[knowledgeSharing.id] && (
                        <div className="mt-3 space-y-3 border-t pt-3">
                          {/* Comment input */}
                          <div className="flex items-start gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={
                                  user?.profilePictureUrl
                                    ? buildImageUrl(user.profilePictureUrl)
                                    : undefined
                                }
                                alt={
                                  user?.username ||
                                  `${user?.firstname} ${user?.lastname}`
                                }
                              />
                              <AvatarFallback>
                                {user?.firstname?.charAt(0)}
                                {user?.lastname?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <Textarea
                                placeholder="Write a comment..."
                                value={newComments[knowledgeSharing.id] || ""}
                                onChange={(e) =>
                                  handleCommentChange(
                                    knowledgeSharing.id,
                                    e.target.value,
                                  )
                                }
                                className="min-h-[40px]"
                              />
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    submitComment(knowledgeSharing.id)
                                  }
                                >
                                  Post
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Comments list */}
                          {knowledgeSharing.comments?.length ? (
                            <div className="space-y-3">
                              {knowledgeSharing.comments.map((comment: any) => (
                                <div
                                  key={comment.id}
                                  className="flex items-start gap-2"
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={
                                        comment.user?.profilePictureUrl
                                          ? buildImageUrl(
                                              comment.user.profilePictureUrl,
                                            )
                                          : undefined
                                      }
                                      alt={
                                        comment.user?.username ||
                                        `${comment.user?.firstname} ${comment.user?.lastname}`
                                      }
                                    />
                                    <AvatarFallback>
                                      {comment.user?.firstname?.charAt(0)}
                                      {comment.user?.lastname?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                          {comment.user?.username ||
                                            `${comment.user?.firstname} ${comment.user?.lastname}`}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(
                                            new Date(comment.createdAt),
                                            {
                                              addSuffix: true,
                                            },
                                          )}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-sm">
                                        {comment.content}
                                      </p>
                                    </div>
                                    {(comment.userId === userId ||
                                      knowledgeSharing.userId === userId) && (
                                      <div className="mt-1 flex justify-end">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 text-xs text-destructive"
                                          onClick={() =>
                                            handleDeleteComment(
                                              knowledgeSharing.id,
                                              comment.id,
                                            )
                                          }
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-sm text-muted-foreground">
                              No comments yet
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add KnowledgeSharing Section */}
          <div className="border-t p-4">
            {isAddingKnowledgeSharing ? (
              <div className="space-y-4">
                <RichTextEditor
                  content={newKnowledgeSharing}
                  onContentChange={setNewKnowledgeSharing}
                  placeholder="Share your knowledge..."
                  withAttachments={true}
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                  attachmentPreviews={attachmentPreviews}
                  onRemoveAttachment={removeAttachment}
                />

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="mr-2 h-4 w-4" />
                      Attach Files
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                      />
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingKnowledgeSharing(false);
                        setNewKnowledgeSharing("");
                        setAttachments([]);
                        setAttachmentPreviews([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleCreateKnowledgeSharing}>
                      Share Knowledge
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                onClick={() => setIsAddingKnowledgeSharing(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Share Knowledge
              </Button>
            )}
          </div>
        </CardContent>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                knowledgeSharing.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (knowledgeSharingToDelete) {
                    handleDeleteKnowledgeSharing(knowledgeSharingToDelete);
                    setDeleteDialogOpen(false);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Attachment Viewer Dialog */}
        <Dialog
          open={!!viewingAttachment}
          onOpenChange={(open) => !open && setViewingAttachment(null)}
        >
          <DialogContent className="max-w-4xl p-0">
            {viewingAttachment && (
              <div className="relative">
                <img
                  src={viewingAttachment}
                  alt="Attachment"
                  className="max-h-[80vh] w-full object-contain"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    const knowledgeSharing = knowledgeSharings?.find((ks) =>
                      ks.attachments?.some(
                        (att: any) =>
                          buildImageUrl(att.fileURL) === viewingAttachment,
                      ),
                    );
                    if (knowledgeSharing) {
                      navigateImage("prev", knowledgeSharing);
                      const prevAttachment = (
                        knowledgeSharing.attachments ?? []
                      ).filter((att: any) =>
                        att.fileName.match(/\.(jpeg|jpg|gif|png|webp)$/i),
                      )[currentImageIndex];
                      if (prevAttachment) {
                        setViewingAttachment(
                          buildImageUrl(prevAttachment.fileURL),
                        );
                      }
                    }
                  }}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white hover:bg-black/50"
                  onClick={(e) => {
                    e.stopPropagation();
                    const knowledgeSharing = knowledgeSharings?.find((ks) =>
                      ks.attachments?.some(
                        (att: any) =>
                          buildImageUrl(att.fileURL) === viewingAttachment,
                      ),
                    );
                    if (knowledgeSharing) {
                      navigateImage("next", knowledgeSharing);

                      const nextAttachment = (
                        knowledgeSharing.attachments ?? []
                      ).filter((att: any) =>
                        att.fileName.match(/\.(jpeg|jpg|gif|png|webp)$/i),
                      )[currentImageIndex];
                      if (nextAttachment) {
                        setViewingAttachment(
                          buildImageUrl(nextAttachment.fileURL),
                        );
                      }
                    }
                  }}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Likes Dialog */}
        <Dialog open={likesDialogOpen} onOpenChange={setLikesDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Likes</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {currentLikes?.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No likes yet
                </p>
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
      <Card className="w-[30%] border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-secondary-dark">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-semibold dark:text-gray-300">
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <UserListSidebar
            onUserClick={(userId) => {
              setFilteredUserId(userId === filteredUserId ? null : userId);
            }}
            activeUserId={filteredUserId}
            userPostCounts={userPostCounts}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeSharingCard;