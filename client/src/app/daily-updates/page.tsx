"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import withRoleAuth from "../../hoc/withRoleAuth";
import { Toaster } from "@/components/ui/sonner";
import { DateRangePicker } from "@/components/Dashboard/DateRangePicker";
import TodayUpdatesCard from "@/components/Dashboard/TodayUpdatesCard";
import OlderUpdatesCard from "@/components/Dashboard/OlderUpdatesCard";

import { Card } from "@/components/ui/card";
import { useGetUsersQuery } from "@/state/api";
import { DateRange } from "react-day-picker";
import { toZonedTime } from "date-fns-tz";

type Props = {
  params: { id: string };
};

const NEPAL_TIMEZONE = "Asia/Kathmandu";

const toNepalTime = (date: Date) => {
  return toZonedTime(date, NEPAL_TIMEZONE);
};

const TodayUpdates = ({ params }: Props) => {
  const { id } = params;
  const { user } = useAuth();
  const userId = user?.userId?.toString();
  const isAdmin = user?.role === "ADMIN";

  // Fetch data
  const { data: users } = useGetUsersQuery();
  const { data: allUsers = [] } = useGetUsersQuery();
  const currentUser = allUsers.find((u) => u.userId === user?.userId);
  const [activeTab, setActiveTab] = useState("today-updates");

  return (
    <div className="m-4 mx-2 sm:mx-4 md:mx-6">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0">
        <Toaster />
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Daily Updates</h2>

      {/* Tabs */}
      <div className="border-b border-gray-200 pr-8 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            {
              id: "today-updates",
              label: "Today Updates",
            },
            {
              id: "older-updates",
              label: "Older Updates",
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
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-2 flex items-start justify-between gap-4">
        {activeTab === "today-updates" && <TodayUpdatesCard />}
        {activeTab === "older-updates" && <OlderUpdatesCard />}
      </div>
    </div>
  );
};

export default withRoleAuth(TodayUpdates, ["ADMIN", "DESIGNER", "DEVELOPER"]);
