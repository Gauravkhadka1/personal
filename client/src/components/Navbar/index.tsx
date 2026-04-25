"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Bell,
  Check,
  LogOut,
  Moon,
  PanelRightClose,
  Sun,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsDarkMode, setIsSidebarCollapsed } from "@/state";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  useGetUsersQuery,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useUpdateLastSeenMutation,
} from "@/state/api";
import { cn } from "@/lib/utils";
import { playNotificationSound } from "../../hooks/useNotificationSound";
import { useRouter } from "next/navigation";
import { UserStatus } from "../UserStatus";

const Navbar = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const { user, logout } = useAuth();
  const { data: users } = useGetUsersQuery();
  const currentUser = users?.find((u) => u.email === user?.email);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [updateLastSeen] = useUpdateLastSeenMutation();

  const { data: notifications = [], refetch: refetchNotifications } =
    useGetNotificationsQuery(
      {
        userId: currentUser?.userId || 0,
        showAll: false, // Only fetch unread notifications for the navbar
      },
      {
        skip: !currentUser?.userId,
        pollingInterval: 5000,
      },
    );

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  // Play sound for new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (!latestNotification.isRead) {
        playNotificationSound(latestNotification); // Now this works!
      }
    }
  }, [notifications]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update presence every minute when user is active
  useEffect(() => {
    const interval = setInterval(() => {
      updateLastSeen();
    }, 60 * 1000); // Update every minute

    // Also update on component mount
    updateLastSeen();

    return () => clearInterval(interval);
  }, [updateLastSeen]);

  // Update presence when user interacts with the page
  useEffect(() => {
    const handleActivity = () => {
      updateLastSeen();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [updateLastSeen]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleNotificationClick = async (notificationId: number) => {
    try {
      await markAsRead(notificationId).unwrap();
      refetchNotifications();
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

  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 0 && currentHour < 12) return "Good Morning";
    if (currentHour >= 12 && currentHour < 18) return "Good Afternoon";
    return "Good Evening";
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
    <div className="flex items-center justify-between bg-white px-4 py-3 dark:bg-secondary dark:px-4 dark:py-3">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {!isSidebarCollapsed ? null : (
          <button
            onClick={() => dispatch(setIsSidebarCollapsed(!isSidebarCollapsed))}
          >
            <PanelRightClose className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        )}
        <div className="relative ml-2 flex h-min w-[200px] text-base font-medium text-sidebar-color dark:text-gray-300">
          {getGreeting()}, {user?.username}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center">
        {/* Notification Bell */}
        <div className="relative mr-3" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Link href="/notifications">
              <Bell className="h-6 w-6 cursor-pointer dark:text-gray-200" />
            </Link>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={() => dispatch(setIsDarkMode(!isDarkMode))}
          className={
            isDarkMode
              ? `rounded p-2 dark:hover:bg-gray-700`
              : `rounded p-2 hover:bg-gray-100`
          }
        >
          {isDarkMode ? (
            <Sun className="h-6 w-6 cursor-pointer dark:text-white" />
          ) : (
            <Moon className="h-6 w-6 cursor-pointer dark:text-white" />
          )}
        </button>

        <div className="ml-2 mr-5 hidden min-h-[2em] w-[0.1rem] bg-gray-200 md:inline-block"></div>

        {/* User profile */}
        <div className="relative mr-3 flex items-center gap-2" ref={profileRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <Avatar className="relative h-8 w-8">
              {currentUser?.profilePictureUrl ? (
                <AvatarImage
                  src={buildImageUrl(currentUser.profilePictureUrl)}
                  alt={`${currentUser?.username}'s profile`}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="bg-gray-200 text-xs dark:bg-gray-400">
                  {currentUser?.firstname?.charAt(0).toUpperCase()}
                  {currentUser?.lastname?.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
              {/* Green dot for online status */}
              <UserStatus
                lastSeenAt={currentUser?.lastSeenAt}
                className="absolute -bottom-1.5 -right-1.5"
                showOnlyDot
              />
            </Avatar>

            <span className="hidden dark:text-gray-300 md:inline">
              {currentUser?.username}
            </span>
          </button>

          {/* Profile Dropdown */}
          {showProfileDropdown && (
            <div className="absolute right-0 top-full z-[1000] mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700"></div>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={() => setShowProfileDropdown(false)}
              >
                <UserRound className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <LogOut className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
