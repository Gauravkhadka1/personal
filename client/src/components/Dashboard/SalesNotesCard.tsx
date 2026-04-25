"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetSalesNotesQuery,
  useCreateSalesNoteMutation,
  useUpdateSalesNoteMutation,
  useDeleteSalesNoteMutation,
  useLikeSalesNoteMutation,
  useUnlikeSalesNoteMutation,
  useCreateSalesNoteReplyMutation,
  useLikeSalesNoteReplyMutation,
  useUnlikeSalesNoteReplyMutation,
} from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import { SalesNote } from "@/state/api";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Pencil,
  Trash,
  DollarSign,
  ThumbsUp,
  MessageSquare,
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
import { formatDistanceToNow, isSameDay } from "date-fns";
import { toZonedTime, format } from "date-fns-tz";
import { UserStatus } from "@/components/UserStatus";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";

const SalesNotesCard = () => {
  const { user } = useAuth();
  const userId = user?.userId;
  const [newNote, setNewNote] = useState<Partial<SalesNote>>({
    title: "Sales Note",
    content: "",
  });
  const nepalTimeZone = "Asia/Kathmandu";

  const [editingNote, setEditingNote] = useState<SalesNote | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  const [replyingToNote, setReplyingToNote] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [currentLikes, setCurrentLikes] = useState<any[]>([]);
  const [showReplies, setShowReplies] = useState<Record<number, boolean>>({});
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const [creatingNote, setCreatingNote] = useState(false);
  const [updatingNote, setUpdatingNote] = useState(false);
  const [likingNoteId, setLikingNoteId] = useState<number | null>(null);
  const [likingReplyId, setLikingReplyId] = useState<number | null>(null);
  const [replyingNoteId, setReplyingNoteId] = useState<number | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "bullet-list",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "ordered-list",
          },
        },
        listItem: {
          HTMLAttributes: {
            class: "list-item",
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 hover:underline",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (isAddingNote) {
        setNewNote({ ...newNote, content: html });
      } else if (editingNote) {
        setEditingNote({ ...editingNote, content: html });
      }
    },
  });

  const renderEditorToolbar = () => {
    if (!editor) return null;
    
    return (
      <div className="toolbar border-b border-gray-300 p-2 dark:border-gray-600">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`mx-1 rounded p-1 ${
            editor.isActive("bold") ? "bg-gray-200 dark:bg-gray-700" : ""
          }`}
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`mx-1 rounded p-1 ${
            editor.isActive("italic") ? "bg-gray-200 dark:bg-gray-700" : ""
          }`}
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`mx-1 rounded p-1 ${
            editor.isActive("bulletList")
              ? "bg-gray-200 dark:bg-gray-700"
              : ""
          }`}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`mx-1 rounded p-1 ${
            editor.isActive("orderedList")
              ? "bg-gray-200 dark:bg-gray-700"
              : ""
          }`}
          title="Numbered List"
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href;
            setLinkUrl(previousUrl || "https://");
            setLinkDialogOpen(true);
          }}
          className={`mx-1 rounded p-1 ${
            editor.isActive("link") ? "bg-gray-200 dark:bg-gray-700" : ""
          }`}
          title="Link"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
          className={`mx-1 rounded p-1 ${
            !editor.isActive("link") ? "cursor-not-allowed opacity-50" : ""
          }`}
          title="Remove Link"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            <line x1="4" y1="20" x2="20" y2="4" />
          </svg>
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    if (editingNote && currentContent !== editingNote.content) {
      editor.commands.setContent(editingNote.content);
    } else if (isAddingNote && currentContent !== newNote.content) {
      editor.commands.setContent(newNote.content || '');
    }
  }, [editingNote?.id, isAddingNote]);

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

  const { data: salesNotes = [], refetch } = useGetSalesNotesQuery();
  const [createSalesNote] = useCreateSalesNoteMutation();
  const [updateSalesNote] = useUpdateSalesNoteMutation();
  const [deleteSalesNote] = useDeleteSalesNoteMutation();
  const [likeSalesNote] = useLikeSalesNoteMutation();
  const [unlikeSalesNote] = useUnlikeSalesNoteMutation();
  const [createSalesNoteReply] = useCreateSalesNoteReplyMutation();
  const [likeSalesNoteReply] = useLikeSalesNoteReplyMutation();
  const [unlikeSalesNoteReply] = useUnlikeSalesNoteReplyMutation();

  const handleCreateNote = async () => {
    if (!newNote.content) {
      toast.error("Note content is required");
      return;
    }

    setCreatingNote(true);
    try {
      await createSalesNote({
        title: "Sales Note",
        content: newNote.content,
        userId,
      }).unwrap();

      setNewNote({ title: "Sales Note", content: "" });
      setIsAddingNote(false);
      if (editor) editor.commands.clearContent();
      toast.success("Sales note created successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to create sales note");
    } finally {
      setCreatingNote(false);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    setUpdatingNote(true);
    try {
      await updateSalesNote({
        id: editingNote.id,
        noteData: {
          title: "Sales Note",
          content: editingNote.content,
        },
      }).unwrap();
      setEditingNote(null);
      if (editor) editor.commands.clearContent();
      toast.success("Sales note updated successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to update sales note");
    } finally {
      setUpdatingNote(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await deleteSalesNote(id).unwrap();
      toast.success("Sales note deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete sales note");
    }
  };

  const handleLikeNote = async (noteId: number) => {
    setLikingNoteId(noteId);
    try {
      const isLiked = salesNotes
        ?.find((n) => n.id === noteId)
        ?.SalesNoteLike?.some((like) => like.userId === userId);

      if (isLiked) {
        await unlikeSalesNote({ noteId }).unwrap();
      } else {
        await likeSalesNote({ noteId }).unwrap();
      }
      refetch();
    } catch (error) {
      toast.error("Failed to like/unlike note");
    } finally {
      setLikingNoteId(null);
    }
  };

  const handleLikeNoteReply = async (replyId: number) => {
    setLikingReplyId(replyId);
    try {
      let isLiked = false;
      salesNotes?.forEach((note) => {
        note.SalesNoteReply?.forEach((reply) => {
          if (
            reply.id === replyId &&
            reply.likes?.some((like) => like.userId === userId)
          ) {
            isLiked = true;
          }
        });
      });

      if (isLiked) {
        await unlikeSalesNoteReply({ replyId }).unwrap();
      } else {
        await likeSalesNoteReply({ replyId }).unwrap();
      }
      refetch();
    } catch (error) {
      toast.error("Failed to like/unlike reply");
    } finally {
      setLikingReplyId(null);
    }
  };

  const handleReplySubmit = async (noteId: number) => {
    if (!replyContent) {
      toast.error("Reply content is required");
      return;
    }

    setReplyingNoteId(noteId);
    try {
      await createSalesNoteReply({ noteId, content: replyContent }).unwrap();
      setReplyContent("");
      setReplyingToNote(null);
      setShowReplies((prev) => ({ ...prev, [noteId]: true }));
      toast.success("Reply added successfully");
      refetch();
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-start gap-2 text-xl font-semibold dark:text-gray-300">
            <DollarSign className="h-5 w-5 mt-1.5 text-green-500 dark:text-green-400" />
            <div>
              <p className="text-2xl font-semibold">Sales Notes</p>

              <p className="text-base font-normal text-muted-foreground">
                Notes for sales team only.
              </p>
            </div>
          </CardTitle>
          {user?.picture && (
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
      <CardContent className="p-0">
        {/* Notes List */}
        <div
          className="custom-scrollbar divide-y divide-gray-200 dark:divide-gray-600"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {salesNotes?.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-base text-muted-foreground">
                No sales notes yet
              </p>
            </div>
          )}
          {salesNotes?.map((note) => (
            <div
              key={note.id}
              className="group relative p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {editingNote?.id === note.id ? (
                <div className="space-y-4">
                  {editor && (
                    <>
                      {renderEditorToolbar()}
                      <EditorContent
                        editor={editor}
                        className="prose dark:prose-invert min-h-[200px] max-w-none rounded-b-md border border-t-0 border-gray-300 p-3 text-gray-900 dark:border-gray-600 dark:text-gray-300"
                      />
                    </>
                  )}
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
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {note.user && (
                        <Avatar className="relative mb-3 h-12 w-12 cursor-pointer">
                          {note.user.profilePictureUrl ? (
                            <AvatarImage
                              src={buildImageUrl(note.user.profilePictureUrl)}
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
                      <div className="flex-col items-center justify-between">
                        {note.user && (
                          <span className="text-base text-muted-foreground">
                            {note.user.username}
                          </span>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(note.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        {" "}
                        {format(new Date(note.createdAt), "MMMM d, h:mm a", {
                          timeZone: nepalTimeZone,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="overflow-hidden whitespace-pre-wrap break-words text-base text-gray-700 dark:text-gray-300">
                    {renderContentWithLinks(note.content)}
                  </div>

                  {/* Like and Reply Actions */}
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
                              note.SalesNoteLike?.some(
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
                        onClick={() => showLikes(note.SalesNoteLike || [])}
                      >
                        {note.SalesNoteLike?.length || 0}
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
                        {note.SalesNoteReply?.length} replies
                      </span>
                    </div>
                  </div>

                  {/* Reply Form */}
                  {replyingToNote === note.id && (
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

                  {/* Replies Section */}
                  {showReplies[note.id] && note.SalesNoteReply?.length > 0 && (
                    <div className="ml-12 mt-3 space-y-3 border-l-2 border-gray-200 pl-3 dark:border-gray-600">
                      {note.SalesNoteReply.map((reply) => (
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
                                  onClick={() => handleLikeNoteReply(reply.id)}
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
        {userId && (
          <div className="border-t p-4">
            {isAddingNote ? (
              <div className="space-y-4">
                {editor && (
                  <>
                    {renderEditorToolbar()}
                    <EditorContent
                      editor={editor}
                      className="prose dark:prose-invert min-h-[200px] max-w-none rounded-b-md border border-t-0 border-gray-300 p-3 text-gray-900 dark:border-gray-600 dark:text-gray-300"
                    />
                  </>
                )}
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
                        title: "Sales Note",
                        content: "",
                      });
                      editor?.commands.clearContent();
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
                Add Sales Note
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              sales note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}    className="bg-red-600 hover:bg-red-700">
              Yes, Delete it!
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

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setLinkDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editor) return;
                  
                  if (linkUrl === "") {
                    editor
                      .chain()
                      .focus()
                      .extendMarkRange("link")
                      .unsetLink()
                      .run();
                  } else {
                    editor
                      .chain()
                      .focus()
                      .extendMarkRange("link")
                      .setLink({ href: linkUrl })
                      .run();
                  }
                  setLinkDialogOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SalesNotesCard;