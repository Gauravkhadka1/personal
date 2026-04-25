"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { User, ScheduleData } from "@/state/api";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TodayUpdates from "../TodayUpdates";
import { useAuth } from "../../context/AuthContext";

interface ScheduleComponentProps {
  currentUser: any;
  selectedUserId: number | null;
  setSelectedUserId: (id: number | null) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  usersData: User[] | undefined;
  isLoadingUsers: boolean;
  scheduleData: ScheduleData | undefined;
  isLoading: boolean;
  error: any;
}

const ScheduleComponent: React.FC<ScheduleComponentProps> = ({
  currentUser,
  selectedUserId,
  setSelectedUserId,
  currentDate,
  setCurrentDate,
  usersData,
  isLoadingUsers,
  scheduleData,
  isLoading,
  error,
}) => {
  const typedScheduleData = scheduleData;

  const getSelectedUserName = () => {
    if (selectedUserId === currentUser?.userId) return "My Day Summary";

    const selectedUser = usersData?.find((u) => u.userId === selectedUserId);
    if (selectedUser) {
      return `${selectedUser.firstname} ${selectedUser.lastname}'s Day Summary`;
    }

    return "Select User";
  };

  // Calculate total time spent across all time slots
  const totalTimeSpent = typedScheduleData?.dailySummary
    ? typedScheduleData.dailySummary.totalTimeSpent
    : 0;

  // Handle tab change
  const handleTabChange = (value: string) => {
    if (value === "my") {
      setSelectedUserId(currentUser?.userId || null);
    } else {
      setSelectedUserId(Number(value));
    }
  };

  // Get current tab value
  const getCurrentTabValue = () => {
    if (selectedUserId === currentUser?.userId) return "my";
    return selectedUserId?.toString() || "my";
  };

  // Filter out current user from usersData for tabs
  const otherUsers = usersData?.filter(
    (user) => user.userId !== currentUser?.userId,
  );
    const { user, loading } = useAuth();

  const isAdminOrDesignerOrDeveloper =
    user?.role === "ADMIN" ||
    user?.role === "DESIGNER" ||
    user?.role === "DEVELOPER";
    user?.role === "INTERN";

  return (
    <div className="container flex items-start justify-between gap-4 space-y-6 dark:bg-secondary border dark:border-secondary rounded-xl">
      <div className="w-[70%]">
        {/* Schedule Table */}
        <Card className="w-full dark:bg-secondary">
          <CardHeader>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center dark:bg-secondary">
              <CardTitle className="text-xl font-bold dark:text-gray-300">
                {getSelectedUserName()} - {format(currentDate, "PPPP")}
              </CardTitle>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row dark:bg-secondary">
                {/* Date Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal sm:w-[240px] dark:bg-secondary border dark:border-gray-700",
                        !currentDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentDate ? (
                        format(currentDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={currentDate}
                      onSelect={(date) => date && setCurrentDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* User Tabs Filter */}
            <div className="pt-4 dark:bg-secondary">
              {isAdminOrDesignerOrDeveloper && (
                <Tabs
                  value={getCurrentTabValue()}
                  onValueChange={handleTabChange}
                  className="w-full"
                >
                  <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted/50 p-1 ">
                    <TabsTrigger value="my" className="px-3 py-2 text-sm">
                      My Day Summary
                    </TabsTrigger>
                    {otherUsers?.map((user: User) => (
                      <TabsTrigger
                        key={user.userId}
                        value={user.userId?.toString() || ""}
                        className="px-3 py-2 text-sm"
                      >
                        {user.firstname}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-destructive">
                Error loading Day Summary. Please try again.
              </div>
            ) : typedScheduleData?.schedule &&
              typedScheduleData.schedule.length > 0 ? (
              <div className="rounded-md border dark:bg-secondary">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px] dark:text-gray-300">Time Slot</TableHead>
                      <TableHead className="w-[120px] dark:text-gray-300">Time Spent</TableHead>
                      <TableHead className="dark:text-gray-300">Task Title</TableHead>
                      <TableHead className="dark:text-gray-300">Project</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="">
                    {typedScheduleData.schedule.map((slot, slotIndex) => {
                      const hasTasks = slot.tasks && slot.tasks.length > 0;

                      // If no tasks, show a single row
                      if (!hasTasks) {
                        return (
                          <TableRow key={slotIndex}>
                            <TableCell className="font-medium dark:text-gray-400">
                              {slot.timeFrame}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  slot.timeSpent > 0
                                    ? "bg-green-100 text-green-800 dark:bg-secondary dark:text-green-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-secondary dark:text-gray-400"
                                }`}
                              >
                                {slot.timeSpentHuman || "0s"}
                              </span>
                            </TableCell>
                            <TableCell colSpan={2}>
                              <span className="italic text-muted-foreground">
                                No tasks
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      // If there are tasks, show multiple rows for the same time slot with individual time spent
                      return slot.tasks.map((task, taskIndex) => (
                        <TableRow
                          key={`${slotIndex}-${taskIndex}`}
                          className={slot.timeSpent > 0 ? "bg-muted/50" : ""}
                        >
                          {taskIndex === 0 ? (
                            <TableCell
                              className="font-medium dark:text-gray-400"
                              rowSpan={slot.tasks.length}
                            >
                              {slot.timeFrame}
                            </TableCell>
                          ) : null}
                          <TableCell>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-medium ${
                                task.timeSpent > 0
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              {task.timeSpentHuman}
                            </span>
                          </TableCell>
                          <TableCell>
                            {task.title === "No tasks" ? (
                              <span className="italic text-muted-foreground ">
                                {task.title}
                              </span>
                            ) : (
                              task.title
                            )}
                          </TableCell>
                          <TableCell>
                            {task.clientDomainName === "No client" ? (
                              <span className="italic text-muted-foreground">
                                {task.clientDomainName}
                              </span>
                            ) : (
                              <span className="font-medium">
                                {task.clientDomainName}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ));
                    })}

                    {/* Total Row */}
                    {totalTimeSpent > 0 && (
                      <TableRow className="bg-primary/10 font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell>
                          <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                            {typedScheduleData?.dailySummary?.totalTimeHuman}
                          </span>
                        </TableCell>
                        <TableCell colSpan={2}>
                          {typedScheduleData?.dailySummary?.totalTasks} tasks
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No Day Summary data available for {format(currentDate, "PPPP")}.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Breakdown Section */}
        {typedScheduleData?.dailySummary &&
          typedScheduleData.dailySummary.tasks.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  Task Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Title</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead className="text-right">Time Spent</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typedScheduleData.dailySummary.tasks.map((task, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {task.title}
                        </TableCell>
                        <TableCell>
                          {task.clientDomainName === "No client" ? (
                            <span className="italic text-muted-foreground">
                              {task.clientDomainName}
                            </span>
                          ) : (
                            <span className="font-medium">
                              {task.clientDomainName}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                            {task.timeSpentHuman}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              task.status === "Completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : task.status === "Work In Progress"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  : task.status === "QA"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {task.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right">
                        <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                          {typedScheduleData.dailySummary.totalTimeHuman}
                        </span>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
      </div>
      <div className="w-[30%] mr-6">
        {/* Today Updates Section - Add this at the bottom */}
        <TodayUpdates
          selectedUserId={selectedUserId}
          currentDate={currentDate}
          currentUser={currentUser}
          usersData={usersData}
        />
      </div>
    </div>
  );
};

export default ScheduleComponent;
