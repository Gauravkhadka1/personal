import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ThumbsUp,
  MessageSquare,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow, isSameDay, subDays } from "date-fns";
import { toZonedTime, format } from "date-fns-tz";
import {
  useGetTodayUpdatesQuery,
  useGetUserTodayUpdatesQuery,
} from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Select from "react-select";
import { useGetUsersQuery } from "@/state/api";
import { Like, Reply } from "@/state/api";
import { UserStatus } from "@/components/UserStatus";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const OlderUpdatesCard = () => {
  const { user } = useAuth();
  const userId = user?.userId;
  const isAdmin = user?.role === "ADMIN";
  const isAdminOrDesignerOrDeveloper =
    user?.role === "ADMIN" ||
    user?.role === "DESIGNER" ||
    user?.role === "DEVELOPER";
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(
    null,
  );
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [currentLikes, setCurrentLikes] = useState<Like[]>([]);
  const [showReplies, setShowReplies] = useState<Record<number, boolean>>({});
  const { data: users } = useGetUsersQuery();
  const { data: allUpdates } = useGetTodayUpdatesQuery();
  const { data: userUpdates } = useGetUserTodayUpdatesQuery(userId);

  const nepalTimeZone = "Asia/Kathmandu";

const renderContentWithLinks = (content: string) => {
  if (content.startsWith('<')) {
    return (
      <div 
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }} 
      />
    );
  }
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return content.split(urlRegex).map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};
  // Filter updates before today in Nepal time
  const isBeforeTodayInNepal = (date: string) => {
    const updateDate = toZonedTime(new Date(date), nepalTimeZone);
    const today = toZonedTime(new Date(), nepalTimeZone);
    return !isSameDay(updateDate, today);
  };

  // Group updates by date
  const groupUpdatesByDate = (updates: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    updates?.forEach((update) => {
      const updateDate = toZonedTime(new Date(update.createdAt), nepalTimeZone);
      const today = toZonedTime(new Date(), nepalTimeZone);
      let groupKey;

      if (isSameDay(updateDate, subDays(today, 1))) {
        groupKey = "Yesterday";
      } else {
        groupKey = format(updateDate, "EEEE, MMMM d");
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(update);
    });
    return grouped;
  };

  // Select updates based on user role
  // Replace the existing updates filtering logic
  let updates = isAdminOrDesignerOrDeveloper ? allUpdates : userUpdates;
  updates = updates?.filter((update) => isBeforeTodayInNepal(update.createdAt));
  if (isAdminOrDesignerOrDeveloper && selectedUserFilter) {
    updates = updates?.filter(
      (update) => update.userId.toString() === selectedUserFilter,
    );
  } else if (!isAdmin && isAdminOrDesignerOrDeveloper) {
    updates = updates?.filter(
      (update) => ![11, 24, 30].includes(update.userId),
    );
  }

  const groupedUpdates = groupUpdatesByDate(updates || []);

  const toggleReplies = (updateId: number) => {
    setShowReplies((prev) => ({ ...prev, [updateId]: !prev[updateId] }));
  };

  const showLikes = (likes: Like[]) => {
    setCurrentLikes(likes);
    setLikesDialogOpen(true);
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
    <Card className="w-full border border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-secondary-dark">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-8">
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold dark:text-gray-300">
            {isAdmin ? "Older Updates" : "Older Updates"}
          </CardTitle>
          {isAdminOrDesignerOrDeveloper ? (
            <div className="flex justify-end">
              <Select
                className="w-64 text-sm"
                options={[
                  { value: null, label: "All Team Members" },
                  ...(users
                    ?.filter(
                      (user) =>
                        isAdmin
                          ? user.userId !== undefined // ADMIN sees all users
                          : user.userId !== undefined &&
                            ["DESIGNER", "DEVELOPER"].includes(user.role) &&
                            ![11, 24, 26, 30].includes(user.userId), // DESIGNER/DEVELOPER exclude specific IDs
                    )
                    .map((user) => ({
                      value: user.userId!.toString(),
                      label:
                        user.username || `${user.firstname} ${user.lastname}`,
                      image: user.profilePictureUrl,
                    })) || []),
                ]}
                value={
                  selectedUserFilter
                    ? {
                        value: selectedUserFilter,
                        label:
                          users?.find(
                            (u) => u.userId?.toString() === selectedUserFilter,
                          )?.username ||
                          `${users?.find((u) => u.userId?.toString() === selectedUserFilter)?.firstname || ""} ${
                            users?.find(
                              (u) =>
                                u.userId?.toString() === selectedUserFilter,
                            )?.lastname || ""
                          }`.trim(),
                        image: users?.find(
                          (u) => u.userId?.toString() === selectedUserFilter,
                        )?.profilePictureUrl,
                      }
                    : { value: null, label: "Filter by user" }
                }
                onChange={(selectedOption) => {
                  setSelectedUserFilter(selectedOption?.value || null);
                }}
                isSearchable
                placeholder="Filter by user..."
                formatOptionLabel={(user) => (
                  <div className="flex items-center gap-2">
                    {user.value && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={
                            user.image ? buildImageUrl(user.image) : undefined
                          }
                        />
                        <AvatarFallback>
                          {user.label
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="dark:text-gray-300">{user.label}</span>
                  </div>
                )}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: "36px",
                    height: "36px",
                    backgroundColor: "hsl(var(--background))",
                    borderColor: state.isFocused
                      ? "hsl(var(--ring))"
                      : "hsl(var(--border))",
                    boxShadow: state.isFocused
                      ? "0 0 0 1px hsl(var(--ring))"
                      : "none",
                    "&:hover": {
                      borderColor: "hsl(var(--ring))",
                    },
                  }),
                  input: (base) => ({
                    ...base,
                    color: "hsl(var(--foreground))",
                    margin: "0px",
                    paddingBottom: "0px",
                    paddingTop: "0px",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "hsl(var(--muted-foreground))",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "hsl(var(--foreground))",
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    padding: "4px",
                    color: "hsl(var(--muted-foreground))",
                    "&:hover": {
                      color: "hsl(var(--foreground))",
                    },
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    padding: "4px",
                    color: "hsl(var(--muted-foreground))",
                    "&:hover": {
                      color: "hsl(var(--foreground))",
                    },
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: "0px 8px",
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                  }),
                  option: (base, state) => ({
                    ...base,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: state.isSelected
                      ? "hsl(var(--accent))"
                      : state.isFocused
                        ? "hsl(var(--accent))"
                        : "transparent",
                    color: state.isSelected
                      ? "hsl(var(--accent-foreground))"
                      : "hsl(var(--foreground))",
                    "&:active": {
                      backgroundColor: "hsl(var(--accent))",
                    },
                  }),
                  indicatorSeparator: (base) => ({
                    ...base,
                    backgroundColor: "hsl(var(--border))",
                  }),
                }}
                classNames={{
                  control: ({ isFocused }) =>
                    `dark:bg-secondary-dark dark:border-gray-700 ${
                      isFocused ? "dark:ring-1 dark:ring-gray-500" : ""
                    }`,
                  menu: () => "dark:bg-secondary-dark dark:border-gray-700",
                  option: ({ isSelected, isFocused }) =>
                    `dark:hover:bg-gray-700 ${
                      isSelected
                        ? "dark:bg семь-gray-700"
                        : isFocused
                          ? "dark:bg-gray-800"
                          : ""
                    }`,
                }}
              />
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          className="custom-scrollbar divide-y divide-gray-200 dark:divide-gray-600"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {Object.keys(groupedUpdates).length === 0 && (
            <div className="p-6 text-center">
              <p className="text-base text-muted-foreground">
                No older updates available
              </p>
            </div>
          )}
          {Object.entries(groupedUpdates)
            .sort(([a], [b]) => {
              const dateA =
                a === "Yesterday" ? subDays(new Date(), 1) : new Date(a);
              const dateB =
                b === "Yesterday" ? subDays(new Date(), 1) : new Date(b);
              return dateB.getTime() - dateA.getTime();
            })
            .map(([date, updates]) => (
              <div key={date} className="p-4">
                <h3 className="mb-2 text-lg font-semibold dark:text-gray-300">
                  {date} Updates
                </h3>
                {updates.map((update) => (
                  <div
                    key={update.id}
                    className="group relative p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {update.user && (
                          <Avatar className="relative mb-3 h-12 w-12 cursor-pointer">
                            {update.user.profilePictureUrl ? (
                              <AvatarImage
                                src={buildImageUrl(
                                  update.user.profilePictureUrl,
                                )}
                                alt={`${update.user.firstname} ${update.user.lastname}`}
                              />
                            ) : (
                              <AvatarFallback className="text-xl">
                                {update.user.firstname?.charAt(0)}
                                {update.user.lastname?.charAt(0)}
                              </AvatarFallback>
                            )}
                            <UserStatus
                              lastSeenAt={update.user.lastSeenAt}
                              className="absolute -bottom-0 -right-0"
                              showOnlyDot
                            />
                          </Avatar>
                        )}
                        <div>
                          {update.user && (
                            <span className="text-base text-gray-600 dark:text-gray-300">
                              {update.user.username ||
                                `${update.user.firstname} ${update.user.lastname}`}
                            </span>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(update.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {" "}
                        {format(new Date(update.createdAt), "MMMM d, h:mm a", {
                          timeZone: nepalTimeZone,
                        })}
                      </div>
                    </div>
                    <div className="overflow-hidden whitespace-pre-wrap break-words text-base text-gray-600 dark:text-gray-300">
                      {renderContentWithLinks(update.content)}
                    </div>
                    {/* Likes Reply Icon start */}
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 p-0 text-muted-foreground hover:text-primary"
                          disabled
                        >
                          <ThumbsUp
                            className={`h-4 w-4 ${update.likes?.some((like: Like) => like.userId === userId) ? "fill-current text-blue-400" : ""}`}
                          />
                        </Button>
                        <span
                          className="cursor-pointer text-xs text-muted-foreground hover:underline"
                          onClick={() => showLikes(update.likes || [])}
                        >
                          {update.likes?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 p-0 text-muted-foreground hover:text-primary"
                          disabled
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <span
                          className="cursor-pointer text-xs text-muted-foreground hover:underline"
                          onClick={() => toggleReplies(update.id)}
                        >
                          {update.replies?.length} replies
                        </span>
                      </div>
                    </div>
                    {/* Likes Reply Icon End */}

                    {/* Older Updates Replies Start */}
                    {showReplies[update.id] && update.replies?.length > 0 && (
                      <div className="ml-12 mt-3 space-y-3 border-l-2 border-gray-200 pl-3 dark:border-gray-600">
                        {update.replies?.map((reply: Reply) => (
                          <div key={reply.id} className="group relative">
                            <div className="flex items-start gap-2">
                              {reply.user && (
                                <Avatar className="h-8 w-8">
                                  {reply.user.profilePictureUrl ? (
                                    <AvatarImage
                                      src={buildImageUrl(
                                        reply.user.profilePictureUrl,
                                      )}
                                      alt={`${reply.user.firstname} ${reply.user.lastname}`}
                                    />
                                  ) : (
                                    <AvatarFallback>
                                      {reply.user.firstname?.charAt(0)}
                                      {reply.user.lastname?.charAt(0)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                              )}
                              <div className="flex-1">
                                <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-700">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                      {reply.user?.username ||
                                        `${reply.user?.firstname} ${reply.user?.lastname}`}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(
                                        new Date(reply.createdAt),
                                        { addSuffix: true },
                                      )}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm">
                                    {reply.content}
                                  </p>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 p-0 text-xs text-muted-foreground hover:text-primary"
                                    disabled
                                  >
                                    <ThumbsUp
                                      className={`mr-1 h-3 w-3 ${reply.likes?.some((like) => like.userId === userId) ? "fill-current text-blue-400" : ""}`}
                                    />
                                    Like
                                  </Button>
                                  {/* <span
                                    className="cursor-pointer text-xs text-muted-foreground hover:underline"
                                    onClick={() => showLikes(reply.likes)}
                                  >
                                    {reply.likes?.length} likes
                                  </span> */}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Older Updates Replies End */}
                  </div>
                ))}
              </div>
            ))}
        </div>
      </CardContent>

      <Dialog open={likesDialogOpen} onOpenChange={setLikesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Likes</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {currentLikes?.length === 0 ? (
              <p className="text-center text-muted-foreground">No likes yet</p>
            ) : (
              <div className="space-y-2">
                {currentLikes.map((like) => (
                  <div key={like.id} className="flex items-center gap-3 p-2">
                    <Avatar className="h-8 w-8">
                      {like.user.profilePictureUrl ? (
                        <AvatarImage
                          src={buildImageUrl(like.user.profilePictureUrl)}
                        />
                      ) : (
                        <AvatarFallback>
                          {like.user.firstname?.charAt(0)}
                          {like.user.lastname?.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span>
                      {like.user.username ||
                        `${like.user.firstname} ${like.user.lastname}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OlderUpdatesCard;
