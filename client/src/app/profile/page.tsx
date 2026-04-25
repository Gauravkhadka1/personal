"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import withAuth from "../../hoc/withAuth";
import {
  useDeleteUserMutation,
  useChangePasswordMutation,
  useGetUsersQuery,
  useGetUserActivityLogsQuery,
  useGetUserCommentsQuery,
  useGetTasksByUserQuery,
} from "@/state/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import toast from "react-hot-toast";
import {
  Pencil,
  Check,
  X,
  Mail,
  Phone,
  Activity,
  MessageSquareText,
  ListTodo,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import MyTasksBoardView from "@/components/MyTasks/MyTasksBoardView";
import CreateTask from "@/components/Task/CreateTask";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";

const ProfilePage = () => {
  const { user: authUser, logout } = useAuth();
  const [deleteUser] = useDeleteUserMutation();
  const [isEditing, setIsEditing] = useState(false);
  const { data: users } = useGetUsersQuery();
  const currentUser = users?.find((u) => u.email === authUser?.email);

  // Fetch user activities - only if currentUser exists
  const { data: activities, isLoading: activitiesLoading } =
    useGetUserActivityLogsQuery(currentUser?.userId ?? 0, {
      skip: !currentUser?.userId,
    });

  // Fetch user comments - only if currentUser exists
  const { data: comments, isLoading: commentsLoading } =
    useGetUserCommentsQuery(currentUser?.userId ?? 0, {
      skip: !currentUser?.userId,
    });

  // Fetch user tasks - only if currentUser exists

  const {
    data: tasks,
    isLoading: tasksLoading,
    error: tasksError,
  } = useGetTasksByUserQuery(
    {
      userId: currentUser?.userId ?? 0,
      search: "",
      page: 1,
      limit: 100,
    },
    {
      skip: !currentUser?.userId,
    },
  );

  const [activeTab, setActiveTab] = useState("tasks");
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const [profileData, setProfileData] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    phone: "",
    birthday: "",
    joinedAt: "",
    profilePictureUrl: "",
  });

  // State for change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState("");
  const [isUploaded, setIsUploaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Add this utility function at the top of your file
  const calculateTimeDifference = (
    dateString: string,
    isBirthday: boolean = false,
  ) => {
    const now = new Date();
    const targetDate = new Date(dateString);

    if (isBirthday) {
      // For birthday, calculate days until next occurrence
      const currentYear = now.getFullYear();
      targetDate.setFullYear(currentYear);

      // If birthday already passed this year, set to next year
      if (targetDate < now) {
        targetDate.setFullYear(currentYear + 1);
      }

      const diff = targetDate.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return ` (${days} day${days !== 1 ? "s" : ""} left)`;
    } else {
      // For joined date, show time since in years, months, and days
      const diff = now.getTime() - targetDate.getTime();
      const daysTotal = Math.floor(diff / (1000 * 60 * 60 * 24));

      const years = Math.floor(daysTotal / 365);
      const remainingDays = daysTotal % 365;
      const months = Math.floor(remainingDays / 30);
      const days = remainingDays % 30;

      let result = " (";
      if (years > 0) result += `${years} year${years !== 1 ? "s" : ""}`;
      if (months > 0) {
        if (years > 0) result += ", ";
        result += `${months} month${months !== 1 ? "s" : ""}`;
      }
      if (days > 0 || (years === 0 && months === 0)) {
        if (years > 0 || months > 0) result += ", ";
        result += `${days} day${days !== 1 ? "s" : ""}`;
      }
      result += " ago)";

      return result;
    }
  };

  // Update the TimeDifference component
  const TimeDifference = ({
    dateString,
    isBirthday = false,
  }: {
    dateString: string;
    isBirthday?: boolean;
  }) => {
    const [timeDiff, setTimeDiff] = useState(
      calculateTimeDifference(dateString, isBirthday),
    );

    useEffect(() => {
      const interval = setInterval(() => {
        setTimeDiff(calculateTimeDifference(dateString, isBirthday));
      }, 86400000); // Update once per day (for birthday countdown)

      return () => clearInterval(interval);
    }, [dateString, isBirthday]);

    return (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {timeDiff}
      </span>
    );
  };

  const TimeCountDisplay = ({ dateString }: { dateString: string }) => {
    const [timeParts, setTimeParts] = useState({
      years: "00",
      months: "00",
      days: "00",
      hours: "00",
      minutes: "00",
      seconds: "00",
    });

    useEffect(() => {
      const calculateTime = () => {
        const now = new Date();
        const past = new Date(dateString);
        const diff = now.getTime() - past.getTime();

        const seconds = Math.floor(diff / 1000) % 60;
        const minutes = Math.floor(diff / (1000 * 60)) % 60;
        const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24)) % 30;
        const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30)) % 12;
        const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));

        setTimeParts({
          years: years.toString().padStart(2, "0"),
          months: months.toString().padStart(2, "0"),
          days: days.toString().padStart(2, "0"),
          hours: hours.toString().padStart(2, "0"),
          minutes: minutes.toString().padStart(2, "0"),
          seconds: seconds.toString().padStart(2, "0"),
        });
      };

      calculateTime();
      const interval = setInterval(calculateTime, 1000);

      return () => clearInterval(interval);
    }, [dateString]);

    return (
      <div className="flex flex-col items-center">
        <div className="flex gap-4 text-center">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{timeParts.years}</span>
            <span className="text-xs uppercase text-gray-500">Years</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{timeParts.months}</span>
            <span className="text-xs uppercase text-gray-500">Months</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{timeParts.days}</span>
            <span className="text-xs uppercase text-gray-500">Days</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{timeParts.hours}</span>
            <span className="text-xs uppercase text-gray-500">Hours</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{timeParts.minutes}</span>
            <span className="text-xs uppercase text-gray-500">Minutes</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">{timeParts.seconds}</span>
            <span className="text-xs uppercase text-gray-500">Seconds</span>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">ago</div>
      </div>
    );
  };

  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        firstname: currentUser.firstname || "",
        lastname: currentUser.lastname || "",
        username: currentUser.username || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        birthday: currentUser.birthday || "",
        joinedAt: currentUser.joinedAt || "",
        profilePictureUrl: currentUser.profilePictureUrl || "",
      });
      if (currentUser.profilePictureUrl) {
        setPreviewImage(buildImageUrl(currentUser.profilePictureUrl));
      }
    }
  }, [currentUser]);

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${baseUrl}${cleanPath}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a JPG, PNG, or GIF image");
        return;
      }
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser?.userId) return;
    const formData = new FormData();
    formData.append("profilePicture", selectedFile);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}users/${currentUser.userId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        },
      );

      if (!response.ok) throw new Error("Failed to upload profile picture");
      const data = await response.json();
      setProfileData((prev) => ({
        ...prev,
        profilePictureUrl: data.profilePictureUrl,
      }));
      setIsUploaded(true);
      toast.success("Profile Picture updated successfully!");
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error("Failed to upload profile picture!");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.userId) {
      toast.error("User ID not found");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      await changePassword({
        userId: currentUser.userId, // Now guaranteed to exist
        currentPassword,
        newPassword,
      }).unwrap();
      setPasswordSuccess("Password changed successfully.");
      setPasswordError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePasswordForm(false);
      toast.success("Password changed successfully");
    } catch (error: any) {
      setPasswordError(error.data?.message || "Failed to change password.");
      setPasswordSuccess("");
      toast.error("Failed to change the password!");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    // First try to parse the date as-is
    let date = new Date(dateString);

    // If that fails (invalid date), try to fix the format
    if (isNaN(date.getTime())) {
      // Handle the specific format you're seeing: "2025-06-02 22:14:55.000"
      const fixedDateString = dateString.replace(" ", "T") + "Z";
      date = new Date(fixedDateString);

      // If still invalid, return the original string
      if (isNaN(date.getTime())) {
        return dateString;
      }
    }

    return format(date, "MMM dd, yyyy hh:mm a");
  };

  if (!currentUser) {
    return (
      <div className="flex w-full flex-col p-8 dark:text-gray-300">
        <div className="mb-4">
          <Header name="My Profile" />
        </div>
        <div>Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col p-8 dark:text-gray-300">
      <div className="mb-4">
        <Header name="My Profile" />
      </div>

      <div className="flex-col">
        {/* User Profile Card */}
        <Card className="mb-8 flex items-center dark:bg-dark-secondary">
          <CardHeader className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <div className="group relative">
                <Avatar className="mb-4 h-24 w-24">
                  {previewImage && !imageError ? (
                    <AvatarImage
                      src={previewImage}
                      onError={() => setImageError(true)}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {currentUser.firstname?.charAt(0)}
                      {currentUser.lastname?.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <label
                  htmlFor="profile-picture"
                  className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-primary p-2 text-white transition-colors hover:bg-primary/90"
                >
                  <Pencil className="h-4 w-4 dark:text-gray-600" />
                  <input
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {selectedFile && !isUploaded && (
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={!selectedFile}
                  >
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewImage(currentUser.profilePictureUrl || "");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <div className="text-start">
                <h2 className="text-xl font-semibold dark:text-gray-200">
                  {currentUser.firstname} {currentUser.lastname}
                </h2>
                <p className="capitalize text-gray-500 dark:text-gray-400">
                  {currentUser.role.toLowerCase()}
                </p>
                <div className="mt-2 flex gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setShowChangePasswordForm(!showChangePasswordForm)
                    }
                  >
                    {showChangePasswordForm ? "Cancel" : "Change Password"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Change Password Form */}
        {showChangePasswordForm && (
          <Card className="mb-8 dark:bg-dark-secondary">
            <CardHeader>
              <h3 className="text-lg font-semibold">Change Password</h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {passwordError && (
                  <p className="text-sm font-medium text-destructive">
                    {passwordError}
                  </p>
                )}
                {passwordSuccess && (
                  <p className="text-sm font-medium text-green-600">
                    {passwordSuccess}
                  </p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? "Changing..." : "Change Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Activity Tabs */}
        <div className="space-y-6 lg:col-span-2">
          <Tabs
            defaultValue="tasks"
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
                <Activity className="mr-2 h-6 w-4 text-gray-400 dark:text-gray-300" />
                Activity
              </TabsTrigger>
              {/* <TabsTrigger value="comments">
                <MessageSquareText className="mr-2 h-6 w-4 text-gray-400 dark:text-gray-300" />
                Comments
              </TabsTrigger> */}
              <TabsTrigger value="profile">
                <Pencil className="mr-2 h-6 w-4 text-gray-400 dark:text-gray-300" />
                Edit Profile
              </TabsTrigger>
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
                {currentUser && currentUser.userId ? (
                  <>
                    <CreateTask
                      isOpen={isCreateTaskOpen}
                      onClose={() => setIsCreateTaskOpen(false)}
                      id={currentUser.userId.toString()}
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
                      <MyTasksBoardView
                        id={currentUser.userId.toString()}
                        setIsCreateTask={setIsCreateTaskOpen}
                        activeTab="Board"
                        setActiveTab={() => {}}
                      />
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    User data not available
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="profile">
              <Card className="dark:bg-dark-secondary">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Edit Profile</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstname">First Name</Label>
                      <Input
                        id="firstname"
                        name="firstname"
                        value={profileData.firstname}
                        // onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastname">Last Name</Label>
                      <Input
                        id="lastname"
                        name="lastname"
                        value={profileData.lastname}
                        // onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <p className="font-medium">{profileData.username}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <p className="font-medium">{profileData.email}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        // onChange={handleInputChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthday">Birthday</Label>
                      <div className="font-medium">
                        {profileData.birthday ? (
                          <>
                            {profileData.birthday.split("T")[0]}
                            {profileData.birthday && (
                              <TimeDifference
                                dateString={profileData.birthday}
                                isBirthday
                              />
                            )}
                          </>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="joinedAt">Joined At</Label>
                      <div className="font-medium">
                        {profileData.joinedAt ? (
                          <>
                            {profileData.joinedAt.split("T")[0]}
                            {profileData.joinedAt && (
                              <TimeDifference
                                dateString={profileData.joinedAt}
                                isBirthday={false}
                              />
                            )}
                          </>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                {/* <CardFooter className="flex justify-end">
                  <Button onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? "Save Changes" : "Edit Profile"}
                  </Button>
                </CardFooter> */}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default withAuth(ProfilePage);
