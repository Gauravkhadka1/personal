"use client";

import React, { useState, useRef, useEffect } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { useAddCommentToTaskMutation } from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import { useGetUsersQuery, User } from "@/state/api";
import toast from "react-hot-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface CommentInputProps {
  taskId: number;
  onCommentAdded?: () => void;
}

const CommentInput: React.FC<CommentInputProps> = ({ taskId, onCommentAdded }) => {
  const [newComment, setNewComment] = useState("");
  const [showUserList, setShowUserList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [lastAtPosition, setLastAtPosition] = useState(-1);
  const editorRef = useRef<HTMLDivElement>(null);
  const userListRef = useRef<HTMLDivElement>(null);

  const [addCommentToTask] = useAddCommentToTaskMutation();
  const { user: currentUser } = useAuth();
  const { data: users = [] } = useGetUsersQuery();

  // REMOVED: User filtering - now showing all users to all users
  const filteredUsers = users; // Direct assignment, no filtering

  // Filter users based on mention query only
  const mentionableUsers = filteredUsers.filter(user =>
    mentionQuery === "" ? true : // Show all users when query is empty
    `${user.firstname} ${user.lastname}`.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      if (!currentUser?.userId) {
        toast.error("You must be logged in to comment");
        return;
      }

      await addCommentToTask({
        taskId: taskId,
        content: newComment,
        userId: Number(currentUser.userId),
      }).unwrap();

      setNewComment("");
      toast.success("Comment added successfully");
      
      // Call callback if provided
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
    }
  };

  // Function to extract plain text from HTML
  const extractTextFromHtml = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const handleContentChange = (content: string) => {
    setNewComment(content);
    
    // Extract plain text to detect @ mentions
    const plainText = extractTextFromHtml(content);
    
    // Check for @ mentions in plain text
    const atIndex = plainText.lastIndexOf("@");
    
    if (atIndex !== -1) {
      const textAfterAt = plainText.slice(atIndex + 1);
      const spaceIndex = textAfterAt.indexOf(" ");
      const query = spaceIndex === -1 ? textAfterAt : textAfterAt.slice(0, spaceIndex);
      
      console.log("Detected @ at position:", atIndex, "Query:", query); // Debug log
      
      // Show user list immediately when @ is detected
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

    // Get current plain text to find the position to replace
    const plainText = extractTextFromHtml(newComment);
    const textBeforeAt = plainText.slice(0, lastAtPosition);
    const textAfterAt = plainText.slice(lastAtPosition);
    const spaceIndex = textAfterAt.indexOf(" ");
    const textAfterMention = spaceIndex === -1 ? "" : textAfterAt.slice(spaceIndex);

    const mentionText = `@${selectedUser.firstname} ${selectedUser.lastname}`;
    
    // Create the new content by replacing the @mention part
    // This is a simplified approach - you might need to adjust based on your HTML structure
    const newPlainText = textBeforeAt + mentionText + textAfterMention;
    
    // For now, we'll set the plain text. You might want to enhance this to preserve formatting
    setNewComment(newPlainText);
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

  // Close user list when clicking outside
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

  // Also close user list when comment is submitted
  useEffect(() => {
    if (!newComment.trim()) {
      setShowUserList(false);
    }
  }, [newComment]);

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-600 pt-4" ref={editorRef}>
      <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-300">Add Comment</h4>
      <div className="space-y-3 relative">
        <div onKeyDown={handleKeyDown}>
          <RichTextEditor
            content={newComment}
            onContentChange={handleContentChange}
            placeholder="Write a comment... Type @ to mention users"
            className="min-h-[120px] dark:bg-secondary"
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

        <div className="flex justify-end">
          <button
            onClick={handleAddComment}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={!newComment.trim()}
          >
            Post Comment
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;