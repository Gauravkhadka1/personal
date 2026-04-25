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
} from "@/state/api";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);


  const handleLogout = () => {
    logout();
    router.push("/");
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
                  alt={`${currentUser?.firstname}'s profile`}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="bg-gray-200 text-xs dark:bg-gray-400">
                  {currentUser?.firstname?.charAt(0).toUpperCase()}
                  {currentUser?.lastname?.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
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
