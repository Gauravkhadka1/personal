"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useGetProjectTimelinesQuery, Client } from "@/state/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import Link from "next/link";

// Define the actual API response type
interface ProjectTimelinesResponse {
  success: boolean;
  count: number;
  data: Client[];
}

// Define status constants to match your example
enum ProjectTimelineStatus {
  ToDo = "ToDo",
  InProgress = "InProgress", 
  Completed = "Completed"
}

const ProjectTimelines = () => {
  const { data: response, isLoading, error } = useGetProjectTimelinesQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);
  const rowRefs = useRef<{ [key: number]: HTMLTableRowElement | null }>({});

  // Type assertion for the response
  const apiResponse = response as unknown as ProjectTimelinesResponse;

  // Extract clients from the response data
  const clients = apiResponse?.data || [];

  // Get current Nepal date (UTC+5:45)
  const getNepalToday = () => {
    const now = new Date();
    // Nepal is UTC+5:45
    const nepalOffset = 5 * 60 + 45; // minutes
    const localOffset = now.getTimezoneOffset(); // minutes
    const nepalTime = new Date(now.getTime() + (localOffset + nepalOffset) * 60000);
    return nepalTime;
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Check if a date is today in Nepal time
  const isTodayInNepal = (dateString: string) => {
    const date = new Date(dateString);
    const today = getNepalToday();
    
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Status configuration with colors
  const statusConfig = {
    [ProjectTimelineStatus.ToDo]: {
      label: "To Do",
      variant: "secondary" as const,
      color: "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
    },
    [ProjectTimelineStatus.InProgress]: {
      label: "In Progress",
      variant: "default" as const,
      color: "text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-300",
    },
    [ProjectTimelineStatus.Completed]: {
      label: "Completed",
      variant: "success" as const,
      color: "text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-300",
    },
  };

  // Get status configuration based on status string
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Completed":
        return statusConfig[ProjectTimelineStatus.Completed];
      case "InProgress":
        return statusConfig[ProjectTimelineStatus.InProgress];
      case "ToDo":
      default:
        return statusConfig[ProjectTimelineStatus.ToDo];
    }
  };

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) {
      return clients;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return clients.filter((client: Client) => {
      const domainName = client.domainName?.toLowerCase() || "";
      const companyName = client.companyName?.toLowerCase() || "";
      
      return domainName.includes(searchLower) || 
             companyName.includes(searchLower);
    });
  }, [clients, searchTerm]);

  // Flatten and sort all timelines by deadline in ascending order
  const sortedTimelines = React.useMemo(() => {
    const allTimelines: Array<{
      id: string;
      domainName: string;
      companyName: string;
      timeline: any;
      client: Client;
      deadline: Date | null;
      originalIndex: number;
    }> = [];

    filteredClients.forEach((client: Client) => {
      if (client.projectTimeline && client.projectTimeline.length > 0) {
        client.projectTimeline.forEach((timeline: any) => {
          const deadline = timeline.deadline ? new Date(timeline.deadline) : null;
          allTimelines.push({
            id: timeline.id,
            domainName: client.domainName,
            companyName: client.companyName,
            timeline,
            client,
            deadline,
            originalIndex: allTimelines.length,
          });
        });
      }
    });

    // Sort by deadline in ascending order (earliest first)
    return allTimelines.sort((a, b) => {
      const dateA = a.deadline ? a.deadline.getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.deadline ? b.deadline.getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });
  }, [filteredClients]);

  // Find the index where we should scroll to (today's date or latest available)
  const scrollToIndex = React.useMemo(() => {
    if (sortedTimelines.length === 0) return -1;

    const today = getNepalToday();
    today.setHours(0, 0, 0, 0); // Start of today

    // First, try to find a timeline with deadline exactly today
    for (let i = 0; i < sortedTimelines.length; i++) {
      const timeline = sortedTimelines[i];
      if (timeline.deadline) {
        const deadline = new Date(timeline.deadline);
        deadline.setHours(0, 0, 0, 0);
        
        if (deadline.getTime() === today.getTime()) {
          return i;
        }
      }
    }

    // If no exact today match, find the first timeline with deadline >= today
    for (let i = 0; i < sortedTimelines.length; i++) {
      const timeline = sortedTimelines[i];
      if (timeline.deadline) {
        const deadline = new Date(timeline.deadline);
        deadline.setHours(0, 0, 0, 0);
        
        if (deadline >= today) {
          return i;
        }
      }
    }

    // If all deadlines are in the past, scroll to the last one (latest date)
    return sortedTimelines.length - 1;
  }, [sortedTimelines]);

  // Find the index where the green border should be placed
  const getBorderIndex = React.useMemo(() => {
    if (sortedTimelines.length === 0) return -1;

    const today = getNepalToday();
    today.setHours(0, 0, 0, 0); // Start of today

    // Find the first timeline with deadline >= today
    for (let i = 0; i < sortedTimelines.length; i++) {
      const timeline = sortedTimelines[i];
      if (timeline.deadline) {
        const deadline = new Date(timeline.deadline);
        deadline.setHours(0, 0, 0, 0);
        
        if (deadline >= today) {
          return i;
        }
      }
    }

    // If all deadlines are in the past, put border at the end
    return sortedTimelines.length;
  }, [sortedTimelines]);

  // Auto-scroll to the target row when data loads or search changes
  useEffect(() => {
    if (!isLoading && scrollToIndex >= 0 && rowRefs.current[scrollToIndex]) {
      // Small delay to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        const targetRow = rowRefs.current[scrollToIndex];
        if (targetRow) {
          targetRow.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, scrollToIndex, sortedTimelines]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              Error loading project timelines
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ">
            <div>
              <CardTitle className="text-2xl font-bold">
                Project Timelines
              </CardTitle>
            </div>
            <div className="w-[40%]">
              <Input
                type="text"
                placeholder="Search by project name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add a scrollable container for the table */}
          <div className="overflow-auto max-h-[70vh]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Project Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody ref={tableBodyRef}>
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : sortedTimelines.length > 0 ? (
                  sortedTimelines.map(
                    ({ id, companyName, domainName, timeline, client }, index) => {
                      const statusInfo = getStatusConfig(timeline.status);
                      const isToday = timeline.deadline ? isTodayInNepal(timeline.deadline as string) : false;
                      const isScrollTarget = index === scrollToIndex;
                      
                      return (
                        <React.Fragment key={id}>
                          {/* Add green border before the first upcoming deadline */}
                          {index === getBorderIndex && (
                            <TableRow className="border-t-4 border-green-500">
                              <TableCell colSpan={5} className="p-0"></TableCell>
                            </TableRow>
                          )}
                          <TableRow 
                            ref={(el) => {
                              rowRefs.current[index] = el;
                            }}
                            className={`
                              ${isToday ? "bg-green-50 dark:bg-green-950/20 font-medium" : ""}
                              ${isScrollTarget ? "ring-2 ring-blue-500 ring-offset-2" : ""}
                              transition-all duration-300
                            `}
                          >
                            <TableCell className="font-medium">
                              <Link 
                                href={`/projects/${client.id}`} 
                                className="hover:underline"
                              >
                                {domainName || companyName}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {timeline.title}
                              {isToday && (
                                <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                  (Today)
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {timeline.deadline
                                ? formatDate(timeline.deadline as string)
                                : "No deadline"}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={statusInfo.variant}
                                className={statusInfo.color}
                              >
                                {statusInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {client.projectStatus || "Not Set"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    }
                  )
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      {searchTerm ? "No projects found matching your search" : "No project timelines found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectTimelines;