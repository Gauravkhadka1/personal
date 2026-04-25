"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import withRoleAuth from "../../hoc/withRoleAuth";
import { useGetUserDailyScheduleQuery, useGetUsersQuery } from "@/state/api";
import { format } from "date-fns";
import ScheduleComponent from "@/components/ScheduleComponent";


const DaySummaryPage = () => {
  const { user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    currentUser?.userId ?? null,
  );
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch users for the filter dropdown
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery();

  const {
    data: scheduleData,
    isLoading,
    error,
  } = useGetUserDailyScheduleQuery(
    {
      userId: selectedUserId!,
      date: format(currentDate, "yyyy-MM-dd"),
    },
    {
      skip: !selectedUserId,
    },
  );

  if (!currentUser) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border p-6">
          <div className="text-center text-muted-foreground">
            Please log in to view schedules.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="m-4 mx-2 sm:mx-4 md:mx-6">
 <ScheduleComponent
      currentUser={currentUser}
      selectedUserId={selectedUserId}
      setSelectedUserId={setSelectedUserId}
      currentDate={currentDate}
      setCurrentDate={setCurrentDate}
      usersData={usersData}
      isLoadingUsers={isLoadingUsers}
      scheduleData={scheduleData}
      isLoading={isLoading}
      error={error}
    />
    </div>
   
  );
};

export default withRoleAuth(DaySummaryPage, [
  "ADMIN",
  "DESIGNER",
  "DEVELOPER",
  "INTERN",
]);