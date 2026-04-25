import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetSystemFeedbacksQuery } from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import { UserStatus } from "@/components/UserStatus";
import { MessageSquare, CheckCircle, AlertCircle, Clock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserFeedbackStats {
  user: {
    userId: number;
    firstname: string;
    lastname: string;
    username: string;
    profilePictureUrl?: string;
    isOnline?: boolean;
    lastSeenAt?: string;
  };
  statusCounts: {
    New: number;
    Acknowledged: number;
    InProgress: number;
    Resolved: number;
  };
  totalCount: number;
  resolvedCount: number;
}

interface SystemFeedbackSidebarProps {
  onUserSelect?: (userId: number | null) => void;
  selectedUserId?: number | null;
}

const SystemFeedbackSidebar: React.FC<SystemFeedbackSidebarProps> = ({ 
  onUserSelect, 
  selectedUserId 
}) => {
  const { user: currentUser } = useAuth();
  const { data: feedbacksData, isLoading, error } = useGetSystemFeedbacksQuery();
  const [userStats, setUserStats] = useState<UserFeedbackStats[]>([]);

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.replace(/^[\\/]/, "");

    if (cleanPath.includes("uploads/")) {
      return `${baseUrl}/${cleanPath}`;
    }

    return `${baseUrl}/uploads/${cleanPath}`;
  };

  useEffect(() => {
    if (feedbacksData?.feedbacks) {
      // Group feedbacks by user
      const userFeedbackMap = new Map<number, {
        user: any;
        feedbacks: any[];
      }>();

      feedbacksData.feedbacks.forEach(feedback => {
        if (feedback.user) {
          const userId = feedback.user.userId;
          if (!userFeedbackMap.has(userId)) {
            userFeedbackMap.set(userId, {
              user: feedback.user,
              feedbacks: []
            });
          }
          userFeedbackMap.get(userId)!.feedbacks.push(feedback);
        }
      });

      // Calculate stats for each user
      const stats: UserFeedbackStats[] = Array.from(userFeedbackMap.values()).map(({ user, feedbacks }) => {
        const statusCounts = {
          New: feedbacks.filter(f => f.status === 'New').length,
          Acknowledged: feedbacks.filter(f => f.status === 'Acknowledged').length,
          InProgress: feedbacks.filter(f => f.status === 'InProgress').length,
          Resolved: feedbacks.filter(f => f.status === 'Resolved').length,
        };

        return {
          user,
          statusCounts,
          totalCount: feedbacks.length,
          resolvedCount: statusCounts.Resolved,
        };
      });

      // Sort by total feedback count (descending)
      stats.sort((a, b) => b.totalCount - a.totalCount);
      
      setUserStats(stats);
    }
  }, [feedbacksData]);

  const handleUserClick = (userId: number) => {
    // Toggle selection - if same user is clicked, deselect
    const newSelectedUserId = selectedUserId === userId ? null : userId;
    onUserSelect?.(newSelectedUserId);
  };

  const handleShowAll = () => {
    onUserSelect?.(null);
  };

  if (isLoading) {
    return (
      <Card className="w-full border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-secondary-dark">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg font-semibold dark:text-gray-300">
            <Users className="h-5 w-5 inline mr-2" />
            Users Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-6 w-8" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !feedbacksData) {
    return (
      <Card className="w-full border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-secondary-dark">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg font-semibold dark:text-gray-300">
            <Users className="h-5 w-5 inline mr-2" />
            Users Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to load feedback data</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-secondary-dark">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg font-semibold dark:text-gray-300 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Filter By Users 
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className="custom-scrollbar divide-y divide-gray-200 dark:divide-gray-600"
          style={{ maxHeight: "600px", overflowY: "auto" }}
        >
          {/* User List */}
          {userStats.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No users with feedback found</p>
            </div>
          ) : (
            userStats.map((userStat) => (
              <div
                key={userStat.user.userId}
                className={`p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                  selectedUserId === userStat.user.userId 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' 
                    : ''
                }`}
                onClick={() => handleUserClick(userStat.user.userId)}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="relative h-10 w-10">
                    {userStat.user.profilePictureUrl ? (
                      <AvatarImage
                        src={buildImageUrl(userStat.user.profilePictureUrl)}
                        alt={`${userStat.user.firstname} ${userStat.user.lastname}`}
                      />
                    ) : (
                      <AvatarFallback className="text-sm">
                        {userStat.user.firstname?.charAt(0)}{userStat.user.lastname?.charAt(0)}
                      </AvatarFallback>
                    )}
                    <UserStatus
                      lastSeenAt={userStat.user.lastSeenAt}
                      isOnline={userStat.user.isOnline}
                      className="absolute -bottom-0 -right-0"
                      showOnlyDot
                    />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate dark:text-gray-200">
                      {`${userStat.user.firstname} ${userStat.user.lastname}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant="outline" className="text-xs">
                      {userStat.totalCount} Total
                    </Badge>
                    <Badge variant="outline" className="text-xs text-green-600">
                      {userStat.resolvedCount} Resolved
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemFeedbackSidebar;