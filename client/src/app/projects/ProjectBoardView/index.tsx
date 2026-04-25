"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  useGetClientsForProjectPageQuery,
  useUpdateClientProjectStatusMutation,
  Client,
  Task,
  useGetUsersQuery,
  User,
  useGetProjectCommentsQuery,
} from "@/state/api";
import {
  getCurrentNepaliMonth,
  getPreviousNepaliMonth,
  isInCurrentNepaliMonth,
  isInPreviousNepaliMonth,
} from "@/components/NepaliMonths";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import withRoleAuth from "../../../hoc/withRoleAuth";
import { toast } from "react-hot-toast";
import Header from "@/components/Header";
import UserProfileCard from "@/components/UserProfileCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Users,
  MessageSquare,
  FolderCode,
  X,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import ProjectCommentsPopup from "@/components/Client/ProjectCommentsPopup";
import Image from "next/image";

interface ColumnCollapseState {
  [key: string]: boolean;
}

type Status =
  | "New"
  | "Design"
  | "Internal-Review"
  | "Client-Review"
  | "Development"
  | "Content-Fillup"
  | "Completed"
  | "Issues"
  | "Postponed"
  | "AMC";

const projectStatuses = [
  "New",
  "Design",
  "Internal-Review",
  "Client-Review",
  "Development",
  "Content-Fillup",
  "Completed",
  "Issues",
  "Postponed",
  "AMC",
] as const;

const NewProjectPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [columnCollapse, setColumnCollapse] = useState<ColumnCollapseState>({});
  const {
    data: clients = [],
    isLoading,
    isError,
    refetch,
  } = useGetClientsForProjectPageQuery({ search: searchTerm });
  const { data: users = [] } = useGetUsersQuery();
  const [updateClientProjectStatus] = useUpdateClientProjectStatusMutation();

  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const customOrder = [
    "13",
    "14",
    "17",
    "12",
    "15",
    "16",
    "28",
    "24",
    "26",
    "30",
  ];

  const [selectedTechStack, setSelectedTechStack] = useState<string | null>(
    null,
  );
  const [isTechStackOpen, setIsTechStackOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  useEffect(() => {
    if (clients) {
      let result = [...clients];

      // Filter by selected assignee
      if (selectedUser) {
        result = result.filter((client) =>
          client.tasks?.some((task) =>
            task.assignedUsers?.some(
              (user) => user.userId === selectedUser.userId,
            ),
          ),
        );
      }

      // Filter by selected tech stack
      if (selectedTechStack) {
        result = result.filter(
          (client) => client.webDesignTechStack === selectedTechStack,
        );
      }

      // Filter only clients with project status
      result = result.filter((client) => client.projectStatus);
      setFilteredClients(result);
    }
  }, [clients, selectedUser, selectedTechStack]);

  const moveClient = async (clientId: number, toStatus: string) => {
    try {
      await updateClientProjectStatus({
        id: clientId,
        projectStatus: toStatus,
      }).unwrap();
      toast.success(`Client project status updated to ${toStatus}`);
      refetch();
    } catch (error) {
      toast.error("Failed to update client project status");
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 xl:px-6">
        <div className="flex pb-6 pt-6 lg:pb-4 lg:pt-8">
          <Skeleton className="h-10 w-[200px]" />
          <div className="relative mx-3">
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto p-4">
          {projectStatuses.map((status) => (
            <div
              key={status}
              className="h-[69vh] min-w-[280px] flex-1 rounded-lg py-4 xl:px-2"
            >
              <div className="mb-3 flex items-center justify-between rounded-md bg-white p-4 dark:bg-dark-secondary">
                <Skeleton className="h-6 w-[100px]" />
              </div>
              <div className="custom-scrollbar h-[65vh] space-y-4 overflow-y-auto">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="mb-4 rounded-xl bg-white p-4 shadow dark:border dark:border-gray-700 dark:bg-dark-secondary"
                  >
                    <Skeleton className="mb-2 h-6 w-[150px]" />
                    <Skeleton className="mb-2 h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-red-500 dark:text-red-400">
        Error loading clients
      </div>
    );
  }

  const toggleColumnCollapse = (status: string) => {
    setColumnCollapse((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  return (
    <div>
      <div className="mx-4 my-3 rounded-lg border-b border-t border-gray-200 dark:border-gray-800 dark:bg-secondary">
        <div className="mx-4 ml-6 flex items-center justify-between dark:text-gray-300">
          <div className="flex items-center gap-3 text-lg text-dashboard-tasktitle">
            <FolderCode className="h-8 w-8 text-[#0a0a0a] dark:text-gray-200" />
            <Header name="Projects" />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative mx-3">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search projects by domain or company name"
                className="w-[400px] rounded-md border py-2 pl-12 text-base text-dashboard-dates focus:outline-none dark:border-gray-700 dark:bg-secondary dark:text-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <button
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <SlidersHorizontal className="h-5 w-5 cursor-pointer text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" />
              </button>

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Panel Popup */}
            {isFilterPanelOpen && (
              <div className="absolute right-8 top-16 z-50 mt-20 w-[40%] rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-secondary">
                <div className="flex items-center justify-between border-b p-4 dark:border-gray-700">
                  <h3 className="text-lg font-semibold dark:text-gray-300">
                    Filters
                  </h3>
                  <button
                    onClick={() => setIsFilterPanelOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4 p-4">
                  <div className="flex">
                    {/* Assignee Filter */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Assignee
                      </label>
                      <div className="max-h-60 space-y-2 overflow-y-auto">
                        <button
                          className={`w-full justify-start rounded-md px-3 py-2 text-left text-sm ${
                            !selectedUser
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                          onClick={() => {
                            setSelectedUser(null);
                            setIsFilterPanelOpen(false);
                          }}
                        >
                          All Assignee
                        </button>
                        {[...users]
                          .sort((a, b) => {
                            const indexA = customOrder.indexOf(
                              String(a.userId),
                            );
                            const indexB = customOrder.indexOf(
                              String(b.userId),
                            );
                            return (
                              (indexA === -1 ? 999 : indexA) -
                              (indexB === -1 ? 999 : indexB)
                            );
                          })
                          .map((user) => (
                            <button
                              key={user.userId}
                              className={`w-full justify-start rounded-md px-3 py-2 text-left text-sm ${
                                selectedUser?.userId === user.userId
                                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                              onClick={() => {
                                setSelectedUser(user);
                                setIsFilterPanelOpen(false);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.profilePictureUrl} />
                                  <AvatarFallback>
                                    {user.firstname?.[0]}
                                    {user.lastname?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                {user.firstname} {user.lastname}
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Tech Stack Filter */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tech Stack
                      </label>
                      <div className="space-y-2">
                        <button
                          className={`w-full justify-start rounded-md px-3 py-2 text-left text-sm ${
                            !selectedTechStack
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                          onClick={() => {
                            setSelectedTechStack(null);
                            setIsFilterPanelOpen(false);
                          }}
                        >
                          All Tech Stacks
                        </button>
                        {[
                          "HTML + WordPress",
                          "HTML + Laravel",
                          "Next.js + Laravel",
                          "Next.js + Node.js",
                        ].map((tech) => (
                          <button
                            key={tech}
                            className={`w-full justify-start rounded-md px-3 py-2 text-left text-sm ${
                              selectedTechStack === tech
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                            onClick={() => {
                              setSelectedTechStack(tech);
                              setIsFilterPanelOpen(false);
                            }}
                          >
                            {tech}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Clear All Filters Button */}
                  {(selectedUser || selectedTechStack) && (
                    <button
                      className="mt-4 w-full rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                      onClick={() => {
                        setSelectedUser(null);
                        setSelectedTechStack(null);
                      }}
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DndProvider backend={HTML5Backend}>
        <div className="mx-4 flex gap-4 overflow-x-auto pb-4">
          {projectStatuses.map((status) => (
            <ClientColumn
              key={status}
              status={status}
              clients={filteredClients}
              moveClient={moveClient}
              updateClientProjectStatus={updateClientProjectStatus}
              selectedUser={selectedUser}
              isCollapsed={columnCollapse[status] || false}
              onToggleCollapse={() => toggleColumnCollapse(status)}
            />
          ))}
        </div>
      </DndProvider>
    </div>
  );
};

interface ClientColumnProps {
  status: (typeof projectStatuses)[number];
  clients: Client[];
  moveClient: (clientId: number, toStatus: string) => void;
  updateClientProjectStatus: any;
  selectedUser: User | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const ClientColumn = React.forwardRef<HTMLDivElement, ClientColumnProps>(
  (
    {
      status,
      clients,
      moveClient,
      updateClientProjectStatus,
      selectedUser,
      isCollapsed,
      onToggleCollapse,
    },
    ref,
  ) => {
    const [showDatePopup, setShowDatePopup] = useState(false);
    const [pendingClientId, setPendingClientId] = useState<number | null>(null);
    const [websiteLiveDate, setWebsiteLiveDate] = useState("");
    const popupRef = useRef<HTMLDivElement>(null);

    const [{ isOver }, drop] = useDrop(() => ({
      accept: "Client",
      drop: (item: { id: number }) => {
        if (status === "Completed") {
          // Show popup for Completed column
          setPendingClientId(item.id);
          setShowDatePopup(true);
          setWebsiteLiveDate(""); // Reset date input
        } else {
          // Direct move for other columns
          moveClient(item.id, status);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }));

    const handleConfirmMove = async () => {
      if (!pendingClientId) return;

      if (!websiteLiveDate) {
        toast.error("Please select a website live date");
        return;
      }

      try {
        // First update the website live date
        await updateClientProjectStatus({
          id: pendingClientId,
          websiteLiveDate: websiteLiveDate,
        }).unwrap();

        // Then move to completed status
        await moveClient(pendingClientId, "Completed");

        setShowDatePopup(false);
        setPendingClientId(null);
        setWebsiteLiveDate("");
      } catch (error) {
        toast.error("Failed to update client");
      }
    };

    const handleSkipMove = async () => {
      if (!pendingClientId) return;

      try {
        // Move to completed status without website live date
        await moveClient(pendingClientId, "Completed");

        setShowDatePopup(false);
        setPendingClientId(null);
        setWebsiteLiveDate("");
      } catch (error) {
        toast.error("Failed to update client");
      }
    };

    // Add click outside handler
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          popupRef.current &&
          !popupRef.current.contains(event.target as Node)
        ) {
          handleSkipMove();
        }
      };

      if (showDatePopup) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showDatePopup]);

    // In the ClientColumn component, modify the filteredClients sorting logic:
    const filteredClients = clients
      .filter((client) => {
        // Include clients in this column based on their status
        const isStatusMatch = client.projectStatus === status;

        if (status === "Completed") {
          const isAmcWithValidDate =
            client.projectStatus === "AMC" &&
            client.websiteLiveDate &&
            new Date(client.websiteLiveDate) >= new Date("2026-01-13") &&
            new Date(client.websiteLiveDate) <= new Date("2026-03-14");

          const isLiveThisMonth =
            client.websiteLiveDate &&
            isInCurrentNepaliMonth(new Date(client.websiteLiveDate));

          const isLivePreviousMonth =
            client.websiteLiveDate &&
            isInPreviousNepaliMonth(new Date(client.websiteLiveDate));

          return (
            isStatusMatch ||
            isAmcWithValidDate ||
            isLiveThisMonth ||
            isLivePreviousMonth
          );
        }

        return isStatusMatch;
      })
      .sort((a, b) => {
        // For Completed column, sort by websiteLiveDate descending
        if (status === "Completed") {
          // Handle cases where websiteLiveDate might be null/undefined
          if (!a.websiteLiveDate && !b.websiteLiveDate) return 0;
          if (!a.websiteLiveDate) return 1;
          if (!b.websiteLiveDate) return -1;

          return (
            new Date(b.websiteLiveDate).getTime() -
            new Date(a.websiteLiveDate).getTime()
          );
        }

        // Function to calculate progress percentage for a client
        const getProgress = (client: Client) => {
          const tasks = client.tasks || [];
          const processedTasks = tasks.map((task) => ({
            ...task,
            // Ensure subtasks inherit category from parent if not specified
            subtasks: (task.subtasks || []).map((subtask) => ({
              ...subtask,
              category: subtask.category || task.category,
            })),
          }));

          // Filter tasks and subtasks based on current column status
          let filteredTasks = processedTasks;
          let filteredSubtasks = processedTasks.flatMap(
            (task) => task.subtasks,
          );

          if (status === "Design") {
            filteredTasks = processedTasks.filter(
              (task) => task.category === "Design",
            );
            filteredSubtasks = processedTasks.flatMap((task) =>
              task.subtasks.filter((subtask) => subtask.category === "Design"),
            );
          } else if (status === "Development") {
            filteredTasks = processedTasks.filter(
              (task) => task.category === "Development",
            );
            filteredSubtasks = processedTasks.flatMap((task) =>
              task.subtasks.filter(
                (subtask) => subtask.category === "Development",
              ),
            );
          } else if (status === "Content-Fillup") {
            filteredTasks = processedTasks.filter(
              (task) => task.category === "ContentFillup",
            );
            filteredSubtasks = processedTasks.flatMap((task) =>
              task.subtasks.filter(
                (subtask) => subtask.category === "ContentFillup",
              ),
            );
          } else if (status === "AMC") {
            filteredTasks = processedTasks.filter(
              (task) => task.category === "AMC",
            );
            filteredSubtasks = processedTasks.flatMap((task) =>
              task.subtasks.filter((subtask) => subtask.category === "AMC"),
            );
          }

          const completedCount =
            filteredTasks.filter((t) => t.status === "Completed").length +
            filteredSubtasks.filter((t) => t.status === "Completed").length;
          const totalCount = filteredTasks.length + filteredSubtasks.length;

          return totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        };

        const progressA = getProgress(a);
        const progressB = getProgress(b);

        // Special case: if both have 0% progress, sort by priority/name
        if (progressA === 0 && progressB === 0) {
          const aPriority = a.projectPriority ?? Infinity;
          const bPriority = b.projectPriority ?? Infinity;
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          return (a.companyName || "").localeCompare(b.companyName || "");
        }

        // If one has 0% progress and the other doesn't, the non-zero comes first
        if (progressA === 0) return 1;
        if (progressB === 0) return -1;

        // For non-zero progress, sort by progress descending
        return progressB - progressA;
      });

    const statusColor: Record<Status, string> = {
      New: "bg-gray-50 dark:bg-secondary",
      Design: "bg-blue-50 dark:bg-secondary",
      "Internal-Review": "bg-orange-50 dark:bg-secondary",
      "Client-Review": "bg-red-50 dark:bg-secondary",
      Development: "bg-indigo-50 dark:bg-secondary",
      "Content-Fillup": "bg-sky-50 dark:bg-secondary",
      Completed: "bg-green-50 dark:bg-secondary",
      Issues: "bg-red-100 dark:bg-secondary",
      Postponed: "bg-red-50 dark:bg-secondary",
      AMC: "bg-purple-50 dark:bg-secondary",
    };

    const statusBorderColor: Record<Status, string> = {
      New: "border-gray-100 dark:border-gray-800",
      Design: "border-blue-100 dark:border-gray-800",
      "Internal-Review": "border-orange-100 dark:border-gray-800",
      "Client-Review": "border-orange-100 dark:border-gray-800",
      Development: "border-yellow-100 dark:border-gray-800",
      "Content-Fillup": "border-sky-100 dark:border-gray-800",
      Completed: "border-green-100 dark:border-gray-800",
      Issues: "border-red-100 dark:border-gray-800",
      Postponed: "border-red-100 dark:border-gray-800",
      AMC: "border-purple-100 dark:border-gray-800",
    };

    return (
      <div
        ref={(node) => {
          drop(node);
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={`h-[75vh] flex-none rounded-lg py-2 xl:px-2 ${statusColor[status]} ${statusBorderColor[status]} border ${
          isOver ? "ring-2 ring-blue-500 dark:ring-blue-400/50" : ""
        } ${isCollapsed ? "w-20" : "w-[280px] min-w-[280px]"}`}
      >
        {/* Header */}
        <div
          className={`${statusColor[status]} ${statusBorderColor[status]} mb-2 flex w-full items-center justify-between rounded-t-lg border-b px-4 py-1 pb-1 dark:border-gray-700/75`}
        >
          <div className="flex items-center">
            {!isCollapsed && (
              <h3 className="text-base font-semibold dark:text-gray-300">
                {status}{" "}
                <span
                  className="ml-2 inline-block rounded-full bg-gray-200 p-1 text-center text-sm leading-none dark:bg-dark-tertiary"
                  style={{ width: "1.5rem", height: "1.5rem" }}
                >
                  {filteredClients.length}
                </span>
              </h3>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-200 text-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-400 dark:hover:bg-gray-500"
            title={isCollapsed ? "Expand column" : "Collapse column"}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Date Popup for Completed column */}
        {showDatePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
              ref={popupRef}
              className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-dark-secondary"
            >
              <h3 className="mb-4 text-lg font-semibold dark:text-gray-300">
                Enter Website Live Date
              </h3>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Please select the date when this project went live:
              </p>

              <input
                type="date"
                value={websiteLiveDate}
                onChange={(e) => setWebsiteLiveDate(e.target.value)}
                className="mb-6 w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                max={new Date().toISOString().split("T")[0]} // Can't select future dates
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSkipMove}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Skip
                </button>
                <button
                  onClick={handleConfirmMove}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {isCollapsed ? (
          // Collapsed state - vertical text with count
          <div className="flex h-[65vh] flex-col items-center justify-center">
            <div className="origin-center -rotate-90 transform whitespace-nowrap">
              <div className="text-sm font-semibold dark:text-gray-300">
                {status}
              </div>
              <div className="mt-2 text-center text-2xl font-bold dark:text-gray-300">
                {filteredClients.length}
              </div>
            </div>
          </div>
        ) : (
          <div className="custom-scrollbar h-[65vh] overflow-y-auto px-2">
            {status === "Completed" ? (
              <>
                {/* Filter clients who lived this month */}
                {(() => {
                  // Define date ranges
                  const thisMonthStart = getCurrentNepaliMonth().start;
                  const thisMonthEnd = getCurrentNepaliMonth().end;
                  const prevMonthStart = getPreviousNepaliMonth().start;
                  const prevMonthEnd = getPreviousNepaliMonth().end;

                  // First filter all clients that should be in the Completed column
                  const completedAndLiveClients = filteredClients.filter(
                    (client) =>
                      client.projectStatus === "Completed" ||
                      client.projectStatus === "AMC" ||
                      (client.websiteLiveDate &&
                        (isInCurrentNepaliMonth(
                          new Date(client.websiteLiveDate),
                        ) ||
                          isInPreviousNepaliMonth(
                            new Date(client.websiteLiveDate),
                          ))),
                  );

                  // Categorize them based on dates and status
                  const thisMonthLivedClients = completedAndLiveClients.filter(
                    (client) =>
                      client.websiteLiveDate &&
                      isInCurrentNepaliMonth(new Date(client.websiteLiveDate)),
                  );

                  const previousMonthLivedClients =
                    completedAndLiveClients.filter(
                      (client) =>
                        client.websiteLiveDate &&
                        isInPreviousNepaliMonth(
                          new Date(client.websiteLiveDate),
                        ),
                    );

                  const otherClients = completedAndLiveClients.filter(
                    (client) => {
                      // If no websiteLiveDate, include if Completed or AMC
                      if (!client.websiteLiveDate) {
                        return (
                          client.projectStatus === "Completed" ||
                          client.projectStatus === "AMC"
                        );
                      }

                      const liveDate = new Date(client.websiteLiveDate);
                      // If outside both date ranges, include if status is Completed or AMC
                      if (
                        liveDate < prevMonthStart ||
                        liveDate > thisMonthEnd
                      ) {
                        return (
                          client.projectStatus === "Completed" ||
                          client.projectStatus === "AMC"
                        );
                      }
                      return false;
                    },
                  );

                  return (
                    <>
                      <div className="mb-2">
                        <h4 className="mb-2 ml-1 text-sm font-bold text-gray-600 dark:text-gray-300">
                          Baishak Month Live ({thisMonthLivedClients.length})
                        </h4>
                        {thisMonthLivedClients.length > 0 ? (
                          thisMonthLivedClients.map((client) => (
                            <ClientCard
                              key={client.id}
                              client={client}
                              status={status}
                              selectedUser={selectedUser}
                            />
                          ))
                        ) : (
                          <p className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                            Not Live Yet!
                          </p>
                        )}
                      </div>

                      {previousMonthLivedClients.length > 0 && (
                        <div className="mb-2">
                          <h4 className="mb-2 ml-1 text-sm font-bold text-gray-600 dark:text-gray-300">
                            Chaitra Month Live (
                            {previousMonthLivedClients.length})
                          </h4>
                          {previousMonthLivedClients.map((client) => (
                            <ClientCard
                              key={client.id}
                              client={client}
                              status={status}
                              selectedUser={selectedUser}
                            />
                          ))}
                        </div>
                      )}

                      {otherClients.length > 0 && (
                        <div className="mb-2">
                          {otherClients.map((client) => (
                            <ClientCard
                              key={client.id}
                              client={client}
                              status={status}
                              selectedUser={selectedUser}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            ) : (
              /* For non-Completed columns */
              filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  status={status}
                  selectedUser={selectedUser}
                />
              ))
            )}
          </div>
        )}
      </div>
    );
  },
);

ClientColumn.displayName = "ClientColumn";

const ClientCard = ({
  client,
  status,
  selectedUser,
}: {
  client: Client;
  status: (typeof projectStatuses)[number];
  selectedUser: User | null;
}) => {
  const { user: authUser } = useAuth();
  const dragRef = useRef<HTMLDivElement>(null);
  const [showComments, setShowComments] = useState(false);
  const { data: comments } = useGetProjectCommentsQuery(client.id);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "Client",
    item: { id: client.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  drag(dragRef);

  const calculateTimeLeft = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate)
      return { text: "N/A", color: "text-gray-600 dark:text-gray-400" };

    const today = new Date();
    const end = new Date(endDate);
    const daysRemaining = differenceInDays(end, today);
    const daysPast = differenceInDays(today, end);

    if (daysRemaining > 0) {
      return {
        text: `${daysRemaining} d left`,
        color: "text-green-600 dark:text-green-500",
      };
    } else if (daysPast > 0) {
      return {
        text: `- ${daysPast} d`,
        color: "text-red-600 dark:text-red-500",
      };
    } else {
      return {
        text: "Due today",
        color: "text-yellow-600 dark:text-yellow-500",
      };
    }
  };

  const timeStatus = calculateTimeLeft(client.startDate, client.endDate);

  const getTaskCounts = () => {
    let tasks = client.tasks || [];
    let subtasks: Task[] = [];

    // Process tasks and subtasks - inherit category from parent if subtask category is null
    tasks.forEach((task) => {
      if (task.subtasks && task.subtasks.length > 0) {
        task.subtasks.forEach((subtask) => {
          // Create a new subtask object with inherited category if needed
          const processedSubtask = {
            ...subtask,
            category:
              subtask.category === null && task.category
                ? task.category
                : subtask.category,
          };
          subtasks.push(processedSubtask);
        });
      }
    });

    // Rest of the function remains the same...
    // Filter tasks by selected user if one is selected
    if (selectedUser) {
      tasks = tasks.filter((task) =>
        task.assignedUsers?.some((user) => user.userId === selectedUser.userId),
      );
      subtasks = subtasks.filter((subtask) =>
        subtask.assignedUsers?.some(
          (user) => user.userId === selectedUser.userId,
        ),
      );
    }

    // Filter tasks and subtasks based on current column status
    let filteredTasks = tasks;
    let filteredSubtasks = subtasks;

    if (status === "Design") {
      filteredTasks = tasks.filter((task) => task.category === "Design");
      filteredSubtasks = subtasks.filter(
        (subtask) => subtask.category === "Design",
      );
    } else if (status === "Development") {
      filteredTasks = tasks.filter((task) => task.category === "Development");
      filteredSubtasks = subtasks.filter(
        (subtask) => subtask.category === "Development",
      );
    } else if (status === "Content-Fillup") {
      filteredTasks = tasks.filter((task) => task.category === "ContentFillup");
      filteredSubtasks = subtasks.filter(
        (subtask) => subtask.category === "ContentFillup",
      );
    } else if (status === "AMC") {
      filteredTasks = tasks.filter((task) => task.category === "AMC");
      filteredSubtasks = subtasks.filter(
        (subtask) => subtask.category === "AMC",
      );
    }

    const completedTasks = filteredTasks.filter(
      (task) => task.status === "Completed",
    ).length;
    const completedSubtasks = filteredSubtasks.filter(
      (subtask) => subtask.status === "Completed",
    ).length;

    const totalTasks = filteredTasks.length;
    const totalSubtasks = filteredSubtasks.length;

    // Get unique categories from filtered tasks
    const categories = Array.from(
      new Set(
        filteredTasks
          .map((task) => task.category)
          .filter(
            (category): category is NonNullable<typeof category> =>
              category !== null && category !== undefined,
          ),
      ),
    ).map((category) => {
      // Convert to display-friendly format
      switch (category) {
        case "ContentFillup":
          return "Content";
        default:
          return category;
      }
    });

    return {
      completedCount: completedTasks + completedSubtasks,
      totalCount: totalTasks + totalSubtasks,
      categories,
    };
  };
  // Destructure the return value to include categories
  const { completedCount, totalCount, categories } = getTaskCounts();

  const taskCountColor =
    completedCount === totalCount && totalCount > 0
      ? "text-green-600 dark:text-green-500"
      : "text-red-600 dark:text-red-500";

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  const [showMaintenancePopup, setShowMaintenancePopup] = useState(false);
  const [showProjectDatePopup, setShowProjectDatePopup] = useState(false);
  const [showDatePopup, setShowDatePopup] = useState(false);
  const [showDescriptionPopup, setShowDescriptionPopup] = useState(false);
  const datePopupRef = useRef<HTMLDivElement>(null);
  const descriptionPopupRef = useRef<HTMLDivElement>(null);
  const maintenancePopupRef = useRef<HTMLDivElement>(null);
  const projectDatePopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePopupRef.current &&
        !datePopupRef.current.contains(event.target as Node) &&
        showDatePopup
      ) {
        setShowDatePopup(false);
      }
      if (
        descriptionPopupRef.current &&
        !descriptionPopupRef.current.contains(event.target as Node) &&
        showDescriptionPopup
      ) {
        setShowDescriptionPopup(false);
      }
      if (
        projectDatePopupRef.current &&
        !projectDatePopupRef.current.contains(event.target as Node) &&
        showProjectDatePopup
      ) {
        setShowProjectDatePopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDatePopup, showDescriptionPopup, showProjectDatePopup]);

  return (
    <div
      ref={dragRef}
      className={`mb-4 rounded-md bg-white p-4 py-3 shadow dark:border dark:border-gray-700/75 dark:bg-secondary ${
        isDragging ? "opacity-50" : "opacity-100"
      } `}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex items-center justify-between break-words text-base font-semibold text-dashboard-tasktitle dark:text-gray-300/75">
          <Link href={`/projects/${client.id}`} className="hover:underline">
            {status === "Completed"
              ? (client.domainName && client.domainName.length > 15
                  ? `${client.domainName.substring(0, 15)}...`
                  : client.domainName) ||
                (client.companyName && client.companyName.length > 15
                  ? `${client.companyName.substring(0, 15)}...`
                  : client.companyName)
              : (client.domainName && client.domainName.length > 15
                  ? `${client.domainName.substring(0, 15)}...`
                  : client.domainName) ||
                (client.companyName && client.companyName.length > 15
                  ? `${client.companyName.substring(0, 15)}...`
                  : client.companyName)}
          </Link>
        </h4>
        {status === "Completed"
          ? client.webDesignTechStack && (
              <span className="rounded-md border bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-600 dark:text-gray-300">
                {client.webDesignTechStack === "HTML + WordPress"
                  ? "WordPress"
                  : client.webDesignTechStack === "HTML + Laravel"
                    ? "Laravel"
                    : client.webDesignTechStack === "Next.js + Laravel"
                      ? "Next + Laravel"
                      : client.webDesignTechStack}
              </span>
            )
          : status !== "AMC" &&
            client.webDesignTechStack && (
              <span className="rounded-md border bg-gray-100 px-2 py-0.5 text-xs dark:bg-secondary dark:text-gray-300">
                {client.webDesignTechStack === "HTML + WordPress"
                  ? "WordPress"
                  : client.webDesignTechStack === "HTML + Laravel"
                    ? "Laravel"
                    : client.webDesignTechStack === "Next.js + Laravel"
                      ? "Next + Laravel"
                      : client.webDesignTechStack}
              </span>
            )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {client.maintenanceType && (
            <div className="flex items-center">
              <span className="rounded-md border bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-600 dark:text-gray-300">
                {client.maintenanceType} AMC
              </span>

              {client.maintenanceDescription && (
                <button
                  onClick={() => setShowDescriptionPopup(true)}
                  className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300"
                >
                  i
                </button>
              )}
            </div>
          )}
        </div>

        {/* Show tech stack at the end only for AMC status */}
        {status === "AMC" && client.webDesignTechStack && (
          <div className="my-2">
            <span className="rounded-md border bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-600 dark:text-gray-300">
              {client.webDesignTechStack === "HTML + WordPress"
                ? "WordPress"
                : client.webDesignTechStack === "HTML + Laravel"
                  ? "Laravel"
                  : client.webDesignTechStack === "Next.js + Laravel"
                    ? "Next + Laravel"
                    : client.webDesignTechStack}
            </span>
          </div>
        )}
      </div>

      {status !== "Completed" && (
        <div className="mt-2 w-full">
          <Link href={`/projects/${client.id}`} className="block w-full">
            <div className="flex flex-col gap-2">
              <div className="flex w-full items-center justify-between">
                <div className="mt-2 flex w-full items-center justify-between">
                  {/* <span className="text-sm dark:text-gray-400">
                    {totalCount > 0
                      ? `${Math.round((completedCount / totalCount) * 100)}%`
                      : "0%"}
                  </span> */}

                  {client.tasks && client.tasks.length > 0 && (
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {Array.from(
                          new Set(
                            client.tasks
                              .flatMap(
                                (task) =>
                                  task.assignedUsers?.map(
                                    (user) => user?.userId,
                                  ) || [],
                              )
                              .filter(
                                (userId): userId is number =>
                                  userId !== undefined,
                              ),
                          ),
                        )
                          .slice(0, 5) // Limit to 5 unique users
                          .map((userId) => {
                            const user = client.tasks
                              ?.flatMap((task) => task.assignedUsers || [])
                              .find((u) => u?.userId === userId);
                            if (!user) return null;

                            const [showProfileCard, setShowProfileCard] =
                              useState(false);
                            let hoverTimeout: NodeJS.Timeout;

                            return (
                              <div
                                key={user.userId}
                                className="group relative"
                                onMouseEnter={() => {
                                  hoverTimeout = setTimeout(() => {
                                    setShowProfileCard(true);
                                  }, 500); // Show after 500ms hover
                                }}
                                onMouseLeave={() => {
                                  clearTimeout(hoverTimeout);
                                  setShowProfileCard(false);
                                }}
                              >
                                {user.profilePictureUrl ? (
                                  <img
                                    src={buildImageUrl(user.profilePictureUrl)}
                                    alt={`${user.firstname} ${user.lastname}`}
                                    className="h-6 w-6 cursor-pointer rounded-full border-2 border-white dark:border-gray-800"
                                  />
                                ) : (
                                  <div className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-medium dark:border-gray-800 dark:bg-gray-400">
                                    {user.firstname?.charAt(0)}
                                    {user.lastname?.charAt(0)}
                                  </div>
                                )}

                                {showProfileCard && (
                                  <UserProfileCard
                                    user={user}
                                    onClose={() => {
                                      setShowProfileCard(false);
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  <Link
                    href={`/projects/${client.id}?tab=tasks`}
                    className="text-sm text-gray-600 hover:underline dark:text-gray-400 dark:hover:text-blue-400"
                    onClick={(e) => e.stopPropagation()} // Important to prevent drag issues
                  >
                    {completedCount}/{totalCount} tasks
                  </Link>

                  <div className="flex items-center gap-3">
                    {client.googleDriveLink && (
                      <Link
                        href={`${client.googleDriveLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div>
                          {" "}
                          <Image
                            src="/google-drive.png"
                            height={12}
                            width={12}
                            alt="google drive"
                          />
                        </div>
                      </Link>
                    )}
                    <p className={`text-sm font-semibold ${timeStatus.color}`}>
                      {timeStatus.text}
                    </p>
                    <button
                      onClick={() => setShowProjectDatePopup(true)}
                      className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300"
                    >
                      i
                    </button>
                  </div>
                </div>
              </div>

              {/* <div className="w-full">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="absolute left-0 top-0 h-full bg-green-500 dark:bg-green-600"
                    style={{
                      width: `${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div> */}
            </div>
          </Link>
        </div>
      )}

      {status !== "Completed" && (
        <div className="flex-col pt-2">
          {status === "AMC" ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p
                    className={`text-sm font-semibold ${calculateTimeLeft(client.maintenanceActiveDate, client.maintenanceExpiryDate).color}`}
                  >
                    {
                      calculateTimeLeft(
                        client.maintenanceActiveDate,
                        client.maintenanceExpiryDate,
                      ).text
                    }
                  </p>
                  <button
                    onClick={() => setShowDatePopup(true)}
                    className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300"
                  >
                    i
                  </button>
                </div>
              </div>

              {/* Date Popup */}
              {showDatePopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div
                    ref={datePopupRef}
                    className="relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-dark-secondary"
                  >
                    <button
                      onClick={() => setShowDatePopup(false)}
                      className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                      ×
                    </button>
                    <h3 className="mb-4 text-lg font-semibold dark:text-gray-300">
                      Maintenance Dates
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400">
                          Active Date:
                        </h4>
                        <p className="text-sm text-gray-800 dark:text-gray-300">
                          {client.maintenanceActiveDate
                            ? format(
                                new Date(client.maintenanceActiveDate),
                                "MMM d, yyyy",
                              )
                            : "Not specified"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400">
                          Expiry Date:
                        </h4>
                        <p className="text-sm text-gray-800 dark:text-gray-300">
                          {client.maintenanceExpiryDate
                            ? format(
                                new Date(client.maintenanceExpiryDate),
                                "MMM d, yyyy",
                              )
                            : "Not specified"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400">
                          Status:
                        </h4>
                        <p
                          className={`text-sm font-semibold ${calculateTimeLeft(client.maintenanceActiveDate, client.maintenanceExpiryDate).color}`}
                        >
                          {
                            calculateTimeLeft(
                              client.maintenanceActiveDate,
                              client.maintenanceExpiryDate,
                            ).text
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Description Popup */}
              {showDescriptionPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div
                    ref={descriptionPopupRef}
                    className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-dark-secondary"
                  >
                    <button
                      onClick={() => setShowDescriptionPopup(false)}
                      className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    >
                      ×
                    </button>
                    <h3 className="mb-4 text-lg font-semibold dark:text-gray-300">
                      Maintenance Description
                    </h3>
                    <div className="prose dark:prose-invert max-w-none rounded-md bg-gray-100 p-4 dark:bg-gray-800">
                      {client.maintenanceDescription ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: client.maintenanceDescription,
                          }}
                          className="text-sm text-gray-700 dark:text-gray-300"
                        />
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No maintenance description available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between"></div>
            </>
          )}
        </div>
      )}

      {showProjectDatePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            ref={projectDatePopupRef}
            className="relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-dark-secondary"
          >
            <button
              onClick={() => setShowProjectDatePopup(false)}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              ×
            </button>
            <h3 className="mb-4 text-lg font-semibold dark:text-gray-300">
              Project Dates
            </h3>
            <div className="space-y-4">
              <div className="items center flex gap-2">
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400">
                  Start Date:
                </h4>
                <p className="text-sm text-gray-800 dark:text-gray-300">
                  {client.startDate
                    ? format(new Date(client.startDate), "MMM d, yyyy")
                    : "Not specified"}
                </p>
              </div>
              <div className="items center flex gap-2">
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400">
                  Due Date:
                </h4>
                <p className="text-sm text-gray-800 dark:text-gray-300">
                  {client.endDate
                    ? format(new Date(client.endDate), "MMM d, yyyy")
                    : "Not specified"}
                </p>
              </div>
              <div className="items center flex gap-2">
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400">
                  Status:
                </h4>
                <p className={`text-sm font-semibold ${timeStatus.color}`}>
                  {timeStatus.text}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showComments && (
        <ProjectCommentsPopup
          clientId={client.id}
          userId={authUser?.userId}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
};

export default withRoleAuth(NewProjectPage, ["ADMIN", "DESIGNER", "DEVELOPER"]);
