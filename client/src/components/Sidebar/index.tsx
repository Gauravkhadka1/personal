"use client";

import { useAppDispatch, useAppSelector } from "@/app/redux";
import { setIsSidebarCollapsed } from "@/state";
import { signOut } from "aws-amplify/auth";
import {
  FolderCode,
  Timer,
  Home,
  Users,
  LucideIcon,
  BookUser,
  UserRoundPlus,
  ReceiptText,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelRightClose,
  Activity,
  ListTodo,
  UserRoundCheck,
  ClipboardCheck,
  ClipboardList,
  MessageCircleWarning,
  BellPlus,
  Bell,
  Plus,
  BadgePlus,
  CirclePlus,
  BookOpen,
  Trash2,
  FileText,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname, useSearchParams } from "next/navigation";

const Sidebar = () => {
  const [showExpiryDropdown, setShowExpiryDropdown] = useState(false);
  const dispatch = useAppDispatch();
  const isSidebarCollapsed = useAppSelector(
    (state) => state.global.isSidebarCollapsed,
  );
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const { user, loading } = useAuth();

  const sidebarClassNames = `fixed flex flex-col h-[100%] justify-between shadow-xl
    transition-all duration-300 h-full z-40 dark:bg-secondary overflow-y-auto custom-scrollbar bg-white
    ${isSidebarCollapsed ? "w-0 hidden" : "w-64"}`;

  const [showTasksDropdown, setShowTasksDropdown] = useState(false);
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);

  if (loading) {
    return (
      <div className={sidebarClassNames}>
        <div className="flex h-[100%] w-full flex-col justify-start">
          <div className="z-50 flex min-h-[56px] w-64 items-center justify-between bg-white px-6 pt-3 dark:bg-secondary">
            <Skeleton className="h-10 w-40 rounded" />
          </div>

          <nav className="z-10 mt-6 w-full space-y-2 px-4 dark:text-gray-800">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 flex-1 rounded" />
              </div>
            ))}

            <div className="space-y-2">
              <div className="flex items-center space-x-4 p-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 flex-1 rounded" />
                <Skeleton className="h-4 w-8 rounded" />
              </div>
              <div className="space-y-2 pl-10">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center p-2 pl-6">
                    <Skeleton className="h-4 flex-1 rounded" />
                    <Skeleton className="ml-auto h-4 w-8 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>
    );
  }

  const isAdminOrDesignerOrDeveloper =
    user?.role === "ADMIN" ||
    user?.role === "DESIGNER" ||
    user?.role === "DEVELOPER";

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className={sidebarClassNames}>
      <div className="flex h-[100%] w-full flex-col justify-start dark:bg-secondary">
        <div className="z-50 flex min-h-[44px] w-64 items-center justify-between bg-white px-6 pt-3 dark:bg-secondary">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-500 hover:underline"
          >
            <div className="text-xl font-bold text-gray-800 dark:text-white">
              {isDarkMode ? (
                <Image
                  src={"/webtech-white.svg"}
                  alt="logo"
                  width={300}
                  height={20}
                />
              ) : (
                <Image
                  src={"/webtech-black.svg"}
                  alt="logo"
                  width={300}
                  height={20}
                />
              )}
            </div>
          </Link>
          {isSidebarCollapsed ? null : (
            <button
              className="-mr-4 ml-2"
              onClick={() => {
                dispatch(setIsSidebarCollapsed(!isSidebarCollapsed));
              }}
            >
              <PanelLeftClose className="h-6 w-6 text-sidebar-iconcolor dark:text-gray-400" />
            </button>
          )}
        </div>

        <nav className="z-10 mt-6 w-full dark:text-gray-800">
          {/* Dashboard Section Section */}
          <div className="px-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Main
            </h3>
          </div>
          <SidebarLink icon={Home} label="Dashboard" href="/dashboard" />

          {/* Work Section */}
          <div className="px-6 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Work
            </h3>
          </div>

          <>
            {/* <div className="relative">
              <div
                onClick={() => setShowTasksDropdown(!showTasksDropdown)}
                className={`flex cursor-pointer items-center gap-4 px-8 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  usePathname().startsWith("/mytasks") ||
                  usePathname().startsWith("/alltasks")
                    ? "bg-gray-100 dark:bg-secondary"
                    : ""
                }`}
              >
                <ClipboardList className="h-6 w-6 text-base text-sidebar-iconcolor dark:text-gray-1000" />

                <span className="text-base font-medium text-sidebar-color dark:text-gray-1000">
                  Tasks
                </span>
                <span className="ml-auto flex items-center gap-1">
                  {showTasksDropdown ? (
                    <ChevronUp className="h-4 w-4 text-sidebar-iconcolor dark:text-gray-1000" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-sidebar-iconcolor dark:text-gray-1000" />
                  )}
                </span>
              </div>

              {showTasksDropdown && (
                <div className="relative ml-8 space-y-1">
              
                  <div className="absolute left-0 top-0 h-[72%] w-px bg-gray-300 dark:bg-gray-600"></div>
                  <div className="relative pl-2">
                    <div className="absolute left-0 top-[5px] h-4 w-6 rounded-bl-lg border-b-[1px] border-l-[1px] border-gray-300 dark:border-gray-600"></div>
                    <SidebarLink label="My Tasks" href="/mytasks" />
                  </div>
                  {isAdminOrDesignerOrDeveloper && (
                    <div className="relative pl-2">
                      <div className="absolute left-0 top-[5px] h-4 w-6 rounded-bl-lg border-b-[1px] border-l-[1px] border-gray-300 dark:border-gray-600"></div>
                      <SidebarLink label="All Tasks" href="/alltasks" />
                    </div>
                  )}
                </div>
              )}
            </div> */}

            <SidebarLink icon={ClipboardList} label="Tasks" href="/tasks" />

            {isAdminOrDesignerOrDeveloper && (
              <SidebarLink
                icon={FolderCode}
                label="Projects"
                href="/projects"
              />
            )}
            {isAdminOrDesignerOrDeveloper && (
              <SidebarLink
                icon={Timer}
                label="Projects Timeline"
                href="/projects-timelines"
              />
            )}
            {isAdmin && (
              <SidebarLink
                icon={FileText}
                label="Policies"
                href="/policies-and-procedures"
              />
            )}
          </>

          {/* People Section */}
          {isAdminOrDesignerOrDeveloper && (
            <div>
              <div className="px-6 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  People
                </h3>
              </div>

              {isAdminOrDesignerOrDeveloper && (
                <SidebarLink icon={Users} label="Team" href="/users" />
              )}
            </div>
          )}

          {/* System Section */}
          <div className="px-6 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Workspace
            </h3>
          </div>
          <SidebarLink
            icon={BellPlus}
            label="What's New"
            href="/system-updates"
          />
          {isAdminOrDesignerOrDeveloper && (
            <SidebarLink
              icon={MessageCircleWarning}
              label="Feedback"
              href="/system-feedback"
            />
          )}
          <div className="relative">
            <div
              onClick={() => setShowReportsDropdown(!showReportsDropdown)}
              className={`flex cursor-pointer items-center gap-4 px-8 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                usePathname().startsWith("/reports") ||
                usePathname().startsWith("/daily-updates")
                  ? "bg-gray-100 dark:bg-secondary"
                  : ""
              }`}
            >
              <Activity className="h-6 w-6 text-base text-sidebar-iconcolor dark:text-gray-1000" />
              <span className="text-base font-medium text-sidebar-color dark:text-gray-1000">
                Reports
              </span>
              <span className="ml-auto flex items-center gap-1">
                {showReportsDropdown ? (
                  <ChevronUp className="h-4 w-4 text-sidebar-iconcolor dark:text-gray-1000" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-sidebar-iconcolor dark:text-gray-1000" />
                )}
              </span>
            </div>

            {showReportsDropdown && (
              <div className="relative ml-8 space-y-1">
                {/* Vertical line comes first */}
                <div className="absolute left-0 top-0 h-[76%] w-px bg-gray-300 dark:bg-gray-600"></div>

                {/* Schedules */}
                <div className="relative pl-2">
                  {/* Horizontal pointer connects to vertical line */}

                  <div className="absolute left-0 top-[5px] h-4 w-6 rounded-bl-lg border-b-[1px] border-l-[1px] border-gray-300 dark:border-gray-600"></div>
                  <SidebarLink label="Tasks Reports" href="/tasks/reports" />
                </div>

                {/* Team Reports */}
                {/* <div className="relative pl-2">
                  <div className="absolute left-0 top-[5px] h-4 w-6 rounded-bl-lg border-b-[1px] border-l-[1px] border-gray-300 dark:border-gray-600"></div>
                  <SidebarLink label="Team Reports" href="/team-reports" />
                </div> */}
                {isAdmin && (
                  <div className="relative pl-2">
                    <div className="absolute left-0 top-[5px] h-4 w-6 rounded-bl-lg border-b-[1px] border-l-[1px] border-gray-300 dark:border-gray-600"></div>
                    <SidebarLink label="Sales" href="/sales" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Other Section */}
          <div className="px-6 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Other
            </h3>
          </div>

          <SidebarLink
            icon={BookOpen}
            label="Knowledge Sharing"
            href="/knowledge-sharing"
          />

          <SidebarLink icon={Trash2} label="Recycle Bin" href="/recycle-bin" />
        </nav>
      </div>
    </div>
  );
};

interface SidebarLinkProps {
  href: string;
  icon?: LucideIcon;
  label: string;
  noIcon?: boolean;
  count?: number;
  isExpired?: boolean;
  is30Days?: boolean;
  is15Days?: boolean;
  is7Days?: boolean;
  isSuspended?: boolean;
  isNewClient?: boolean;
  className?: string;
}

const SidebarLink = ({
  href,
  icon: Icon,
  label,
  noIcon = false,
  count,
  isExpired = false,
  is30Days = false,
  is15Days = false,
  is7Days = false,
  isSuspended = false,
  isNewClient = false,
  className = "",
}: SidebarLinkProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Check if the current path matches exactly
  const isExactActive = pathname === href;

  // Get current filter from URL
  const currentFilter = searchParams.get("filter");

  // Special handling for expiry links
  const isExpiryList = pathname.startsWith("/expiry/list");

  // Determine if this is the main "Expiring" link
  const isMainExpiryLink = href === "/expiry/list";

  // Determine if this is a filtered expiry link
  const isFilteredExpiryLink =
    isExpiryList &&
    ((href.includes("filter=30") && currentFilter === "30") ||
      (href.includes("filter=15") && currentFilter === "15") ||
      (href.includes("filter=7") && currentFilter === "7") ||
      (href.includes("filter=expired") && currentFilter === "expired") ||
      (href.includes("filter=suspended") && currentFilter === "suspended"));

  // The main expiry link should only be active when no filter is applied
  const isMainExpiryActive = isMainExpiryLink && isExpiryList && !currentFilter;

  // Filtered expiry links should be active when their filter matches
  const isFilteredExpiryActive = isFilteredExpiryLink;

  // Other links follow normal active state rules
  const isRegularActive = isExactActive && !isExpiryList;

  // Combined active state
  const isActive =
    isMainExpiryActive ||
    isFilteredExpiryActive ||
    isRegularActive ||
    (isExpiryList &&
      ((isExpired && currentFilter === "expired") ||
        (is7Days && currentFilter === "7") ||
        (isSuspended && currentFilter === "suspended")));

  // Apply default styling if no custom className is provided
  const baseClasses = `mx-4 flex cursor-pointer items-center gap-4 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
    isActive ? "bg-sidebar-activebg dark:bg-gray-600" : ""
  } mt-1 justify-start px-4 py-2 ${noIcon ? "pl-14" : ""}`;

  const finalClassName = className
    ? `${baseClasses} ${className}`
    : baseClasses;

  return (
    <Link href={href} className="w-full">
      <div className={finalClassName}>
        {!noIcon && Icon && (
          <Icon
            className={`h-6 w-6 text-base text-sidebar-iconcolor ${
              isActive
                ? "text-sidebar-textact dark:text-gray-200"
                : "dark:text-gray-1000"
            }`}
          />
        )}
        <span
          className={`text-base font-medium ${
            isActive
              ? "text-sidebar-textact dark:text-gray-200"
              : "text-sidebar-activet dark:text-gray-1000"
          }`}
        >
          {label}
        </span>
        {count !== undefined && (
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-sm font-bold ${
              isExpired
                ? "text-red-700"
                : is30Days
                  ? "text-blue-700"
                  : is15Days
                    ? "text-yellow-700"
                    : is7Days
                      ? "text-orange-700"
                      : isSuspended
                        ? "text-gray-700"
                        : isNewClient
                          ? "text-green-700"
                          : "text-gray-700"
            }`}
          >
            {count}
          </span>
        )}
      </div>
    </Link>
  );
};
export default Sidebar;
