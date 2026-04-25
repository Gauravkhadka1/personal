"use client";
import React, { useState } from "react";
import { Bell, Check, MoreVertical, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  useGetUsersQuery,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} from "@/state/api";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import Header from "@/components/Header";

const NotificationsPage = () => {
  const { user } = useAuth();
  const { data: users } = useGetUsersQuery();
  const currentUser = users?.find((u) => u.email === user?.email);

  const { data: notifications = [], refetch: refetchNotifications } =
    useGetNotificationsQuery(
      {
        userId: currentUser?.userId || 0,
        showAll: true,
      },
      {
        skip: !currentUser?.userId,
        pollingInterval: 5000,
      },
    );

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markAsRead(notificationId).unwrap();
      refetchNotifications();
      setActiveMenu(null);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser?.userId) return;
    try {
      await markAllAsRead(currentUser.userId).unwrap();
      refetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      await deleteNotification(notificationId).unwrap();
      refetchNotifications();
      setActiveMenu(null);
    } catch (error) {
      console.error("Error deleting notification:", error);
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

  const getSenderUser = (notification: any) => {
    return users?.find((u) => u.userId === notification.senderId) || null;
  };

  // Group notifications by day
  const groupNotificationsByDay = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: Record<string, any[]> = {
      TODAY: [],
      YESTERDAY: [],
      OLDER: [],
    };

    notifications.forEach((notification) => {
      const notificationDate = new Date(notification.createdAt);

      if (notificationDate >= today) {
        groups.TODAY.push(notification);
      } else if (notificationDate >= yesterday) {
        groups.YESTERDAY.push(notification);
      } else {
        groups.OLDER.push(notification);
      }
    });

    return groups;
  };

  const groupedNotifications = groupNotificationsByDay();

   const [activeTab, setActiveTab] = useState("All");

  return (
    <div className="flex w-full flex-col px-8 dark:text-gray-300">
      <div className="flex items-center mt-4">
        <Header name="Notifications" />
      </div>

      <div className="border-b border-t mb-4 border-gray-200 pr-8 dark:border-gray-700">
        <nav className=" flex justify-between ">
          <div className="flex space-x-8 ">
            {[
              {
                id: "All",
                label: "All",
                // icon: <Contact className="mr-2 inline-block h-5 w-5" />,
              },
              {
                id: "Tasks",
                label: "Tasks",
                // icon: <Briefcase className="mr-2 inline-block h-5 w-5" />,
              },
              {
                id: "Comments",
                label: "Comments",
                // icon: <FolderCode className="mr-2 inline-block h-5 w-5" />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center border-b-2 px-1 py-4 text-base font-medium ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {/* {tab.icon} */}
                {tab.label}
              </button>
            ))}
          </div>

        
        </nav>
      </div>

      <div className="w-full">
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="mb-6 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-800 dark:bg-gray-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Check className="h-4 w-4" />
            Mark all as read
          </button>
        )}

        {notifications.length > 0 ? (
          <div className="space-y-8">
            {groupedNotifications.TODAY.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  TODAY
                </h2>
                {groupedNotifications.TODAY.map((notification) => {
                  const sender = getSenderUser(notification);
                  return (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      sender={sender}
                      buildImageUrl={buildImageUrl}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      handleMarkAsRead={handleMarkAsRead}
                      handleDeleteNotification={handleDeleteNotification}
                    />
                  );
                })}
              </div>
            )}

            {groupedNotifications.YESTERDAY.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  YESTERDAY
                </h2>
                {groupedNotifications.YESTERDAY.map((notification) => {
                  const sender = getSenderUser(notification);
                  return (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      sender={sender}
                      buildImageUrl={buildImageUrl}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      handleMarkAsRead={handleMarkAsRead}
                      handleDeleteNotification={handleDeleteNotification}
                    />
                  );
                })}
              </div>
            )}

            {groupedNotifications.OLDER.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  OLDER
                </h2>
                {groupedNotifications.OLDER.map((notification) => {
                  const sender = getSenderUser(notification);
                  return (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      sender={sender}
                      buildImageUrl={buildImageUrl}
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      handleMarkAsRead={handleMarkAsRead}
                      handleDeleteNotification={handleDeleteNotification}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No notifications yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              When you get notifications, they'll appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationItem = ({
  notification,
  sender,
  buildImageUrl,
  activeMenu,
  setActiveMenu,
  handleMarkAsRead,
  handleDeleteNotification,
}: any) => {
  return (
    <div
      className={cn(
        "relative rounded-lg border p-4 transition-all duration-200",
        !notification.isRead
          ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
        "hover:shadow-sm dark:hover:shadow-md",
      )}
    >
      {!notification.isRead && (
        <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-blue-500"></div>
      )}

      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          {sender?.profilePictureUrl ? (
            <AvatarImage
              src={buildImageUrl(sender.profilePictureUrl)}
              alt={`${sender?.username}'s profile`}
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="bg-gray-200 text-xs dark:bg-gray-400">
              {sender?.firstname?.charAt(0).toUpperCase()}
              {sender?.lastname?.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3
              className={cn(
                "font-medium",
                !notification.isRead
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-700 dark:text-gray-300",
              )}
            >
              {notification.title}
            </h3>
            <DropdownMenu
              onOpenChange={(open) =>
                open ? setActiveMenu(notification.id) : setActiveMenu(null)
              }
            >
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
                  <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {notification.isRead ? "Mark as unread" : "Mark as read"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteNotification(notification.id)}
                  className="flex cursor-pointer items-center gap-2 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {notification.message}
          </p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
