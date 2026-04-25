"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useGetProspectFollowupNoteQuery,
  useAddProspectFollowupNoteMutation,
  // useLikeProjectCommentMutation,
  // useAddProjectCommentReplyMutation,
  // useLikeProjectCommentReplyMutation,
  useUpdateProspectFollowupNoteMutation,
  useDeleteProspectFollowupNoteMutation,
} from "@/state/api";
import { MessageSquare, Heart, Reply, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, isSameDay, subDays } from "date-fns";
import { toZonedTime, format } from "date-fns-tz";
import toast from "react-hot-toast";
import { Edit, Trash } from "lucide-react";

interface ProspectFollowupNotePopupProps {
  prospectId: number;
  userId: number;
  onClose: () => void;
}

const ProspectFollowupNotePopup: React.FC<ProspectFollowupNotePopupProps> = ({
  prospectId,
  userId,
  onClose,
}) => {
  const { user: authUser } = useAuth();
  const [newProspectFollowupNote, setNewProspectFollowupNote] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: number;
    type: "comment" | "reply";
  } | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: prospectFollowupNote, isLoading } = useGetProspectFollowupNoteQuery(prospectId);
  const [addProspectFollowupNote] = useAddProspectFollowupNoteMutation();
  // const [likeComment] = useLikeProjectCommentMutation();
  // const [addReply] = useAddProjectCommentReplyMutation();
  // const [likeReply] = useLikeProjectCommentReplyMutation();

  const [updateProspectFollowupNote] = useUpdateProspectFollowupNoteMutation();
  const [deleteProspectFollowupNote] = useDeleteProspectFollowupNoteMutation();

  const [isSubmittingProspectFollowupNote, setIsSubmittingProspectFollowupNote] =
    useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    const nepalTimeZone = "Asia/Kathmandu";

  const handleAddProspectFollowupNote = async () => {
    if (
      !newProspectFollowupNote.trim() ||
      !authUser?.userId ||
      isSubmittingProspectFollowupNote
    )
      return;

    setIsSubmittingProspectFollowupNote(true);
    try {
      await addProspectFollowupNote({
        prospectId,
        content: newProspectFollowupNote,
        userId: authUser.userId,
      }).unwrap();
      setNewProspectFollowupNote("");
      toast.success("Prospect Followup Note added successfully!");
    } catch (error: any) {
      console.error("Failed to add Prospect Followup Note:", error);

      if (error.data?.message === "Prospect not found") {
        toast.error("Prospect not found - please refresh the page");
      } else if (error.data?.message === "User not found") {
        toast.error(
          "Your user account couldn't be found - please log in again",
        );
      } else if (error.data?.message === "Invalid client or user ID") {
        toast.error("Invalid data - please refresh the page");
      } else {
        toast.error("Failed to add followup Note");
      }
    } finally {
      setIsSubmittingProspectFollowupNote(false);
    }
  };

  // const handleLikeComment = async (commentId: number) => {
  //   if (!authUser?.userId) return;
  //   try {
  //     await likeComment({ commentId, userId: authUser.userId }).unwrap();
  //   } catch (error) {
  //     console.error("Failed to like comment:", error);
  //   }
  // };

  // const handleAddReply = async () => {
  //   if (!replyingTo || !replyContent.trim() || !authUser?.userId) return;
  //   try {
  //     if (replyingTo.type === "comment") {
  //       await addReply({
  //         commentId: replyingTo.id,
  //         content: replyContent,
  //         userId: authUser.userId,
  //       }).unwrap();
  //     }
  //     setReplyingTo(null);
  //     setReplyContent("");
  //   } catch (error) {
  //     console.error("Failed to add reply:", error);
  //   }
  // };

  // const handleLikeReply = async (replyId: number) => {
  //   if (!authUser?.userId) return;
  //   try {
  //     await likeReply({ replyId, userId: authUser.userId }).unwrap();
  //   } catch (error) {
  //     console.error("Failed to like reply:", error);
  //   }
  // };

  const handleUpdateProspectFollowupNote = async (
    prospectFollowupNoteId: number,
    currentProspectFollowupNote: string,
  ) => {
    const newProspectFollowupNote = prompt(
      "Edit your followup Note",
      currentProspectFollowupNote,
    );
    if (newProspectFollowupNote !== null && newProspectFollowupNote.trim() !== "") {
      try {
        await updateProspectFollowupNote({
          commentId: prospectFollowupNoteId,
          content: newProspectFollowupNote,
          prospectId,
        }).unwrap();
        toast.success("Prospect Followup Note updated successfully!");
      } catch (error) {
        console.error("Failed to update Prospect Followup Note:", error);
        toast.error("Failed to update Prospect Follow up note");
      }
    }
  };

  const handleDeleteProspectFollowupNote = async (prospectFollowupNoteId: number) => {
    if (confirm("Are you sure you want to delete this Follow up Note?")) {
      try {
        await deleteProspectFollowupNote({ prospectFollowupNoteId, prospectId }).unwrap();
        toast.success("Follow Up Note deleted successfully!");
      } catch (error) {
        console.error("Failed to delete Follow up Note:", error);
        toast.error("Failed to delete Follow up Note");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="flex max-h-[80vh] w-full max-w-3xl flex-col rounded-lg bg-white p-6 dark:bg-dark-secondary">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Prospect Follow up Notes</h3>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            &times;
          </button>
        </div>

        <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
          {isLoading ? (
            <div>Loading follow up notes...</div>
          ) : prospectFollowupNote && prospectFollowupNote.length > 0 ? (
            prospectFollowupNote.map((prospectFollowupNote) => (
              <div
                key={prospectFollowupNote.id}
                className="group relative border-b pb-4 dark:border-gray-700"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={prospectFollowupNote.user?.profilePictureUrl} />
                    <AvatarFallback>
                      {prospectFollowupNote.user?.firstname?.[0]}
                      {prospectFollowupNote.user?.lastname?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-base">
                          {prospectFollowupNote.user?.firstname}{" "}
                          {prospectFollowupNote.user?.lastname}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(
                            new Date(prospectFollowupNote.createdAt),
                            {
                              addSuffix: true,
                            },
                          )}
                        </span>
                      </div>
                      <div>
                        {" "}
                        {format(
                          new Date(prospectFollowupNote.createdAt),
                          "MMMM d, h:mm a",
                          {
                            timeZone: nepalTimeZone,
                          },
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-base">{prospectFollowupNote.content}</p>
                    {/* <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        className={`flex items-center gap-1 text-sm ${comment.likedByUser ? "text-red-500" : "text-gray-500"}`}
                      >
                        <Heart size={14} fill={comment.likedByUser ? "currentColor" : "none"} />
                        {comment.likeCount}
                      </button>
                      <button
                        onClick={() => setReplyingTo({ id: comment.id, type: "comment" })}
                        className="flex items-center gap-1 text-sm text-gray-500"
                      >
                        <Reply size={14} />
                        Reply
                      </button>
                    </div> */}

                    {authUser?.userId === prospectFollowupNote.userId && (
                      <div className="absolute right-0 top-0 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 bg-gray-200 px-2 py-1.5 rounded-md border-none">
                        <button
                          onClick={() =>
                            handleUpdateProspectFollowupNote(
                              prospectFollowupNote.id,
                              prospectFollowupNote.content,
                            )
                          }
                          className="text-gray-500 hover:text-blue-500"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteProspectFollowupNote(prospectFollowupNote.id)
                          }
                          className="text-gray-500 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-gray-500">
              No Followup Note added yet!
            </div>
          )}
        </div>

        {authUser && (
          <div className="flex gap-2">
            <Textarea
              value={newProspectFollowupNote}
              onChange={(e) => setNewProspectFollowupNote(e.target.value)}
              placeholder="Add a Follow up Notes..."
              className="flex-1"
            />
            <Button
              onClick={handleAddProspectFollowupNote}
              disabled={isSubmittingProspectFollowupNote}
            >
              <Send size={16} className="mr-2" />
              {isSubmittingProspectFollowupNote ? "Adding..." : "Add"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProspectFollowupNotePopup;
