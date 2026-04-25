"use client";
import {
  useGetUsersQuery,
  useGetUserActivityLogsQuery,
  useGetUserCommentsQuery,
  useGetTasksByUserQuery,
} from "@/state/api";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import Header from "@/components/Header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Activity,
  MessageSquareText,
  ListTodo,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import UserTaskBoardView from "@/components/UserTaskBoardView";
import CreateTask from "@/components/Task/CreateTask";
import { Skeleton } from "@/components/ui/skeleton";

const UserDetailPage = () => {
  const params = useParams();
  const userId = Number(params.id.toString().replace("user-", ""));
  const { data: users, isLoading, isError } = useGetUsersQuery();

  // Fetch user activities
  const { data: activities, isLoading: activitiesLoading } =
    useGetUserActivityLogsQuery(userId);

  // Fetch user comments
  const { data: comments, isLoading: commentsLoading } =
    useGetUserCommentsQuery(userId);

  // Fetch user tasks
  const {
    data: tasks,
    isLoading: tasksLoading,
    error: tasksError,
  } = useGetTasksByUserQuery({
    userId: userId,
    page: 1, // Add default pagination values
    limit: 10, // Add default pagination values
  });

  const [activeTab, setActiveTab] = useState("tasks");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const user = users?.find((u) => u.userId === userId);

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching user data</div>;
  if (!user) return <div>User not found</div>;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy hh:mm a");
  };

  return (
    <div className="flex w-full flex-col p-8 dark:text-gray-300">
      <div className="mb-4">
        <Header name="User Details" />
      </div>

      <div className="flex-col">
        {/* User Profile Card */}
        <Card className="mb-8 flex items-center dark:bg-dark-secondary">
          <CardHeader className="flex items-center pb-4">
            <div className="flex items-center gap-2">
              <div>
                <Avatar className="mb-4 h-24 w-24">
                  {user.profilePictureUrl ? (
                    <AvatarImage
                      src={buildImageUrl(user.profilePictureUrl)}
                      alt={`${user.firstname} ${user.lastname}`}
                    />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {user.firstname?.charAt(0)}
                      {user.lastname?.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>

              <div className="text-start">
                <h2 className="text-xl font-semibold dark:text-gray-200">
                  {user.firstname} {user.lastname}
                </h2>
                <p className="capitalize text-gray-500 dark:text-gray-400">
                  {user.role.toLowerCase()}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Activity Tabs */}
        <div className="space-y-6 lg:col-span-2">
          <Tabs
            defaultValue="activity"
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="flex items-center justify-start">
              <TabsTrigger value="tasks">
                <ListTodo className="mr-2 h-6 w-4 text-gray-400 dark:text-gray-300" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="mr-2 h-6 w-4 text-gray-400 dark:text-gray-300" />{" "}
                Activity
              </TabsTrigger>
              {/* <TabsTrigger value="comments">
                <MessageSquareText className="mr-2 h-6 w-4 text-gray-400 dark:text-gray-300" />
                Comments
              </TabsTrigger> */}
            </TabsList>

            <TabsContent value="activity">
              <Card className="dark:bg-dark-secondary">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Activity</h3>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      Loading activities...
                    </div>
                  ) : activities?.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No recent activity
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities?.map((activity) => (
                        <div
                          key={activity.id}
                          className="border-b border-gray-200 pb-4 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{activity.action}</p>
                              {activity.details && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {activity.details}
                                </p>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card className="dark:bg-dark-secondary">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Comments</h3>
                </CardHeader>
                <CardContent>
                  {commentsLoading ? (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      Loading comments...
                    </div>
                  ) : comments?.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No recent comments
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments?.map((comment) => (
                        <div
                          key={comment.id}
                          className="border-b border-gray-200 pb-4 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{comment.content}</p>
                              {comment.taskId && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  On task: {comment.taskId}
                                </p>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks">
              <div className="h-[100%] dark:bg-primary-dark">
                <CreateTask
                  isOpen={isCreateTaskOpen}
                  onClose={() => setIsCreateTaskOpen(false)}
                  id={userId.toString()}
                />

                {tasksLoading ? (
                  <div className="space-y-4 p-4">
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
                              <div
                                key={j}
                                className="space-y-2 rounded-lg border p-4"
                              >
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
                  </div>
                ) : (
                  <UserTaskBoardView
                    userId={userId}
                    setIsCreateTaskOpen={setIsCreateTaskOpen}
                    activeTab={"Board"}
                    setActiveTab={() => {}}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
