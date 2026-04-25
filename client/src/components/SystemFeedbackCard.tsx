import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetSystemFeedbacksQuery,
  useCreateSystemFeedbackMutation,
  useUpdateSystemFeedbackMutation,
  useDeleteSystemFeedbackMutation,
  useDeleteFeedbackAttachmentMutation,
  useUpdateSystemFeedbackStatusMutation, // Add this import
} from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, Trash, Paperclip, X, ChevronDown } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import RichTextEditor from "@/components/RichTextEditor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SystemFeedbackCardProps {
  selectedUserId?: number | null;
}

const SystemFeedbackCard: React.FC<SystemFeedbackCardProps> = ({ selectedUserId }) => {
  const { user } = useAuth();
  const userId = user?.userId;
  const userEmail = user?.email;
  const [newFeedback, setNewFeedback] = useState("");
  const [editingFeedback, setEditingFeedback] = useState<any>(null);
  const [isAddingFeedback, setIsAddingFeedback] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  const { data: feedbacksData, refetch } = useGetSystemFeedbacksQuery(selectedUserId || undefined);
  const [createFeedback] = useCreateSystemFeedbackMutation();
  const [updateFeedback] = useUpdateSystemFeedbackMutation();
  const [updateFeedbackStatus] = useUpdateSystemFeedbackStatusMutation(); // Add this
  const [deleteFeedback] = useDeleteSystemFeedbackMutation();
  const [deleteAttachment] = useDeleteFeedbackAttachmentMutation();

  const feedbacks = feedbacksData?.feedbacks || [];

  // Check if current user can update status ( gaurav@webtech.com.np)
  const canUpdateStatus =  userEmail === 'gaurav@webtech.com.np';

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

  const handleCreateFeedback = async () => {
    if (!newFeedback) {
      toast.error("Feedback content is required");
      return;
    }

    try {
      await createFeedback({ content: newFeedback, attachments }).unwrap();
      setNewFeedback("");
      setAttachments([]);
      setAttachmentPreviews([]);
      setIsAddingFeedback(false);
      toast.success("Feedback submitted successfully");
    } catch (error) {
      toast.error("Failed to submit feedback");
    }
  };

  const handleUpdateFeedback = async () => {
    if (!editingFeedback) return;

    try {
      await updateFeedback({
        id: editingFeedback.id,
        content: editingFeedback.content,
      }).unwrap();
      setEditingFeedback(null);
      toast.success("Feedback updated successfully");
    } catch (error) {
      toast.error("Failed to update feedback");
    }
  };

  const handleUpdateStatus = async (feedbackId: number, newStatus: string) => {
    try {
      await updateFeedbackStatus({
        id: feedbackId,
        status: newStatus as any,
      }).unwrap();
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteFeedback = async (id: number) => {
    try {
      await deleteFeedback(id).unwrap();
      toast.success("Feedback deleted successfully");
    } catch (error) {
      toast.error("Failed to delete feedback");
    }
  };

  const handleDeleteAttachment = async (
    feedbackId: number,
    attachmentId: number,
  ) => {
    try {
      await deleteAttachment({ feedbackId, attachmentId }).unwrap();
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

  const getStatusColor = (status: string) => {
    const statusColors = {
      New: "bg-gray-500 dark:bg-gray-600",
      Acknowledged: "bg-cyan-500 dark:bg-cyan-600",
      InProgress: "bg-blue-500 dark:bg-blue-600",
      Resolved: "bg-green-500 dark:bg-green-600",
    };
    return statusColors[status as keyof typeof statusColors] || "bg-slate-500 dark:bg-slate-600";
  };

  return (
    <Card className="w-full border border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-secondary-dark">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold dark:text-gray-300">
          System Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className="custom-scrollbar divide-y divide-gray-200 dark:divide-gray-600"
          style={{ maxHeight: "600px", overflowY: "auto" }}
        >
          {!feedbacksData ? (
            // Loading state with skeletons
            <div className="space-y-4 p-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-3 p-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-6 w-20" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No feedback yet</p>
            </div>
          ) : (
            feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="group relative p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {editingFeedback?.id === feedback.id ? (
                  <div className="space-y-4">
                    <RichTextEditor
                      content={editingFeedback.content}
                      onContentChange={(content) =>
                        setEditingFeedback({ ...editingFeedback, content })
                      }
                      placeholder="Edit your feedback..."
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={handleUpdateFeedback}>
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingFeedback(null)}
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
                        {feedback.user && (
                          <Avatar className="relative mb-3 h-12 w-12 cursor-pointer">
                            {feedback.user.profilePictureUrl ? (
                              <AvatarImage
                                src={buildImageUrl(
                                  feedback.user.profilePictureUrl,
                                )}
                                alt={`${feedback.user.firstname} ${feedback.user.lastname}`}
                              />
                            ) : (
                              <AvatarFallback className="text-xl">
                                {feedback.user.firstname?.charAt(0)}
                                {feedback.user.lastname?.charAt(0)}
                              </AvatarFallback>
                            )}
                            <UserStatus
                              lastSeenAt={feedback.user.lastSeenAt}
                              className="absolute -bottom-0 -right-0"
                              showOnlyDot
                            />
                          </Avatar>
                        )}
                        <div>
                          {feedback.user && (
                            <span className="text-sm text-muted-foreground">
                              {feedback.user.username ||
                                `${feedback.user.firstname} ${feedback.user.lastname}`}
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(feedback.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canUpdateStatus ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                className={`h-7 px-2 text-xs text-white ${getStatusColor(feedback.status)} border-none`}
                              >
                                {feedback.status}
                                <ChevronDown className="ml-1 h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(feedback.id, "New")}
                              >
                                New
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(feedback.id, "Acknowledged")}
                              >
                                Acknowledged
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(feedback.id, "InProgress")}
                              >
                                In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(feedback.id, "Resolved")}
                              >
                                Resolved
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-1 text-sm text-white ${getStatusColor(feedback.status)}`}
                          >
                            {feedback.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="overflow-hidden whitespace-pre-wrap break-words text-base text-gray-600 dark:text-gray-300">
                      {renderContentWithLinks(feedback.content)}
                    </div>

                    {/* Attachments */}
                    {feedback.attachments && feedback.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {feedback.attachments.map((attachment) => (
                          <div key={attachment.id} className="relative">
                            <div
                              className="flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-muted-foreground hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                              onClick={() => {
                                if (attachment.fileURL.startsWith("blob:"))
                                  return;
                                const url = buildImageUrl(attachment.fileURL);
                                if (
                                  attachment.fileName.match(
                                    /\.(jpeg|jpg|gif|png|webp)$/,
                                  )
                                ) {
                                  setViewingAttachment(url);
                                } else {
                                  window.open(url, "_blank");
                                }
                              }}
                            >
                              <Paperclip className="h-3 w-3" />
                              <span className="max-w-[120px] truncate">
                                {attachment.fileName}
                              </span>
                            </div>
                            {feedback.userId === userId && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-destructive/80 p-0 text-white hover:bg-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAttachment(
                                    feedback.id,
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

                    {(feedback.userId === userId || canUpdateStatus) && (
                      <div className="absolute right-2 top-2 z-10 flex space-x-1 rounded-lg border border-gray-200 bg-white/90 p-1 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-900/90">
                        {feedback.userId === userId && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingFeedback(feedback)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFeedbackToDelete(feedback.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Feedback Section */}
        <div className="border-t p-4">
          {isAddingFeedback ? (
            <div className="space-y-4">
              <RichTextEditor
                content={newFeedback}
                onContentChange={setNewFeedback}
                placeholder="Write your feedback..."
                withAttachments={true}
                attachments={attachments}
                onAttachmentsChange={setAttachments}
                attachmentPreviews={attachmentPreviews}
                onRemoveAttachment={removeAttachment}
              />

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingFeedback(false);
                    setNewFeedback("");
                    setAttachments([]);
                    setAttachmentPreviews([]);
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreateFeedback}>
                  Submit Feedback
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setIsAddingFeedback(true)}
              data-feedback-trigger
            >
              <Plus className="mr-2 h-4 w-4" />
              Add System Feedback
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
              feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (feedbackToDelete) {
                  handleDeleteFeedback(feedbackToDelete);
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
            <img
              src={viewingAttachment}
              alt="Attachment"
              className="max-h-[80vh] w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SystemFeedbackCard;