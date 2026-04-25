"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetTaskReportQuery, useGetUsersQuery, TaskReportData } from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Calendar,
  ChevronDown,
  Download,
  FileText,
  Filter,
  RefreshCw,
  ThumbsUp,
  MessageCircle,
  Clock,
  Users,
  Briefcase,
  CheckCircle,
  User,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  CalendarDays,
  TrendingUp,
  Award,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

// Simple Card components since shadcn card might not be available
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">{children}</div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>{children}</h3>
);

const CardDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-gray-500 dark:text-gray-400">{children}</p>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);


// Helper function to format time
const formatTimeDisplay = (minutes: number): string => {
  if (!minutes) return "0h";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Combined Item Types
type CombinedItemType = 'task' | 'update';

interface CombinedItem {
  id: string;
  type: CombinedItemType;
  date: Date;
  formattedDate: string;
  data: any;
}

// Task Card Component
const TaskCard = memo(({ task, globalSearchQuery = "" }: { task: any; globalSearchQuery?: string }) => {
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-600/50"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const completedDate = new Date(task.completedAt);
  const formattedDate = format(completedDate, "MMM dd, yyyy");
  const formattedTime = format(completedDate, "h:mm a");

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-gray-700">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                Task Completed
              </Badge>
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority || "No Priority"}
              </Badge>
            </div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {highlightText(task.title, globalSearchQuery)}
            </h4>
            {task.description && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {task.client && (
              <span className="text-gray-500 dark:text-gray-400">
                {task.client.companyName || task.client.domainName}
              </span>
            )}
            {task.project && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {task.project.name}
                </span>
              </>
            )}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formattedDate}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Completed at {formattedTime}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
          
          
          <div className="flex items-center gap-3">
            {task.subtasksCount > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <CheckCircle className="h-3 w-3 text-blue-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {task.completedSubtasksCount}/{task.subtasksCount}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Subtasks completed</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {task.commentsCount > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <MessageCircle className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {task.commentsCount}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Comments</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {task.attachmentsCount > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <FileText className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {task.attachmentsCount}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Attachments</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {task.assignedUsers && task.assignedUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {task.assignedUsers.slice(0, 3).map((user: any) => (
                <Avatar key={user.id} className="h-6 w-6 border-2 border-white dark:border-gray-800">
                  <AvatarFallback className="bg-blue-500 text-[10px] text-white">
                    {(user.firstname?.[0] || user.username?.[0])?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {task.assignedUsers.length > 3 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  +{task.assignedUsers.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
TaskCard.displayName = "TaskCard";

// Update Card Component
const UpdateCard = memo(({ update }: { update: any }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${format(date, "h:mm a")}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM dd, yyyy 'at' h:mm a");
    }
  };

  return (
    <div className="rounded-lg bg-white p-4 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-blue-500 text-white">
            {(update.user.firstname?.[0] || update.user.username?.[0])?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  Daily Update
                </Badge>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {update.user.firstname} {update.user.lastname}
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  @{update.user.username}
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(update.createdAt)}
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {update.likes.length}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {update.content}
          </p>
          {update.replies.length > 0 && (
            <div className="mt-3">
              <button className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">
                View {update.replies.length} {update.replies.length === 1 ? "reply" : "replies"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
UpdateCard.displayName = "UpdateCard";

// Date Group Header Component
const DateGroupHeader = ({ date, taskCount, updateCount }: { date: Date; taskCount: number; updateCount: number }) => {
  const getDateLabel = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return format(date, "EEEE, MMMM dd, yyyy");
    }
  };

  return (
    <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm dark:bg-gray-800/95 py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {getDateLabel(date)}
          </h3>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {taskCount > 0 && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              {taskCount} task{taskCount !== 1 ? 's' : ''}
            </span>
          )}
          {updateCount > 0 && (
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <MessageCircle className="h-4 w-4" />
              {updateCount} update{updateCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const TaskReports = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { data: users = [] } = useGetUsersQuery();
  
  // Get filter values from URL or set defaults
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [dateFilterType, setDateFilterType] = useState<"today" | "range">("today");
  const [fromDate, setFromDate] = useState<Date | null>(new Date());
  const [toDate, setToDate] = useState<Date | null>(new Date());

  // Parse URL params on mount
  useEffect(() => {
    const urlUsername = searchParams.get("username");
    const urlFromDate = searchParams.get("fromDate");
    const urlToDate = searchParams.get("toDate");
    
    if (urlUsername) setSelectedUsername(urlUsername);
    if (urlFromDate && urlToDate) {
      setDateFilterType("range");
      setFromDate(new Date(urlFromDate));
      setToDate(new Date(urlToDate));
    }
  }, [searchParams]);

  // Build query parameters (no pagination params)
  const getQueryParams = () => {
    const params: any = {};
    
    if (selectedUsername) params.username = selectedUsername;
    
    if (dateFilterType === "range" && fromDate && toDate) {
      params.fromDate = format(fromDate, "yyyy-MM-dd");
      params.toDate = format(toDate, "yyyy-MM-dd");
    } else if (dateFilterType === "today") {
      const today = format(new Date(), "yyyy-MM-dd");
      params.fromDate = today;
      params.toDate = today;
    }
    
    return params;
  };

  const { data: reportData, isLoading, isError, refetch } = useGetTaskReportQuery(getQueryParams());

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (selectedUsername) params.set("username", selectedUsername);
    if (dateFilterType === "range" && fromDate && toDate) {
      params.set("fromDate", format(fromDate, "yyyy-MM-dd"));
      params.set("toDate", format(toDate, "yyyy-MM-dd"));
    } else if (dateFilterType === "today") {
      const today = format(new Date(), "yyyy-MM-dd");
      params.set("fromDate", today);
      params.set("toDate", today);
    }
    
    router.push(`/tasks/reports?${params.toString()}`);
    setTimeout(() => refetch(), 100);
  };

  const handleResetFilters = () => {
    setSelectedUsername("");
    setDateFilterType("today");
    setFromDate(new Date());
    setToDate(new Date());
    router.push("/tasks/reports");
    setTimeout(() => refetch(), 100);
  };

  const handleExportReport = () => {
    if (!reportData?.data) return;
    
    const exportData = {
      summary: reportData.data.summary,
      tasks: reportData.data.tasks,
      tasksByUser: reportData.data.tasksByUser,
      tasksByProject: reportData.data.tasksByProject,
      todayUpdates: reportData.data.todayUpdates,
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `task-report-${format(new Date(), "yyyy-MM-dd")}.json`;
    
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    
    toast.success("Report exported successfully!");
  };

  // Combine tasks and updates into a single list grouped by date
  const getCombinedAndGroupedItems = useCallback(() => {
    if (!reportData?.data) return [];
    
    const tasks = reportData.data.tasks || [];
    const updates = reportData.data.todayUpdates || [];
    
    const combinedItems: CombinedItem[] = [
      ...tasks.map(task => ({
        id: `task-${task.id}`,
        type: 'task' as const,
        date: new Date(task.completedAt),
        formattedDate: format(new Date(task.completedAt), "yyyy-MM-dd"),
        data: task
      })),
      ...updates.map(update => ({
        id: `update-${update.id}`,
        type: 'update' as const,
        date: new Date(update.createdAt),
        formattedDate: format(new Date(update.createdAt), "yyyy-MM-dd"),
        data: update
      }))
    ];
    
    // Sort by date (newest first)
    combinedItems.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Group by date
    const grouped = combinedItems.reduce((acc, item) => {
      const dateKey = item.formattedDate;
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: item.date,
          items: []
        };
      }
      acc[dateKey].items.push(item);
      return acc;
    }, {} as Record<string, { date: Date; items: CombinedItem[] }>);
    
    // Convert to array and sort by date (newest first)
    return Object.entries(grouped)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([dateKey, group]) => ({
        dateKey,
        date: group.date,
        items: group.items
      }));
  }, [reportData]);

  const groupedItems = getCombinedAndGroupedItems();
  
  // Calculate counts for display
  const totalTasks = reportData?.data?.tasks?.length || 0;
  const totalUpdates = reportData?.data?.todayUpdates?.length || 0;
  const totalItems = totalTasks + totalUpdates;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">Error Loading Report</h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                Failed to load task reports. Please try again later.
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const report = reportData?.data;

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <Header name="Task Reports" />
        
        {/* Filters Section */}
        <Card>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assigned To
                </label>
                <select
                  value={selectedUsername}
                  onChange={(e) => setSelectedUsername(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All Users</option>
                  {users.map((userItem: any) => {
                    const userName = userItem.username || `${userItem.firstname} ${userItem.lastname}`;
                    const isCurrentUser = user?.username === userItem.username;
                    return (
                      <option key={userItem.userId} value={userItem.username}>
                        {isCurrentUser ? `Me (${userName})` : userName}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <div className="flex flex-wrap gap-3 items-center">
                  <Button
                    variant={dateFilterType === "today" ? "default" : "outline"}
                    onClick={() => setDateFilterType("today")}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Today
                  </Button>
                  <Button
                    variant={dateFilterType === "range" ? "default" : "outline"}
                    onClick={() => setDateFilterType("range")}
                    className="flex items-center gap-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Date Range
                  </Button>
                  
                  {dateFilterType === "range" && (
                    <>
                      <DatePicker
                        selected={fromDate}
                        onChange={(date: Date | null) => setFromDate(date)}
                        selectsStart
                        startDate={fromDate || undefined}
                        endDate={toDate || undefined}
                        placeholderText="From Date"
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                      <span className="text-gray-500">to</span>
                      <DatePicker
                        selected={toDate}
                        onChange={(date: Date | null) => setToDate(date)}
                        selectsEnd
                        startDate={fromDate || undefined}
                        endDate={toDate || undefined}
                        minDate={fromDate || undefined}
                        placeholderText="To Date"
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                    </>
                  )}
                  <Button onClick={handleApplyFilters} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Apply Filters
                  </Button>
                  <Button variant="outline" onClick={handleResetFilters}>
                    Reset
                  </Button>
                </div>
              </div>
            </div>
            
          </CardContent>
        </Card>
        
        {/* Export Button */}
        {report?.tasks && report.tasks.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={handleExportReport} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        )}
        
        {/* Main Content - Combined Tasks and Updates Grouped by Date */}
        <Card>
          <CardContent>
            {groupedItems.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg dark:bg-gray-800/50">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No activity found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  No tasks or updates found for the selected filters.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {groupedItems.map((group) => {
                    const taskCount = group.items.filter(item => item.type === 'task').length;
                    const updateCount = group.items.filter(item => item.type === 'update').length;
                    
                    return (
                      <div key={group.dateKey} className="space-y-3">
                        <DateGroupHeader 
                          date={group.date} 
                          taskCount={taskCount} 
                          updateCount={updateCount} 
                        />
                        <div className="space-y-3 pl-2">
                          {group.items.map((item) => (
                            <div key={item.id}>
                              {item.type === 'task' ? (
                                <TaskCard task={item.data} />
                              ) : (
                                <UpdateCard update={item.data} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
        
        {/* Analytics Section */}
        {(report?.tasksByUser && report.tasksByUser.length > 0) || 
         (report?.tasksByProject && report.tasksByProject.length > 0) ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  Analytics
                </CardTitle>
              </div>
              <CardDescription>
                Performance metrics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Tasks by User */}
                {report?.tasksByUser && report.tasksByUser.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Tasks by User
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report.tasksByUser.map((userStats: any) => (
                        <Card key={userStats.userId}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-blue-500 text-white">
                                      {userStats.userName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {userStats.userName}
                                  </p>
                                </div>
                                <div className="mt-3 space-y-1">
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Tasks: <span className="font-semibold text-gray-900 dark:text-white">{userStats.taskCount}</span>
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Time Spent: <span className="font-semibold text-gray-900 dark:text-white">{formatTimeDisplay(userStats.totalTimeSpent)}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                                <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Tasks by Project */}
                {report?.tasksByProject && report.tasksByProject.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Tasks by Project
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {report.tasksByProject.map((projectStats: any) => (
                        <Card key={projectStats.projectId}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {projectStats.projectName}
                                </p>
                                <div className="mt-3 space-y-1">
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Tasks: <span className="font-semibold text-gray-900 dark:text-white">{projectStats.taskCount}</span>
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Time Spent: <span className="font-semibold text-gray-900 dark:text-white">{formatTimeDisplay(projectStats.totalTimeSpent)}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
                                <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </TooltipProvider>
  );
};

export default TaskReports;