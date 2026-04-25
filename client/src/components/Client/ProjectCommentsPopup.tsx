"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useGetProjectCommentsQuery,
  useAddProjectCommentMutation,
  useLikeProjectCommentMutation,
  useAddProjectCommentReplyMutation,
  useLikeProjectCommentReplyMutation,
  useUpdateProjectCommentMutation,
  useDeleteProjectCommentMutation,
} from "@/state/api";
import { MessageSquare, Heart, Reply, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { Edit, Trash } from "lucide-react";

interface ProjectCommentsPopupProps {
  clientId: number;
  userId: number;
  onClose: () => void;
}

const ProjectCommentsPopup: React.FC<ProjectCommentsPopupProps> = ({
  clientId,
  userId,
  onClose,
}) => {
  const { user: authUser } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{
    id: number;
    type: "comment" | "reply";
  } | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const { data: comments, isLoading } = useGetProjectCommentsQuery(clientId);
  const [addComment] = useAddProjectCommentMutation();
  const [likeComment] = useLikeProjectCommentMutation();
  const [addReply] = useAddProjectCommentReplyMutation();
  const [likeReply] = useLikeProjectCommentReplyMutation();

  const [updateComment] = useUpdateProjectCommentMutation();
  const [deleteComment] = useDeleteProjectCommentMutation();

  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const handleAddComment = async () => {
    if (!newComment.trim() || !authUser?.userId || isSubmittingComment) return;

    setIsSubmittingComment(true);
    // const toastId = toast.loading('Adding comment...');
    try {
      await addComment({
        clientId,
        content: newComment,
        userId: authUser.userId,
      }).unwrap();
      setNewComment("");
      toast.success("Comment added successfully!");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!authUser?.userId) return;
    try {
      await likeComment({ commentId, userId: authUser.userId }).unwrap();
    } catch (error) {
      console.error("Failed to like comment:", error);
    }
  };

  const handleAddReply = async () => {
    if (!replyingTo || !replyContent.trim() || !authUser?.userId) return;
    try {
      if (replyingTo.type === "comment") {
        await addReply({
          commentId: replyingTo.id,
          content: replyContent,
          userId: authUser.userId,
        }).unwrap();
      }
      setReplyingTo(null);
      setReplyContent("");
    } catch (error) {
      console.error("Failed to add reply:", error);
    }
  };

  const handleLikeReply = async (replyId: number) => {
    if (!authUser?.userId) return;
    try {
      await likeReply({ replyId, userId: authUser.userId }).unwrap();
    } catch (error) {
      console.error("Failed to like reply:", error);
    }
  };

  const handleUpdateComment = async (
    commentId: number,
    currentContent: string,
  ) => {
    const newContent = prompt("Edit your comment", currentContent);
    if (newContent !== null && newContent.trim() !== "") {
      try {
        await updateComment({ commentId, content: newContent, clientId }).unwrap();
        toast.success("Comment updated successfully!");
      } catch (error) {
        console.error("Failed to update comment:", error);
        toast.error("Failed to update comment");
      }
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteComment({commentId, clientId}).unwrap();
        toast.success("Comment deleted successfully!");
      } catch (error) {
        console.error("Failed to delete comment:", error);
        toast.error("Failed to delete comment");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white p-6 dark:bg-dark-secondary">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Project Comments</h3>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            &times;
          </button>
        </div>

        <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
          {isLoading ? (
            <div>Loading comments...</div>
          ) : comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="border-b pb-4 dark:border-gray-700 group relative"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user?.profilePictureUrl} />
                    <AvatarFallback>
                      {comment.user?.firstname?.[0]}
                      {comment.user?.lastname?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {comment.user?.firstname} {comment.user?.lastname}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{comment.content}</p>
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

                    {authUser?.userId === comment.userId && (
                      <div className="absolute right-0 top-0 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() =>
                            handleUpdateComment(comment.id, comment.content)
                          }
                          className="text-gray-500 hover:text-blue-500"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-500 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    )}

                    {replyingTo?.id === comment.id &&
                      replyingTo.type === "comment" && (
                        <div className="mt-3 flex gap-2">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1"
                          />
                          <Button onClick={handleAddReply} size="sm">
                            <Send size={16} />
                          </Button>
                        </div>
                      )}

                    {comment.replies.length > 0 && (
                      <div className="mt-3 space-y-3 border-l-2 border-gray-200 pl-6 dark:border-gray-700">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="pt-3">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={reply.user?.profilePictureUrl}
                                />
                                <AvatarFallback>
                                  {reply.user?.firstname?.[0]}
                                  {reply.user?.lastname?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {reply.user.firstname} {reply.user.lastname}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDistanceToNow(
                                      new Date(reply.createdAt),
                                      { addSuffix: true },
                                    )}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm">{reply.content}</p>
                                <div className="mt-2 flex items-center gap-4">
                                  <button
                                    onClick={() => handleLikeReply(reply.id)}
                                    className={`flex items-center gap-1 text-sm ${reply.likedByUser ? "text-red-500" : "text-gray-500"}`}
                                  >
                                    <Heart
                                      size={14}
                                      fill={
                                        reply.likedByUser
                                          ? "currentColor"
                                          : "none"
                                      }
                                    />
                                    {reply.likeCount || 0}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>

        {authUser && (
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1"
            />
            <Button onClick={handleAddComment} disabled={isSubmittingComment}>
              <Send size={16} className="mr-2" />
              {isSubmittingComment ? "Sending..." : "Send"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCommentsPopup;
