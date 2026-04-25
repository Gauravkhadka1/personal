// client\src\components\UserStatus.tsx
"use client";

import React from "react";

interface UserStatusProps {
  lastSeenAt?: string;
  isOnline?: boolean;
  className?: string;
  showOnlyDot?: boolean;
}

export const UserStatus: React.FC<UserStatusProps> = ({
  lastSeenAt,
  isOnline,
  className = "",
  showOnlyDot = false,
}) => {
  // Calculate online status if not provided
  const calculatedIsOnline =
    isOnline ??
    (lastSeenAt
      ? new Date().getTime() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000
      : false);

  // If online, show green dot
  if (calculatedIsOnline) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="relative inline-flex">
          {/* Green dot */}
          <div className="h-5 w-5 rounded-full border-4 border-white bg-green-500 dark:border-gray-800"></div>
        </div>
        {!showOnlyDot && (
          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
            Online
          </span>
        )}
      </div>
    );
  }

  // For offline users, show time ago
  if (lastSeenAt) {
    const lastSeenDate = new Date(lastSeenAt);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - lastSeenDate.getTime()) / (1000 * 60),
    );

    let timeAgo;
    if (diffInMinutes < 1) {
      timeAgo = "just now";
    } else if (diffInMinutes < 60) {
      timeAgo = `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      timeAgo = `${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      timeAgo = `${days}d`;
    }

    return (
      <div className={`flex items-center ${className}`}>
        {showOnlyDot ? (
          <span className="text-xs px-1.5 py-0.2 border-2 border-white rounded-lg bg-green-100 text-green-700 dark:text-gray-400">
            {timeAgo}
          </span>
        ) : (
          <span className="text-xs px-1.5 py-0.2 border-2 border-white rounded-lg bg-green-100 text-green-700 dark:text-gray-400">
            {timeAgo} ago
          </span>
        )}
      </div>
    );
  }

  // Default offline state
  return (
    <div className={`flex items-center ${className}`}>
      {!showOnlyDot && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Offline
        </span>
      )}
    </div>
  );
};
