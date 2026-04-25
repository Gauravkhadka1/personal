"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import withRoleAuth from "../../hoc/withRoleAuth";
import { Toaster } from "@/components/ui/sonner";
import { DateRangePicker } from "@/components/Dashboard/DateRangePicker";
import { ProjectsCard } from "@/components/Dashboard/ProjectsCard";
import { TasksCard } from "@/components/Dashboard/TasksCard";
import { ExpiryCard } from "@/components/Dashboard/ExpiryCard";
import { ProspectsCard } from "@/components/Dashboard/ProspectsCard";
import NotesCard from "@/components/Dashboard/NotesCard";
import TodayUpdatesCard from "@/components/Dashboard/TodayUpdatesCard";
import OlderUpdatesCard from "@/components/Dashboard/OlderUpdatesCard";
import SalesNotesCard from "@/components/Dashboard/SalesNotesCard";
import ScheduleComponent from "@/components/ScheduleComponent";

import { Card } from "@/components/ui/card";
import {
  useGetMyTasksCountQuery,
  useGetAllTasksCountQuery,
  useGetUsersQuery,
  useGetClientCountsQuery,
  useGetProspectsQuery,
  useGetTasksByUserQuery,
  useGetUserDailyScheduleQuery,
} from "@/state/api";
import { DateRange } from "react-day-picker";
import { toZonedTime, format } from "date-fns-tz";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Add this import
import { useTodayUpdateSocket } from "@/hooks/useTodayUpdateSocket";

type Props = {
  params: { id: string };
};

const NEPAL_TIMEZONE = "Asia/Kathmandu";

const toNepalTime = (date: Date) => {
  return toZonedTime(date, NEPAL_TIMEZONE);
};

const Dashboard = ({ params }: Props) => {
  const { id } = params;
  const { user } = useAuth();
  const userId = user?.userId?.toString();
  useTodayUpdateSocket(userId);
  const isAdmin = user?.role === "ADMIN";
  const userRole = user?.role;

  const isAdminOrDesignerOrDeveloper =
    user?.role === "ADMIN" ||
    user?.role === "DESIGNER" ||
    user?.role === "DEVELOPER";

  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>({
    from: toNepalTime(new Date()),
    to: toNepalTime(new Date()),
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: toNepalTime(new Date()),
    to: toNepalTime(new Date()),
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Add schedule state - include selectedUserId for filtering
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    user?.userId ?? null
  );

  // Fetch data
  const { data: users } = useGetUsersQuery();
  const { data: clientCounts } = useGetClientCountsQuery();
  const { data: allTasksCount } = useGetAllTasksCountQuery();
  const { data: myTasksCount } = useGetMyTasksCountQuery();
  const { data: userTasks } = useGetTasksByUserQuery(userId || "");
  const { data: prospects } = useGetProspectsQuery({});

  // Update schedule query to use selectedUserId instead of hardcoded user?.userId
  const {
    data: scheduleData,
    isLoading: isLoadingSchedule,
    error: scheduleError,
  } = useGetUserDailyScheduleQuery(
    {
      userId: selectedUserId!,
      date: format(scheduleDate, "yyyy-MM-dd"),
    },
    {
      skip: !selectedUserId,
    }
  );

  const tasks = isAdmin ? allTasksCount : myTasksCount;

  const { data: allUsers = [] } = useGetUsersQuery();
  const currentUser = allUsers.find((u) => u.userId === user?.userId);

  const prospectStatusCounts = {
    New: prospects?.filter((prospect) => prospect.status === "New").length || 0,
    Dealing:
      prospects?.filter((prospect) => prospect.status === "Dealing").length ||
      0,
    QuoteSent:
      prospects?.filter((prospect) => prospect.status === "QuoteSent").length ||
      0,
    AgreementSent:
      prospects?.filter((prospect) => prospect.status === "AgreementSent")
        .length || 0,
  };

  const taskStatusCounts = isAdmin
    ? allTasksCount || {
        "To Do": 0,
        "Work In Progress": 0,
        QA: 0,
        Completed: 0,
      }
    : myTasksCount || {
        "To Do": 0,
        "Work In Progress": 0,
        QA: 0,
        Completed: 0,
      };

  // Handle tab change for user filtering
  const handleTabChange = (value: string) => {
    if (value === "my") {
      setSelectedUserId(user?.userId || null);
    } else {
      setSelectedUserId(Number(value));
    }
  };

  // Get current tab value
  const getCurrentTabValue = () => {
    if (selectedUserId === user?.userId) return "my";
    return selectedUserId?.toString() || "my";
  };

  // Filter out current user from usersData for tabs
  const otherUsers = users?.filter(
    (userData) => userData.userId !== user?.userId
  );

  return (
    <div className="m-4 mx-2 sm:mx-4 md:mx-6">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0">
        <Toaster />
      </div>

      {/* Top Row - Projects & Tasks in Flex */}
      <div className="flex flex-col gap-6 md:flex-row">
        {isAdmin ? (
          <>
            <ProjectsCard
              clientStatusCounts={
                clientCounts?.projectStatusCounts || {
                  New: 0,
                  Design: 0,
                  Development: 0,
                  "Content-Fillup": 0,
                  AMC: 0,
                  Completed: 0,
                }
              }
            />
            <TasksCard taskStatusCounts={taskStatusCounts} />
          </>
        ) : (
          <TasksCard taskStatusCounts={taskStatusCounts} fullWidth={true} />
        )}
      </div>

      {isAdmin && (
        /* Second Row - Expiry & Prospects in Flex */
        <div className="mt-4 flex flex-col gap-6 md:flex-row">
          <ExpiryCard
            expiringIn30Days={clientCounts?.expiringIn30Days || 0}
            expiringIn15Days={clientCounts?.expiringIn15Days || 0}
            expiringIn7Days={clientCounts?.expiringIn7Days || 0}
            expired={clientCounts?.expired || 0}
          />
          <ProspectsCard prospectStatusCounts={prospectStatusCounts} />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        <NotesCard isPublic={false} userRole={userRole} />
        
        {/* Public Notes - Hide for INTERN */}
        {userRole !== "DESIGNER" && <NotesCard isPublic={true} userRole={userRole} />}
      </div>

      {/* Add Schedule Component with user filter tabs */}
      {/* <div className="mt-6 rounded-xl mb-8">        
        <ScheduleComponent
          currentUser={user}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
          currentDate={scheduleDate}
          setCurrentDate={setScheduleDate}
          usersData={users}
          isLoadingUsers={false}
          scheduleData={scheduleData}
          isLoading={isLoadingSchedule}
          error={scheduleError}
          // compact={true}
        />
      </div> */}

    </div>
  );
};

export default withRoleAuth(Dashboard, [
  "ADMIN",
  "DESIGNER",
  "DEVELOPER",
  "INTERN",
]);