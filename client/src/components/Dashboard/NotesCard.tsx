// client\src\components\Dashboard\NotesCard.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Checklists from "./Checklists";
import {
  Note,
  useGetPublicNotesQuery,
  useGetUserNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
  useLikeNoteMutation,
  useUnlikeNoteMutation,
  useCreateNoteReplyMutation,
  useLikeNoteReplyMutation,
  useUnlikeNoteReplyMutation,
  useUpdateNoteReplyMutation,
  useDeleteNoteReplyMutation,
} from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Pencil,
  Trash,
  Lock,
  Globe,
  ThumbsUp,
  MessageSquare,
  Fullscreen,
} from "lucide-react";

import { formatDistanceToNow, isSameDay } from "date-fns";
import { toZonedTime, format } from "date-fns-tz";
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
import { UserStatus } from "@/components/UserStatus";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import RichTextEditor from "@/components/RichTextEditor";

interface NotesCardProps {
  isPublic?: boolean;
  userRole?: string;
}

const NotesCard: React.FC<NotesCardProps> = ({
  isPublic = false,
  userRole,
}) => {
  const { user } = useAuth();
  const userId = user?.userId;
  if (userRole === "INTERN" && isPublic) {
    return null; // Don't render public notes for INTERN
  }

  const [newNote, setNewNote] = useState<Partial<Note>>({
    title: "Private Note",
    content: "",
    isPublic: isPublic,
  });
  const nepalTimeZone = "Asia/Kathmandu";
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  const [replyingToNote, setReplyingToNote] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [currentLikes, setCurrentLikes] = useState<any[]>([]);
  const [showReplies, setShowReplies] = useState<Record<number, boolean>>({});

  const [creatingNote, setCreatingNote] = useState(false);
  const [updatingNote, setUpdatingNote] = useState(false);
  const [likingNoteId, setLikingNoteId] = useState<number | null>(null);
  const [likingReplyId, setLikingReplyId] = useState<number | null>(null);
  const [replyingNoteId, setReplyingNoteId] = useState<number | null>(null);
  const [replyingToReply, setReplyingToReply] = useState<{
    noteId: number;
    replyId: number;
  } | null>(null);
  const [replyToReplyContent, setReplyToReplyContent] = useState("");

  const [updateReply] = useUpdateNoteReplyMutation();
  const [deleteReply] = useDeleteNoteReplyMutation();

  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editingReplyContent, setEditingReplyContent] = useState("");

  const handleStartEditReply = (replyId: number, currentContent: string) => {
    setEditingReplyId(replyId);
    setEditingReplyContent(currentContent);
  };

  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditingReplyContent("");
  };

  const handleUpdateReply = async (replyId: number) => {
    try {
      await updateReply({ replyId, content: editingReplyContent }).unwrap();
      setEditingReplyId(null);
      setEditingReplyContent("");
      toast.success("Reply updated successfully");
    } catch (error) {
      toast.error("Failed to update reply");
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    try {
      await deleteReply(replyId).unwrap();
      toast.success("Reply deleted successfully");
    } catch (error) {
      toast.error("Failed to delete reply");
    }
  };

  const [fullScreenNote, setFullScreenNote] = useState<{
    isOpen: boolean;
    isPublic: boolean;
  }>({ isOpen: false, isPublic: false });

  const handleOpenFullScreen = (isPublicView: boolean) => {
    setFullScreenNote({ isOpen: true, isPublic: isPublicView });
  };

  const handleCloseFullScreen = () => {
    setFullScreenNote({ isOpen: false, isPublic: false });
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

  const handleDeleteClick = (id: number) => {
    setNoteToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (noteToDelete) {
      await handleDeleteNote(noteToDelete);
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  // Fetch notes based on type
  const { data: publicNotes } = useGetPublicNotesQuery();
  const { data: userNotes } = useGetUserNotesQuery(userId);
  const [createNote] = useCreateNoteMutation();
  const [updateNote] = useUpdateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();
  const [likeNote] = useLikeNoteMutation();
  const [unlikeNote] = useUnlikeNoteMutation();
  const [createReply] = useCreateNoteReplyMutation();
  const [likeReply] = useLikeNoteReplyMutation();
  const [unlikeReply] = useUnlikeNoteReplyMutation();
  const [linkUrl, setLinkUrl] = useState("");

  // Filter notes based on visibility
  const notes = isPublic
    ? publicNotes?.filter((note) => note.isPublic)
    : userNotes?.filter((note) => !note.isPublic);

  const handleCreateNote = async () => {
    if (!newNote.content) {
      toast.error("Note content is required");
      return;
    }

    if (creatingNote) return; // Prevent multiple clicks

    setCreatingNote(true);
    try {
      await createNote({
        noteData: {
          title: "Private Note",
          content: newNote.content,
          isPublic: isPublic,
          userId,
        },
        endpointType: isPublic ? "public" : "private",
      }).unwrap();

      setNewNote({ title: "Private Note", content: "", isPublic: false });
      setIsAddingNote(false);
      toast.success("Note created successfully");
    } catch (error) {
      toast.error("Failed to create note");
    } finally {
      setCreatingNote(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;
    if (updatingNote) return; // Prevent multiple clicks

    setUpdatingNote(true);
    try {
      await updateNote({
        id: editingNote.id,
        noteData: {
          title: "Private Note",
          content: editingNote.content,
          isPublic: editingNote.isPublic,
        },
      }).unwrap();
      setEditingNote(null);
      toast.success("Note updated successfully");
    } catch (error) {
      toast.error("Failed to update note");
    } finally {
      setUpdatingNote(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await deleteNote(id).unwrap();
      toast.success("Note deleted successfully");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const handleLikeNote = async (noteId: number) => {
    setLikingNoteId(noteId);
    try {
      const isLiked = notes
        ?.find((n) => n.id === noteId)
        ?.NoteLike?.some((like) => like.userId === userId);

      if (isLiked) {
        await unlikeNote({ noteId }).unwrap();
      } else {
        await likeNote({ noteId }).unwrap();
      }
    } catch (error) {
      toast.error("Failed to like/unlike note");
    } finally {
      setLikingNoteId(null);
    }
  };

  const handleLikeNoteReply = async (replyId: number) => {
    try {
      let isLiked = false;
      notes?.forEach((note) => {
        note.NoteReply?.forEach((reply) => {
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
    }
  };

  const handleReplySubmit = async (noteId: number) => {
    if (!replyContent) {
      toast.error("Reply content is required");
      return;
    }
    setReplyingNoteId(noteId);

    try {
      await createReply({ noteId, content: replyContent }).unwrap();
      setReplyContent("");
      setReplyingToNote(null);
      setShowReplies((prev) => ({ ...prev, [noteId]: true }));
      toast.success("Reply added successfully");
    } catch (error) {
      toast.error("Failed to add reply");
    } finally {
      setReplyingNoteId(null);
    }
  };

  const toggleReplies = (noteId: number) => {
    setShowReplies((prev) => ({ ...prev, [noteId]: !prev[noteId] }));
  };

  const showLikes = (likes: any[]) => {
    setCurrentLikes(likes);
    setLikesDialogOpen(true);
  };

  const handleReplyToReplySubmit = async (
    noteId: number,
    parentReplyId: number,
  ) => {
    if (!replyToReplyContent) {
      toast.error("Reply content is required");
      return;
    }

    try {
      await createReply({
        noteId,
        content: replyToReplyContent,
        parentReplyId,
      }).unwrap();
      setReplyToReplyContent("");
      setReplyingToReply(null);
      setShowReplies((prev) => ({ ...prev, [noteId]: true }));
      toast.success("Reply added successfully");
    } catch (error) {
      toast.error("Failed to add reply");
    }
  };

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  const [deleteReplyDialogOpen, setDeleteReplyDialogOpen] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState<number | null>(null);

  const handleDeleteReplyClick = (replyId: number) => {
    setReplyToDelete(replyId);
    setDeleteReplyDialogOpen(true);
  };

  const handleConfirmDeleteReply = async () => {
    if (replyToDelete) {
      try {
        await deleteReply(replyToDelete).unwrap();
        toast.success("Reply deleted successfully");
      } catch (error) {
        toast.error("Failed to delete reply");
      } finally {
        setDeleteReplyDialogOpen(false);
        setReplyToDelete(null);
      }
    }
  };

  return (
    <Tabs defaultValue={isPublic ? "note" : "checklist"} className="w-full">
      <Card className="w-full border border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-secondary dark:bg-secondary">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-start gap-2 text-2xl font-semibold dark:text-gray-300">
              {isPublic ? (
                <div className="flex w-full items-start justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <Globe className="mt-1.5 h-7 w-7 text-blue-500 dark:text-blue-400" />
                    <div>
                      <p className="text-xl font-semibold dark:text-gray-300">Public Notes</p>

                      <p className="text-base font-normal text-muted-foreground">
                        Public notes visible for all.
                      </p>
                    </div>
                  </div>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Fullscreen
                          className="h-6 w-6 cursor-pointer text-gray-600 transition-colors hover:text-blue-500 dark:text-gray-300"
                          onClick={() => handleOpenFullScreen(true)}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Full Screen</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : (
                <div className="flex w-full items-start justify-between">
                  {/* Private Notes Icon and Title */}
                  <div className="flex items-start justify-between gap-2">
                    <Lock className="mt-1.5 h-7 w-7 text-purple-500 dark:text-purple-400" />
                    <div>
                      <p className="text-xl font-semibold dark:text-gray-300">Private Notes</p>

                      <p className="text-base font-normal text-muted-foreground">
                        Your personal notes for reminders.
                      </p>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Fullscreen
                          className="h-6 w-6 cursor-pointer text-gray-600 transition-colors hover:text-purple-500 dark:text-gray-300"
                          onClick={() => handleOpenFullScreen(false)}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Full Screen</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </CardTitle>
            {isPublic && user?.picture && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.picture} />
                <AvatarFallback>
                  {user?.firstname?.charAt(0)}
                  {user?.lastname?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardHeader>

        {!isPublic && (
          <TabsList className="flex w-full items-center justify-start gap-4 rounded-none border-b bg-transparent px-6">
            <TabsTrigger
              value="checklist"
              className="rounded-none border-b-2 border-transparent  data-[state=active]:border-primary dark:bg-secondary"
            >
              Checklists
            </TabsTrigger>
            <TabsTrigger
              value="note"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary dark:bg-secondary"
            >
              Notes
            </TabsTrigger>
          </TabsList>
        )}
        <CardContent className="p-0">
          <TabsContent value="note">
            {/* Notes List */}
            <div
              className="custom-scrollbar divide-y divide-gray-200 dark:divide-gray-600"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {notes?.length === 0 && (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No {isPublic ? "public" : "private"} notes yet
                  </p>
                </div>
              )}
              {notes?.map((note) => (
                <div
                  key={note.id}
                  className="group relative p-4 transition-colors hover:bg-gray-50 dark:hover:bg-secondary"
                >
                  {editingNote?.id === note.id ? (
                    <div className="space-y-4">
                      <RichTextEditor
                        content={editingNote.content}
                        onContentChange={(content) =>
                          setEditingNote({ ...editingNote, content })
                        }
                        placeholder="Edit your note..."
                        className="min-h-[200px] dark:bg-secondary"
                      />
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleUpdateNote}>
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingNote(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex-col items-start gap-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {isPublic && note.user && (
                              <Avatar className="relative mb-3 h-12 w-12 cursor-pointer">
                                {note.user.profilePictureUrl ? (
                                  <AvatarImage
                                    src={buildImageUrl(
                                      note.user.profilePictureUrl,
                                    )}
                                    alt={`${note.user.firstname} ${note.user.lastname}`}
                                  />
                                ) : (
                                  <AvatarFallback className="text-xl">
                                    {note.user.firstname?.charAt(0)}
                                    {note.user.lastname?.charAt(0)}
                                  </AvatarFallback>
                                )}
                                <UserStatus
                                  lastSeenAt={note.user.lastSeenAt}
                                  className="absolute -bottom-0 -right-0"
                                  showOnlyDot
                                />
                              </Avatar>
                            )}
                            <div>
                              {isPublic && note.user && (
                                <span className="text-base text-gray-600 dark:text-gray-300">
                                  {note.user.username ||
                                    `${note.user.firstname} ${note.user.lastname}`}
                                </span>
                              )}
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(note.createdAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              {" "}
                              {format(
                                new Date(note.createdAt),
                                "MMMM d, h:mm a",
                                {
                                  timeZone: nepalTimeZone,
                                },
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="overflow-hidden whitespace-pre-wrap break-words text-base text-gray-700 dark:text-gray-300">
                            {renderContentWithLinks(note.content)}
                          </div>
                        </div>
                      </div>

                      {/* Like and Reply Actions - Only for public notes */}
                      {isPublic && (
                        <div className="mt-2 flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 p-0 text-muted-foreground hover:text-primary"
                              onClick={() => handleLikeNote(note.id)}
                              disabled={likingNoteId === note.id}
                            >
                              {likingNoteId === note.id ? (
                                <div className="relative h-4 w-4">
                                  <ThumbsUp className="absolute h-4 w-4 animate-[spin_1s_linear_infinite] fill-blue-500 text-blue-500 opacity-70" />
                                  <ThumbsUp className="absolute h-4 w-4 scale-150 animate-[pulse_1.5s_ease-in-out_infinite] opacity-40" />
                                </div>
                              ) : (
                                <ThumbsUp
                                  className={`h-4 w-4 ${
                                    note.NoteLike?.some(
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
                              onClick={() => showLikes(note.NoteLike || [])}
                            >
                              {note.NoteLike?.length || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 p-0 text-muted-foreground hover:text-primary"
                              onClick={() => {
                                setReplyingToNote(note.id);
                                setShowReplies((prev) => ({
                                  ...prev,
                                  [note.id]: true,
                                }));
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <span
                              className="cursor-pointer text-xs text-muted-foreground hover:underline"
                              onClick={() => toggleReplies(note.id)}
                            >
                              {note.NoteReply?.length} replies
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Reply Form - Only for public notes */}
                      {isPublic && replyingToNote === note.id && (
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
                              onClick={() => setReplyingToNote(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleReplySubmit(note.id)}
                              disabled={replyingNoteId === note.id}
                            >
                              {replyingNoteId === note.id ? (
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

                      {/* Replies Section - Only for public notes */}
                      {isPublic &&
                        showReplies[note.id] &&
                        note.NoteReply?.length > 0 && (
                          <div className="ml-12 mt-3 space-y-3 border-l-2 border-gray-200 pl-3 dark:border-gray-600">
                            {note.NoteReply.map((reply) => (
                              <div key={reply.id} className="group relative">
                                {/* Pointer line from note to reply */}
                                <div className="absolute -left-3 top-5 h-[1px] w-3 bg-gray-300 dark:bg-gray-500"></div>

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
                                    {editingReplyId === reply.id ? (
                                      <div className="space-y-2">
                                        <Textarea
                                          value={editingReplyContent}
                                          onChange={(e) =>
                                            setEditingReplyContent(
                                              e.target.value,
                                            )
                                          }
                                          rows={3}
                                          className="w-full"
                                        />
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              handleUpdateReply(reply.id)
                                            }
                                          >
                                            Save
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelEditReply}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
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
                                        <p className="mt-1 text-sm">
                                          {reply.content}
                                        </p>
                                      </div>
                                    )}
                                    <div className="mt-1 flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 p-0 text-xs text-muted-foreground hover:text-primary"
                                        onClick={() =>
                                          handleLikeNoteReply(reply.id)
                                        }
                                      >
                                        <ThumbsUp
                                          className={`mr-1 h-3 w-3 ${
                                            reply.likes.some(
                                              (like) => like.userId === userId,
                                            )
                                              ? "fill-current text-blue-400"
                                              : ""
                                          }`}
                                        />
                                        Like
                                      </Button>
                                      <span
                                        className="cursor-pointer text-xs text-muted-foreground hover:underline"
                                        onClick={() => showLikes(reply.likes)}
                                      >
                                        {reply.likes?.length} likes
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 p-0 text-xs text-muted-foreground hover:text-primary"
                                        onClick={() =>
                                          setReplyingToReply({
                                            noteId: note.id,
                                            replyId: reply.id,
                                          })
                                        }
                                      >
                                        <MessageSquare className="mr-1 h-3 w-3" />
                                        Reply
                                      </Button>
                                    </div>

                                    {/* Reply to reply form */}
                                    {replyingToReply?.replyId === reply.id && (
                                      <div className="relative ml-4 mt-2">
                                        {/* Pointer line from reply to reply-to-reply form */}
                                        <div className="absolute -left-4 top-5 h-[1px] w-4 bg-gray-300 dark:bg-gray-500"></div>

                                        <Textarea
                                          value={replyToReplyContent}
                                          onChange={(e) =>
                                            setReplyToReplyContent(
                                              e.target.value,
                                            )
                                          }
                                          placeholder="Write a reply..."
                                          rows={2}
                                          className="mb-2 w-full resize-none rounded-lg border border-gray-200 p-2 text-sm dark:border-gray-600"
                                        />
                                        <div className="flex justify-end gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setReplyingToReply(null)
                                            }
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              handleReplyToReplySubmit(
                                                note.id,
                                                reply.id,
                                              )
                                            }
                                          >
                                            Reply
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Nested replies */}
                                    {reply.replies &&
                                      reply.replies.length > 0 && (
                                        <div className="ml-4 mt-2 space-y-2 border-l-2 border-gray-200 pl-3 dark:border-gray-600">
                                          {reply.replies.map((nestedReply) => (
                                            <div
                                              key={nestedReply.id}
                                              className="group relative"
                                            >
                                              <div className="absolute -left-4 top-5 h-[1px] w-4 bg-gray-300 dark:bg-gray-500"></div>
                                              <div className="flex items-start gap-2">
                                                {nestedReply.user && (
                                                  <Avatar className="h-8 w-8">
                                                    {nestedReply.user
                                                      .profilePictureUrl ? (
                                                      <AvatarImage
                                                        src={buildImageUrl(
                                                          nestedReply.user
                                                            .profilePictureUrl,
                                                        )}
                                                        alt={`${nestedReply.user.firstname} ${nestedReply.user.lastname}`}
                                                      />
                                                    ) : (
                                                      <AvatarFallback>
                                                        {nestedReply.user.firstname?.charAt(
                                                          0,
                                                        )}
                                                        {nestedReply.user.lastname?.charAt(
                                                          0,
                                                        )}
                                                      </AvatarFallback>
                                                    )}
                                                  </Avatar>
                                                )}
                                                <div className="flex-1">
                                                  {editingReplyId ===
                                                  nestedReply.id ? (
                                                    <div className="space-y-2">
                                                      <Textarea
                                                        value={
                                                          editingReplyContent
                                                        }
                                                        onChange={(e) =>
                                                          setEditingReplyContent(
                                                            e.target.value,
                                                          )
                                                        }
                                                        rows={3}
                                                        className="w-full"
                                                      />
                                                      <div className="flex gap-2">
                                                        <Button
                                                          size="sm"
                                                          onClick={() =>
                                                            handleUpdateReply(
                                                              nestedReply.id,
                                                            )
                                                          }
                                                        >
                                                          Save
                                                        </Button>
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={
                                                            handleCancelEditReply
                                                          }
                                                        >
                                                          Cancel
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                                                      <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                          {nestedReply.user
                                                            ?.username ||
                                                            `${nestedReply.user?.firstname} ${nestedReply.user?.lastname}`}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                          {formatDistanceToNow(
                                                            new Date(
                                                              nestedReply.createdAt,
                                                            ),
                                                            {
                                                              addSuffix: true,
                                                            },
                                                          )}
                                                        </span>
                                                      </div>
                                                      <p className="mt-1 text-sm">
                                                        {nestedReply.content}
                                                      </p>
                                                    </div>
                                                  )}
                                                  <div className="mt-1 flex items-center gap-2">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      className="h-6 p-0 text-xs text-muted-foreground hover:text-primary"
                                                      onClick={() =>
                                                        handleLikeNoteReply(
                                                          nestedReply.id,
                                                        )
                                                      }
                                                    >
                                                      <ThumbsUp
                                                        className={`mr-1 h-3 w-3 ${
                                                          nestedReply.likes.some(
                                                            (like) =>
                                                              like.userId ===
                                                              userId,
                                                          )
                                                            ? "fill-current text-blue-400"
                                                            : ""
                                                        }`}
                                                      />
                                                      Like
                                                    </Button>
                                                    <span
                                                      className="cursor-pointer text-xs text-muted-foreground hover:underline"
                                                      onClick={() =>
                                                        showLikes(
                                                          nestedReply.likes,
                                                        )
                                                      }
                                                    >
                                                      {
                                                        nestedReply.likes
                                                          ?.length
                                                      }{" "}
                                                      likes
                                                    </span>
                                                  </div>
                                                </div>
                                                {nestedReply.userId ===
                                                  userId && (
                                                  <div className="absolute right-2 top-2 z-10 flex space-x-1 rounded-lg border border-gray-200 bg-white/90 p-1 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-900/90">
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() => {
                                                        setEditingReplyId(
                                                          nestedReply.id,
                                                        );
                                                        setEditingReplyContent(
                                                          nestedReply.content,
                                                        );
                                                      }}
                                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                                    >
                                                      <Pencil className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                      variant="ghost"
                                                      size="sm"
                                                      onClick={() =>
                                                        handleDeleteReplyClick(
                                                          nestedReply.id,
                                                        )
                                                      }
                                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:text-red-500"
                                                    >
                                                      <Trash className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                  </div>
                                  {reply.userId === userId && (
                                    <div className="absolute right-2 top-2 z-10 flex space-x-1 rounded-lg border border-gray-200 bg-white/90 p-1 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-900/90">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingReplyId(reply.id);
                                          setEditingReplyContent(reply.content);
                                        }}
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteReplyClick(reply.id)
                                        }
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:text-red-500"
                                      >
                                        <Trash className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      {note.userId === userId && (
                        <div className="absolute right-2 top-2 z-10 flex space-x-1 rounded-lg border border-gray-200 bg-white/90 p-1 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 dark:border-gray-700 dark:bg-gray-900/90">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingNote(note)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(note.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:text-red-500"
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
            {/* Add Note Section */}
            {(!isPublic || (isPublic && userId)) && (
              <div className="border-t p-4">
                {isAddingNote ? (
                  <div className="space-y-4">
                    <RichTextEditor
                      content={newNote.content || ""}
                      onContentChange={(content) =>
                        setNewNote({ ...newNote, content })
                      }
                      placeholder="Write your note..."
                      className="min-h-[200px]"
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={handleCreateNote}
                        disabled={creatingNote}
                      >
                        {creatingNote ? "Adding..." : "Add Note"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsAddingNote(false);
                          setNewNote({
                            title: "Private Note",
                            content: "",
                            isPublic: isPublic,
                          });
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
                    onClick={() => setIsAddingNote(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Note
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          {!isPublic && (
            <TabsContent value="checklist">
              <Checklists isPublic={isPublic} />
            </TabsContent>
          )}
        </CardContent>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                note.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No, keep it</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Yes Delete it!
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

        {/* Full Screen Dialog */}
        <Dialog
          open={fullScreenNote.isOpen}
          onOpenChange={handleCloseFullScreen}
        >
          <DialogContent className="h-full max-h-[90vh] w-full max-w-[90vw] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {fullScreenNote.isPublic ? (
                  <>
                    <Globe className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    Public Notes - Full View
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                    Private Notes - Full View
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {fullScreenNote.isPublic
                ? publicNotes
                    ?.filter((note) => note.isPublic)
                    .map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                      >
                        {note.user && (
                          <div className="mb-3 flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              {note.user.profilePictureUrl ? (
                                <AvatarImage
                                  src={buildImageUrl(
                                    note.user.profilePictureUrl,
                                  )}
                                />
                              ) : (
                                <AvatarFallback>
                                  {note.user.firstname?.charAt(0)}
                                  {note.user.lastname?.charAt(0)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {note.user.username ||
                                  `${note.user.firstname} ${note.user.lastname}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(
                                  new Date(note.createdAt),
                                  "MMMM d, yyyy 'at' h:mm a",
                                  {
                                    timeZone: nepalTimeZone,
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="mb-4 whitespace-pre-wrap break-words text-lg">
                          {renderContentWithLinks(note.content)}
                        </div>

                        {/* Like and Reply Actions */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 p-0 text-muted-foreground hover:text-primary"
                              onClick={() => handleLikeNote(note.id)}
                              disabled={likingNoteId === note.id}
                            >
                              {likingNoteId === note.id ? (
                                <div className="relative h-4 w-4">
                                  <ThumbsUp className="absolute h-4 w-4 animate-[spin_1s_linear_infinite] fill-blue-500 text-blue-500 opacity-70" />
                                  <ThumbsUp className="absolute h-4 w-4 scale-150 animate-[pulse_1.5s_ease-in-out_infinite] opacity-40" />
                                </div>
                              ) : (
                                <ThumbsUp
                                  className={`h-4 w-4 ${
                                    note.NoteLike?.some(
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
                              onClick={() => showLikes(note.NoteLike || [])}
                            >
                              {note.NoteLike?.length || 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 p-0 text-muted-foreground hover:text-primary"
                              onClick={() => {
                                setReplyingToNote(note.id);
                                setShowReplies((prev) => ({
                                  ...prev,
                                  [note.id]: true,
                                }));
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <span
                              className="cursor-pointer text-xs text-muted-foreground hover:underline"
                              onClick={() => toggleReplies(note.id)}
                            >
                              {note.NoteReply?.length} replies
                            </span>
                          </div>
                        </div>

                        {/* Reply Form */}
                        {replyingToNote === note.id && (
                          <div className="mt-3">
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
                                onClick={() => setReplyingToNote(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleReplySubmit(note.id)}
                                disabled={replyingNoteId === note.id}
                              >
                                {replyingNoteId === note.id ? (
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
                        {showReplies[note.id] && note.NoteReply?.length > 0 && (
                          <div className="mt-3 space-y-3 border-l-2 border-gray-200 pl-3 dark:border-gray-600">
                            {note.NoteReply.map((reply) => (
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
                                      <p className="mt-1 text-sm">
                                        {reply.content}
                                      </p>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 p-0 text-xs text-muted-foreground hover:text-primary"
                                        onClick={() =>
                                          handleLikeNoteReply(reply.id)
                                        }
                                      >
                                        <ThumbsUp
                                          className={`mr-1 h-3 w-3 ${
                                            reply.likes.some(
                                              (like) => like.userId === userId,
                                            )
                                              ? "fill-current text-blue-400"
                                              : ""
                                          }`}
                                        />
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
                      </div>
                    ))
                : userNotes
                    ?.filter((note) => !note.isPublic)
                    .map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                      >
                        <p className="mb-2 text-sm text-muted-foreground">
                          {format(
                            new Date(note.createdAt),
                            "MMMM d, yyyy 'at' h:mm a",
                            {
                              timeZone: nepalTimeZone,
                            },
                          )}
                        </p>
                        <div className="whitespace-pre-wrap break-words text-lg">
                          {renderContentWithLinks(note.content)}
                        </div>
                      </div>
                    ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Reply Confirmation Dialog */}
        <AlertDialog
          open={deleteReplyDialogOpen}
          onOpenChange={setDeleteReplyDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                reply.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDeleteReply}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </Tabs>
  );
};

export default NotesCard;
