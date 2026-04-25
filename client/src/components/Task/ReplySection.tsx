"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAddReplyToCommentMutation } from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import { useGetUsersQuery, User } from "@/state/api";
import RichTextEditor from "@/components/RichTextEditor";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import toast from "react-hot-toast";

interface ReplySectionProps {
  commentId: number;
  taskId: number;
  parentReplyId?: number;
  onReplyAdded: () => void;
  onCancel?: () => void;
}

const ReplySection: React.FC<ReplySectionProps> = ({
  commentId,
  taskId,
  parentReplyId,
  onReplyAdded,
  onCancel,
}) => {
  const [replyContent, setReplyContent] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [lastAtPosition, setLastAtPosition] = useState(-1);
  const editorRef = useRef<HTMLDivElement>(null);
  const userListRef = useRef<HTMLDivElement>(null);

  const [addReplyToComment] = useAddReplyToCommentMutation();
  const { user: currentUser } = useAuth();
  const { data: users = [] } = useGetUsersQuery();

  // REMOVED: User filtering - now showing all users to all users
  const filteredUsers = users; // Direct assignment, no filtering

  const mentionableUsers = filteredUsers.filter(user =>
    mentionQuery === "" ? true :
    `${user.firstname} ${user.lastname}`.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleAddReply = async () => {
    if (!replyContent.trim()) return;

    try {
      if (!currentUser?.userId) {
        toast.error("You must be logged in to reply");
        return;
      }

      await addReplyToComment({
        commentId,
        content: replyContent,
        userId: Number(currentUser.userId),
        parentReplyId,
      }).unwrap();

      setReplyContent("");
      toast.success("Reply added successfully");
      onReplyAdded();
    } catch (error) {
      console.error("Failed to add reply:", error);
      toast.error("Failed to add reply");
    }
  };

  const extractTextFromHtml = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const handleContentChange = (content: string) => {
    setReplyContent(content);
    
    const plainText = extractTextFromHtml(content);
    const atIndex = plainText.lastIndexOf("@");
    
    if (atIndex !== -1) {
      const textAfterAt = plainText.slice(atIndex + 1);
      const spaceIndex = textAfterAt.indexOf(" ");
      const query = spaceIndex === -1 ? textAfterAt : textAfterAt.slice(0, spaceIndex);
      
      setMentionQuery(query);
      setLastAtPosition(atIndex);
      setShowUserList(true);
      setSelectedUserIndex(0);
      return;
    }
    
    setShowUserList(false);
    setMentionQuery("");
  };

  const insertMention = (selectedUser: User) => {
    if (lastAtPosition === -1) return;

    const plainText = extractTextFromHtml(replyContent);
    const textBeforeAt = plainText.slice(0, lastAtPosition);
    const textAfterAt = plainText.slice(lastAtPosition);
    const spaceIndex = textAfterAt.indexOf(" ");
    const textAfterMention = spaceIndex === -1 ? "" : textAfterAt.slice(spaceIndex);

    const mentionText = `@${selectedUser.firstname} ${selectedUser.lastname}`;
    const newPlainText = textBeforeAt + mentionText + textAfterMention;
    
    setReplyContent(newPlainText);
    setShowUserList(false);
    setMentionQuery("");
    setLastAtPosition(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showUserList) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedUserIndex(prev => 
          prev < mentionableUsers.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedUserIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case "Enter":
        e.preventDefault();
        if (mentionableUsers[selectedUserIndex]) {
          insertMention(mentionableUsers[selectedUserIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowUserList(false);
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editorRef.current && 
        !editorRef.current.contains(event.target as Node) &&
        userListRef.current && 
        !userListRef.current.contains(event.target as Node)
      ) {
        setShowUserList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  return (
    <div className="space-y-3 relative" ref={editorRef}>
      <div onKeyDown={handleKeyDown}>
        <RichTextEditor
          content={replyContent}
          onContentChange={handleContentChange}
          placeholder="Write a reply... Type @ to mention users"
          className="min-h-[80px] text-sm"
          withAttachments={false}
        />
      </div>

      {/* User Mention Dropdown */}
      {showUserList && (
        <div
          ref={userListRef}
          className="absolute bottom-full mb-2 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {mentionableUsers.length > 0 ? (
            mentionableUsers.map((user, index) => (
              <div
                key={user.userId}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${
                  index === selectedUserIndex ? "bg-blue-50" : ""
                } ${index !== mentionableUsers.length - 1 ? "border-b border-gray-100" : ""}`}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSelectedUserIndex(index)}
              >
                <Avatar className="h-8 w-8">
                  {user.profilePictureUrl ? (
                    <AvatarImage
                      src={buildImageUrl(user.profilePictureUrl)}
                      alt={`${user.firstname} ${user.lastname}`}
                    />
                  ) : (
                    <AvatarFallback className="text-sm">
                      {user.firstname?.charAt(0)}
                      {user.lastname?.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.firstname} {user.lastname}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-sm text-gray-500">
              No users found
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleAddReply}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={!replyContent.trim()}
        >
          Post Reply
        </button>
      </div>
    </div>
  );
};

export default ReplySection;