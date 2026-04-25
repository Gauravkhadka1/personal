"use client";

import React, { useState } from "react";
import { Comment as CommentType, User } from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import { 
  useEditCommentMutation, 
  useDeleteTaskCommentMutation, 
  useToggleCommentLikeMutation, useEditReplyMutation, useDeleteReplyMutation, useToggleReplyLikeMutation
} from "@/state/api";
import RichTextEditor from "@/components/RichTextEditor";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ReplySection from "./ReplySection";
import toast from "react-hot-toast";

interface CommentProps {
  comment: CommentType;
  taskId: number;
  onUpdate?: () => void;
}

const Comment: React.FC<CommentProps> = ({ comment, taskId, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const { user: currentUser } = useAuth();

  const [editComment] = useEditCommentMutation();
  const [deleteComment] = useDeleteTaskCommentMutation();
  const [toggleCommentLike] = useToggleCommentLikeMutation();

  const isOwner = currentUser?.userId === comment.userId;
const hasLiked = comment.likes?.some(like => like.userId === currentUser?.userId) ?? false;

  const handleSaveEdit = async () => {
    if (!currentUser?.userId) return;

    try {
      await editComment({
        commentId: comment.id,
        content: editedContent,
        userId: Number(currentUser.userId),
      }).unwrap();
      
      setIsEditing(false);
      toast.success("Comment updated successfully");
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update comment:", error);
      toast.error("Failed to update comment");
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!currentUser?.userId || !confirm("Are you sure you want to delete this comment?")) return;

    try {
      await deleteComment({
        commentId: comment.id,
        userId: Number(currentUser.userId),
      }).unwrap();
      
      toast.success("Comment deleted successfully");
      onUpdate?.();
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const handleLike = async () => {
    if (!currentUser?.userId) return;

    try {
      await toggleCommentLike({
        commentId: comment.id,
        userId: Number(currentUser.userId),
      }).unwrap();
      
      onUpdate?.();
    } catch (error) {
      console.error("Failed to toggle like:", error);
      toast.error("Failed to toggle like");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  return (
    <div className="border-b border-gray-100 py-4 last:border-b-0">
      {/* Comment Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            {comment.user?.profilePictureUrl ? (
              <AvatarImage
                src={buildImageUrl(comment.user.profilePictureUrl)}
                alt={`${comment.user.firstname} ${comment.user.lastname}`}
              />
            ) : (
              <AvatarFallback className="text-sm">
                {comment.user?.firstname?.charAt(0)}
                {comment.user?.lastname?.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-sm font-medium">
                {comment.user?.firstname} {comment.user?.lastname}
              </strong>
              {comment.isEdited && (
                <span className="text-xs text-gray-500">(edited)</span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {formatDate(comment.createdAt)}
            </span>
          </div>
        </div>

        {/* Comment Actions */}
        {isOwner && (
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Comment Content */}
      <div className="mb-3">
        {isEditing ? (
          <div className="space-y-3">
            <RichTextEditor
              content={editedContent}
              onContentChange={setEditedContent}
              className="min-h-[100px]"
              withAttachments={false}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                className="rounded px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <RichTextEditor
            content={comment.content}
            onContentChange={() => {}} // Read-only
            className="min-h-[60px] bg-gray-50 text-sm"
            readOnly
          />
        )}
      </div>

      {/* Comment Actions Bar */}
      {/* <div className="flex items-center gap-4 text-xs text-gray-500">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 hover:text-blue-600 ${
            hasLiked ? "text-blue-600" : ""
          }`}
        >
          <span>👍</span>
    <span>Like ({comment.likes?.length || 0})</span>
        </button>
        
        <button
          onClick={() => setIsReplying(!isReplying)}
          className="hover:text-blue-600"
        >
          Reply
        </button>
      </div> */}

      {/* Reply Section */}
      {isReplying && (
        <div className="mt-3 pl-8 border-l-2 border-gray-200">
          <ReplySection
            commentId={comment.id}
            taskId={taskId}
            onReplyAdded={() => {
              setIsReplying(false);
              onUpdate?.();
            }}
          />
        </div>
      )}

      {/* Existing Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 pl-8 border-l-2 border-gray-200">
          {comment.replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              taskId={taskId}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Nested component for replies
const ReplyItem: React.FC<{ 
  reply: any; 
  taskId: number; 
  onUpdate?: () => void;
  depth?: number;
}> = ({ reply, taskId, onUpdate, depth = 0 }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(reply.content);
  const [isReplying, setIsReplying] = useState(false);
  const { user: currentUser } = useAuth();

  const [editReply] = useEditReplyMutation();
  const [deleteReply] = useDeleteReplyMutation();
  const [toggleReplyLike] = useToggleReplyLikeMutation();

  const isOwner = currentUser?.userId === reply.userId;
const hasLiked = reply.likes?.some((like: any) => like.userId === currentUser?.userId) ?? false;
  const maxDepth = 3; // Prevent infinite nesting

  const handleSaveEdit = async () => {
    if (!currentUser?.userId) return;

    try {
      await editReply({
        replyId: reply.id,
        content: editedContent,
        userId: Number(currentUser.userId),
      }).unwrap();
      
      setIsEditing(false);
      toast.success("Reply updated successfully");
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update reply:", error);
      toast.error("Failed to update reply");
    }
  };

  const handleDelete = async () => {
    if (!currentUser?.userId || !confirm("Are you sure you want to delete this reply?")) return;

    try {
      await deleteReply({
        replyId: reply.id,
        userId: Number(currentUser.userId),
      }).unwrap();
      
      toast.success("Reply deleted successfully");
      onUpdate?.();
    } catch (error) {
      console.error("Failed to delete reply:", error);
      toast.error("Failed to delete reply");
    }
  };

  const handleLike = async () => {
    if (!currentUser?.userId) return;

    try {
      await toggleReplyLike({
        replyId: reply.id,
        userId: Number(currentUser.userId),
      }).unwrap();
      
      onUpdate?.();
    } catch (error) {
      console.error("Failed to toggle like:", error);
      toast.error("Failed to toggle like");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  return (
    <div className="py-3">
      {/* Reply Header */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            {reply.user?.profilePictureUrl ? (
              <AvatarImage
                src={buildImageUrl(reply.user.profilePictureUrl)}
                alt={`${reply.user.firstname} ${reply.user.lastname}`}
              />
            ) : (
              <AvatarFallback className="text-xs">
                {reply.user?.firstname?.charAt(0)}
                {reply.user?.lastname?.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="flex items-center gap-1">
              <strong className="text-xs font-medium">
                {reply.user?.firstname} {reply.user?.lastname}
              </strong>
              {reply.isEdited && (
                <span className="text-xs text-gray-500">(edited)</span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {formatDate(reply.createdAt)}
            </span>
          </div>
        </div>

        {/* Reply Actions */}
        {isOwner && (
          <div className="flex gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Reply Content */}
      <div className="mb-2">
        {isEditing ? (
          <div className="space-y-2">
            <RichTextEditor
              content={editedContent}
              onContentChange={setEditedContent}
              className="min-h-[80px] text-sm"
              withAttachments={false}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <RichTextEditor
            content={reply.content}
            onContentChange={() => {}} // Read-only
            className="min-h-[40px] bg-gray-50 text-sm"
            readOnly
          />
        )}
      </div>

      {/* Reply Actions Bar */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 hover:text-blue-600 ${
            hasLiked ? "text-blue-600" : ""
          }`}
        >
          <span>👍</span>
      <span>Like ({reply.likes?.length || 0})</span>
        </button>
        
        {depth < maxDepth && (
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="hover:text-blue-600"
          >
            Reply
          </button>
        )}
      </div>

      {/* Nested Reply Input */}
      {isReplying && depth < maxDepth && (
        <div className="mt-2">
          <ReplySection
            commentId={reply.commentId}
            taskId={taskId}
            parentReplyId={reply.id}
            onReplyAdded={() => {
              setIsReplying(false);
              onUpdate?.();
            }}
          />
        </div>
      )}

      {/* Nested Replies */}
      {reply.replies && reply.replies.length > 0 && (
        <div className="mt-2 border-l-2 border-gray-200 pl-4">
          {reply.replies.map((nestedReply: any) => (
            <ReplyItem
              key={nestedReply.id}
              reply={nestedReply}
              taskId={taskId}
              onUpdate={onUpdate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;