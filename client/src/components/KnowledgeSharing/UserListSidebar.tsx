import React from "react";
import { useGetUsersQuery } from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UserStatus } from "@/components/UserStatus";

interface User {
  userId: number;
  firstname: string;
  lastname: string;
  profilePictureUrl?: string;
  lastSeenAt?: string;
  _count?: {
    knowledgeSharings?: number;
  };
}

interface UserListSidebarProps {
  onUserClick: (userId: number) => void;
  activeUserId?: number | null;
  userPostCounts?: Record<number, number>;
}

const UserListSidebar: React.FC<UserListSidebarProps> = ({
  onUserClick,
  activeUserId,
  userPostCounts,
}) => {
  const { data: users, isLoading } = useGetUsersQuery();
  const { user: currentUser } = useAuth();

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-3 w-[60px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Filter out the current user and sort by most active (users with most posts first)
  const filteredUsers = (users || [])
    .filter((user) => user.userId !== currentUser?.userId)
    .sort((a, b) => (b._count?.knowledgeSharings || 0) - (a._count?.knowledgeSharings || 0));

  return (
    <div className="w-full space-y-2">
      <h3 className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
        Team Members
      </h3>
      <div className="space-y-1">
        {/* Current user at the top */}
        {currentUser && (
          <div
            onClick={() => currentUser.userId !== undefined && onUserClick(currentUser.userId)}
            className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
              activeUserId === currentUser.userId
                ? "bg-gray-200 dark:bg-gray-600"
                : ""
            }`}
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                {currentUser.profilePictureUrl ? (
                  <AvatarImage
                    src={buildImageUrl(currentUser.profilePictureUrl)}
                    alt={`${currentUser.firstname} ${currentUser.lastname}`}
                  />
                ) : (
                  <AvatarFallback>
                    {currentUser.firstname?.charAt(0)}
                    {currentUser.lastname?.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <UserStatus
                lastSeenAt={currentUser.lastSeenAt}
                className="absolute -bottom-0 -right-0"
                showOnlyDot
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">
                Me
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {(currentUser.userId !== undefined && userPostCounts?.[currentUser.userId]) || 0} posts
              </p>
            </div>
          </div>
        )}

        {/* Other users */}
        {filteredUsers.map((user) => (
          <div
            key={user.userId}
            onClick={() => user.userId !== undefined && onUserClick(user.userId)}
            className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
              activeUserId === user.userId
                ? "bg-gray-200 dark:bg-gray-600"
                : ""
            }`}
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                {user.profilePictureUrl ? (
                  <AvatarImage
                    src={buildImageUrl(user.profilePictureUrl)}
                    alt={`${user.firstname} ${user.lastname}`}
                  />
                ) : (
                  <AvatarFallback>
                    {user.firstname?.charAt(0)}
                    {user.lastname?.charAt(0)}
                  </AvatarFallback>
                )}
              </Avatar>
              <UserStatus
                lastSeenAt={user.lastSeenAt}
                className="absolute -bottom-0 -right-0"
                showOnlyDot
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">
                {user.firstname} {user.lastname}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {(user.userId !== undefined && userPostCounts?.[user.userId]) || 0} posts
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserListSidebar;