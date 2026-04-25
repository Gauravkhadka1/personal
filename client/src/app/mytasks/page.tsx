"use client";

import React, { useState } from "react";
import MyTasksBoardView from "@/components/MyTasks/MyTasksBoardView";
import CreateTask from "@/components/Task/CreateTask";
import { useAuth } from "../../context/AuthContext";
import { useGetTasksByUserQuery, Priority  } from "@/state/api";
import MyTasksCalendarView from "@/components/MyTasks/MyTasksCalendarView";
import withAuth from "../../hoc/withAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useTaskSocket } from "@/hooks/useTaskSocket"; 


type Props = {
  params: { id: string };
};

const MyTasks = ({ params }: Props) => {
  const { id } = params;
  const [activeTab, setActiveTab] = useState("Board");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const { user } = useAuth();
  const userId = user?.userId?.toString();
    useTaskSocket(userId);
  const { 
    data: tasks, 
    isLoading, 
    error 
  } = useGetTasksByUserQuery(userId, {
    skip: !userId
  });

  // Skeleton Start 
  if (!user || isLoading) return (
    <div className="p-4 space-y-4">
      {/* Board View Skeleton */}
      {activeTab === "Board" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="space-y-2 rounded-lg border p-4">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <Skeleton className="h-4 w-4 rounded-full" />
                    </div>
                    <div className="flex justify-between pt-2">
                      <Skeleton className="h-4 w-[60px]" />
                      <Skeleton className="h-4 w-[60px]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar View Skeleton */}
      {activeTab === "Calendar" && (
        <Skeleton className="h-[70vh] w-full rounded-lg" />
      )}
    </div>
  );
// Skeleton End
  return (
    <div className="dark:bg-primary-dark h-[100%]">
      <CreateTask
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        id={id}
      />

      {/* Render the appropriate view based on the active tab */}
      {activeTab === "Calendar" ? (
        <MyTasksCalendarView activeTab={activeTab} setActiveTab={setActiveTab} />
      ) : (
        <MyTasksBoardView
          id={id} 
         setIsCreateTask={setIsCreateTaskOpen} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
        />
      )}
    </div>
  );
};

export default withAuth(MyTasks);