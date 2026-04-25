// "use client";

// import React from "react";
// import {
//   useGetTasksQuery,
//   useGetUsersQuery,
//   useGetClientsQuery,
//   User,
// } from "@/state/api";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Card } from "@/components/ui/card";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { ChevronUp, ChevronDown, Users, CalendarIcon } from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   format,
//   subDays,
//   startOfWeek,
//   endOfWeek,
//   startOfMonth,
//   endOfMonth,
//   subMonths,
//   isSameDay,
//   isWithinInterval,
// } from "date-fns";
// import { Calendar } from "@/components/ui/calendar";
// import { cn } from "@/lib/utils";
// import { DateRange } from "react-day-picker";
// import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Pagination } from "@mui/material";

// type SortDirection = "asc" | "desc" | null;
// type SortableField = "startDate" | "dueDate" | "timeSpent";

// interface TeamReportsTableProps {
//   isAdmin: boolean;
//   currentUser: User | null;
//   customOrder?: string[];
//   showTopRows?: number;
//   title?: string;
// }

// export const TeamReportsTable = ({
//   isAdmin,
//   currentUser,
//   customOrder = ["13", "14", "17", "12", "15", "16", "28", "24", "26", "30"],
//   showTopRows,
//   title, 
// }: TeamReportsTableProps) => {
//   const { data: users = [] } = useGetUsersQuery();
//   const { data: tasks = [] } = useGetTasksQuery({});
//   const { data: clients } = useGetClientsQuery();
//   const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
//   const [isAssigneeOpen, setIsAssigneeOpen] = React.useState(false);
//   const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
//   const [tempDateRange, setTempDateRange] = React.useState<
//     DateRange | undefined
//   >();
//   const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
//   const [page, setPage] = React.useState(1);
//   const rowsPerPage = 15;

//   const [sortConfig, setSortConfig] = React.useState<{
//     key: SortableField;
//     direction: SortDirection;
//   } | null>({ key: "timeSpent", direction: "desc" });

//   React.useEffect(() => {
//     if (currentUser && users.length > 0) {
//       if (isAdmin) {
//         setSelectedUser(null);
//       } else {
//         const loggedInUser = users.find((u) => u.userId === currentUser.userId);
//         if (loggedInUser) {
//           setSelectedUser(loggedInUser);
//         }
//       }
//     }
//   }, [currentUser, users, isAdmin]);

//   const quickSelectOptions = [
//     {
//       label: "Today",
//       range: {
//         from: new Date(),
//         to: new Date(),
//       },
//     },
//     {
//       label: "Yesterday",
//       range: {
//         from: subDays(new Date(), 1),
//         to: subDays(new Date(), 1),
//       },
//     },
//     {
//       label: "This Week",
//       range: {
//         from: startOfWeek(new Date()),
//         to: endOfWeek(new Date()),
//       },
//     },
//     {
//       label: "This Month",
//       range: {
//         from: startOfMonth(new Date()),
//         to: endOfMonth(new Date()),
//       },
//     },
//     {
//       label: "Previous Month",
//       range: {
//         from: startOfMonth(subMonths(new Date(), 1)),
//         to: endOfMonth(subMonths(new Date(), 1)),
//       },
//     },
//   ];

//   const handleDateRangeChange = (range: DateRange | undefined) => {
//     setTempDateRange(range);
//   };

//   const handleApplyDateRange = () => {
//     setDateRange(tempDateRange);
//     setIsDatePickerOpen(false);
//     setPage(1); // Reset to first page when date range changes
//   };

//   const handleCancelDateRange = () => {
//     setTempDateRange(dateRange);
//     setIsDatePickerOpen(false);
//   };

//   const handleSort = (key: SortableField) => {
//     let direction: SortDirection = "asc";
//     if (sortConfig && sortConfig.key === key) {
//       if (sortConfig.direction === "asc") {
//         direction = "desc";
//       } else if (sortConfig.direction === "desc") {
//         direction = null;
//       }
//     }
//     setSortConfig(direction ? { key, direction } : null);
//     setPage(1); // Reset to first page when sorting changes
//   };

//   const getClientName = (clientId: number) => {
//     const client = clients?.find((client) => client.id === clientId);
//     return client ? client.domainName : "Unknown client";
//   };

//   const calculateTimeSpentInMinutes = (
//     taskId: number,
//     startDate: string | null | undefined,
//     dueDate: string | null | undefined,
//     allTasks: typeof tasks,
//   ) => {
//     if (!startDate || !dueDate) return 0;

//     const start = new Date(startDate);
//     const due = new Date(dueDate);

//     const currentTask = allTasks.find((t) => t.id === taskId);
//     if (!currentTask) return calculateBusinessMinutes(start, due);

//     const overlappingTasks = allTasks.filter(
//       (t) =>
//         t.id !== taskId &&
//         t.startDate &&
//         t.dueDate &&
//         new Date(t.startDate) < due &&
//         new Date(t.dueDate) > start &&
//         t.assignedUsers?.some((user) =>
//           currentTask.assignedUsers?.some((u) => u.userId === user.userId),
//         ),
//     );

//     const isContained = overlappingTasks.some((overlapTask) => {
//       if (!overlapTask.startDate || !overlapTask.dueDate) return false;
//       return (
//         new Date(overlapTask.startDate) <= start &&
//         new Date(overlapTask.dueDate) >= due
//       );
//     });

//     if (isContained) {
//       return calculateBusinessMinutes(start, due);
//     }

//     let timeBlocks: { start: Date; end: Date }[] = [{ start, end: due }];

//     overlappingTasks.forEach((overlapTask) => {
//       if (!overlapTask.startDate || !overlapTask.dueDate) return;

//       const overlapStart = new Date(overlapTask.startDate);
//       const overlapEnd = new Date(overlapTask.dueDate);

//       const newBlocks: typeof timeBlocks = [];

//       timeBlocks.forEach((block) => {
//         if (overlapStart <= block.start && overlapEnd >= block.end) {
//           return;
//         } else if (overlapStart > block.start && overlapEnd < block.end) {
//           newBlocks.push({ start: block.start, end: overlapStart });
//           newBlocks.push({ start: overlapEnd, end: block.end });
//         } else if (overlapStart <= block.start && overlapEnd > block.start) {
//           newBlocks.push({ start: overlapEnd, end: block.end });
//         } else if (overlapStart < block.end && overlapEnd >= block.end) {
//           newBlocks.push({ start: block.start, end: overlapStart });
//         } else {
//           newBlocks.push(block);
//         }
//       });

//       timeBlocks = newBlocks;
//     });

//     let totalMinutes = 0;

//     timeBlocks.forEach((block) => {
//       totalMinutes += calculateBusinessMinutes(block.start, block.end);
//     });

//     return totalMinutes;
//   };

//   const calculateBusinessMinutes = (start: Date, end: Date) => {
//     let totalMinutes = 0;
//     const workDayStartHour = 10;
//     const workDayEndHour = 18;

//     const current = new Date(start);

//     while (current < end) {
//       const dayOfWeek = current.getDay();
//       const isSaturday = dayOfWeek === 6;

//       if (!isSaturday) {
//         const dayStart = new Date(current);
//         dayStart.setHours(workDayStartHour, 0, 0, 0);

//         const dayEnd = new Date(current);
//         dayEnd.setHours(workDayEndHour, 0, 0, 0);

//         const effectiveStart = current > dayStart ? current : dayStart;
//         const effectiveEnd = end < dayEnd ? end : dayEnd;

//         if (effectiveStart < effectiveEnd) {
//           const minutesThisDay =
//             (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60);
//           totalMinutes += minutesThisDay;
//         }
//       }

//       current.setDate(current.getDate() + 1);
//       current.setHours(workDayStartHour, 0, 0, 0);
//     }

//     return totalMinutes;
//   };

//   const calculateTimeSpent = (
//     taskId: number,
//     startDate: string | null | undefined,
//     dueDate: string | null | undefined,
//     allTasks: typeof tasks,
//   ) => {
//     const minutes = calculateTimeSpentInMinutes(
//       taskId,
//       startDate,
//       dueDate,
//       allTasks,
//     );
//     return formatDuration(minutes);
//   };

//   const formatDuration = (totalMinutes: number) => {
//     const workDayMinutes = (18 - 10) * 60;
//     const days = Math.floor(totalMinutes / workDayMinutes);
//     const remainingMinutes = totalMinutes % workDayMinutes;
//     const hours = Math.floor(remainingMinutes / 60);
//     const minutes = Math.floor(remainingMinutes % 60);

//     const parts = [];
//     if (days > 0) parts.push(`${days}d`);
//     if (hours > 0) parts.push(`${hours}h`);
//     if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

//     if (parts.length > 1) {
//       const last = parts.pop();
//       return `${parts.join(", ")} & ${last}`;
//     }
//     return parts.join("") || "0m";
//   };

//   const filteredTasks = tasks.filter((task) => {
//     const userMatch =
//       !selectedUser ||
//       task.assignedUsers?.some((user) => user.userId === selectedUser.userId);

//     const statusMatch = task.status === "Completed";

//     let dateMatch = true;
//     if (dateRange?.from || dateRange?.to) {
//       const taskDate = task.dueDate
//         ? new Date(task.dueDate)
//         : task.startDate
//           ? new Date(task.startDate)
//           : null;

//       if (!taskDate) {
//         dateMatch = false;
//       } else if (dateRange.from && dateRange.to) {
//         dateMatch = isWithinInterval(taskDate, {
//           start: dateRange.from,
//           end: dateRange.to,
//         });
//       } else if (dateRange.from) {
//         dateMatch = isSameDay(taskDate, dateRange.from);
//       }
//     }

//     return userMatch && statusMatch && dateMatch;
//   });

//   const sortedAndFilteredTasks = React.useMemo(() => {
//     if (!sortConfig || !filteredTasks) return filteredTasks;

//     return [...filteredTasks].sort((a, b) => {
//       let aValue, bValue;

//       switch (sortConfig.key) {
//         case "startDate":
//           aValue = a.startDate ? new Date(a.startDate).getTime() : 0;
//           bValue = b.startDate ? new Date(b.startDate).getTime() : 0;
//           break;
//         case "dueDate":
//           aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
//           bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
//           break;
//         case "timeSpent":
//           aValue = calculateTimeSpentInMinutes(
//             a.id,
//             a.startDate,
//             a.dueDate,
//             tasks,
//           );
//           bValue = calculateTimeSpentInMinutes(
//             b.id,
//             b.startDate,
//             b.dueDate,
//             tasks,
//           );
//           break;
//         default:
//           return 0;
//       }

//       if (aValue < bValue) {
//         return sortConfig.direction === "asc" ? -1 : 1;
//       }
//       if (aValue > bValue) {
//         return sortConfig.direction === "asc" ? 1 : -1;
//       }
//       return 0;
//     });
//   }, [filteredTasks, sortConfig, tasks]);

//   const getSortIcon = (key: SortableField) => {
//     if (!sortConfig || sortConfig.key !== key) {
//       return (
//         <div className="ml-1 flex flex-col">
//           <ChevronUp className="h-3 w-3 opacity-100" />
//           <ChevronDown className="-mt-1 h-3 w-3 opacity-100" />
//         </div>
//       );
//     }

//     return (
//       <div className="ml-1 flex flex-col">
//         <ChevronUp
//           className={`h-3 w-3 ${sortConfig.direction === "asc" ? "opacity-100" : "opacity-20"}`}
//         />
//         <ChevronDown
//           className={`-mt-1 h-3 w-3 ${sortConfig.direction === "desc" ? "opacity-100" : "opacity-20"}`}
//         />
//       </div>
//     );
//   };

//   // Calculate paginated tasks
//   const paginatedTasks = sortedAndFilteredTasks.slice(
//     (page - 1) * rowsPerPage,
//     page * rowsPerPage
//   );

//   const displayedTasks = showTopRows !== undefined
//     ? sortedAndFilteredTasks.slice(0, showTopRows)
//     : paginatedTasks;

//   const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
//     setPage(newPage);
//   };

//   return (
//     <div>
//       <div className="mb-4 flex items-center justify-between">
//         <h1 className="text-2xl font-semibold dark:text-gray-300">
//           {title || "Team Reports"}
//         </h1>
//         <div className="flex gap-2">
//           {isAdmin && (
//             <Popover open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
//               <PopoverTrigger asChild>
//                 <Button
//                   variant="outline"
//                   className="flex items-center gap-2 border dark:border-gray-600 dark:text-gray-300"
//                 >
//                   <Users className="h-4 w-4" />
//                   {selectedUser
//                     ? `${selectedUser.firstname} ${selectedUser.lastname}`
//                     : "All Assignee"}
//                 </Button>
//               </PopoverTrigger>
//               <PopoverContent className="w-64 border p-2 dark:border-gray-600">
//                 <div className="space-y-2">
//                   <Button
//                     variant="ghost"
//                     className="w-full justify-start"
//                     onClick={() => {
//                       setSelectedUser(null);
//                       setIsAssigneeOpen(false);
//                     }}
//                   >
//                     All Assignee
//                   </Button>
//                   {[...users]
//                     .sort((a, b) => {
//                       const indexA = customOrder.indexOf(String(a.userId));
//                       const indexB = customOrder.indexOf(String(b.userId));
//                       return (
//                         (indexA === -1 ? 999 : indexA) -
//                         (indexB === -1 ? 999 : indexB)
//                       );
//                     })
//                     .map((user) => (
//                       <Button
//                         key={user.userId}
//                         variant="ghost"
//                         className="w-full justify-start gap-2"
//                         onClick={() => {
//                           setSelectedUser(user);
//                           setIsAssigneeOpen(false);
//                         }}
//                       >
//                         <Avatar className="h-6 w-6">
//                           <AvatarImage src={user.profilePictureUrl} />
//                           <AvatarFallback>
//                             {user.firstname?.[0]}
//                             {user.lastname?.[0]}
//                           </AvatarFallback>
//                         </Avatar>
//                         {user.firstname} {user.lastname}
//                       </Button>
//                     ))}
//                 </div>
//               </PopoverContent>
//             </Popover>
//           )}

//           <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
//             <PopoverTrigger asChild>
//               <Button
//                 variant="outline"
//                 className={cn(
//                   "justify-start border text-left font-normal dark:border-gray-600 dark:text-gray-300",
//                   !dateRange && "text-muted-foreground",
//                 )}
//               >
//                 <CalendarIcon className="mr-2 h-4 w-4" />
//                 {dateRange?.from ? (
//                   dateRange.to ? (
//                     <>
//                       {format(dateRange.from, "MMM dd")} -{" "}
//                       {format(dateRange.to, "MMM dd")}
//                     </>
//                   ) : (
//                     format(dateRange.from, "MMM dd, yyyy")
//                   )
//                 ) : (
//                   <span>Select date</span>
//                 )}
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-auto p-0" align="end">
//               <div className="flex">
//                 <div className="flex flex-col border-r p-2">
//                   {quickSelectOptions.map((option) => (
//                     <Button
//                       key={option.label}
//                       variant="ghost"
//                       className={cn(
//                         "justify-start text-left",
//                         tempDateRange?.from &&
//                           tempDateRange.from.getTime() ===
//                             option.range.from.getTime() &&
//                           (!tempDateRange?.to ||
//                             (option.range.to &&
//                               tempDateRange.to.getTime() ===
//                                 option.range.to.getTime()))
//                           ? "bg-blue-500 text-white"
//                           : "",
//                       )}
//                       onClick={() => setTempDateRange(option.range)}
//                     >
//                       {option.label}
//                     </Button>
//                   ))}
//                 </div>
//                 <div>
//                   <Calendar
//                     initialFocus
//                     mode="range"
//                     defaultMonth={tempDateRange?.from}
//                     selected={tempDateRange}
//                     onSelect={handleDateRangeChange}
//                     numberOfMonths={2}
//                   />
//                   <div className="flex items-center justify-end gap-2 border-t p-2">
//                     <Button variant="outline" onClick={handleCancelDateRange}>
//                       Cancel
//                     </Button>
//                     <Button onClick={handleApplyDateRange}>Apply</Button>
//                   </div>
//                 </div>
//               </div>
//             </PopoverContent>
//           </Popover>
//         </div>
//       </div>

//       <Card className="dark:bg-secondary-dark border dark:border-gray-700">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>User</TableHead>
//               <TableHead>Task</TableHead>
//               <TableHead>Project</TableHead>
//               <TableHead
//                 className="cursor-pointer hover:bg-gray-50"
//                 onClick={() => handleSort("startDate")}
//               >
//                 <div className="flex items-center">
//                   Start Date
//                   {getSortIcon("startDate")}
//                 </div>
//               </TableHead>
//               <TableHead
//                 className="cursor-pointer hover:bg-gray-50"
//                 onClick={() => handleSort("dueDate")}
//               >
//                 <div className="flex items-center">
//                   Due Date
//                   {getSortIcon("dueDate")}
//                 </div>
//               </TableHead>
//               <TableHead
//                 className="cursor-pointer hover:bg-gray-50"
//                 onClick={() => handleSort("timeSpent")}
//               >
//                 <div className="flex items-center">
//                   Time Spent
//                   {getSortIcon("timeSpent")}
//                 </div>
//               </TableHead>
//             </TableRow>
//           </TableHeader>
//           {!tasks || !users || !clients ? (
//             <TableBody>
//               {[...Array(5)].map((_, i) => (
//                 <TableRow key={i}>
//                   <TableCell>
//                     <div className="flex items-center gap-2">
//                       <Skeleton className="h-6 w-6 rounded-full" />
//                       <Skeleton className="h-4 w-24" />
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     <Skeleton className="h-4 w-32" />
//                   </TableCell>
//                   <TableCell>
//                     <Skeleton className="h-4 w-24" />
//                   </TableCell>
//                   <TableCell>
//                     <Skeleton className="h-4 w-36" />
//                   </TableCell>
//                   <TableCell>
//                     <Skeleton className="h-4 w-36" />
//                   </TableCell>
//                   <TableCell>
//                     <Skeleton className="h-4 w-20" />
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           ) : (
//             <TableBody className="text-gray-950 dark:text-gray-300">
//               {displayedTasks.map((task) => (
//                 <TableRow key={task.id}>
//                   <TableCell>
//                     {task.assignedUsers?.map((user) => (
//                       <div key={user.userId} className="flex items-center gap-2">
//                         <Avatar className="h-6 w-6">
//                           <AvatarImage src={user.profilePictureUrl} />
//                           <AvatarFallback>
//                             {user.firstname?.[0]}
//                             {user.lastname?.[0]}
//                           </AvatarFallback>
//                         </Avatar>
//                         <span>
//                           {user.firstname} {user.lastname}
//                         </span>
//                       </div>
//                     ))}
//                   </TableCell>
//                   <TableCell>{task.title}</TableCell>
//                   <TableCell>{getClientName(task.clientId)}</TableCell>
//                   <TableCell>
//                     {task.startDate
//                       ? format(new Date(task.startDate), "MMM dd, yyyy h:mm a")
//                       : "N/A"}
//                   </TableCell>
//                   <TableCell>
//                     {task.dueDate
//                       ? format(new Date(task.dueDate), "MMM dd, yyyy h:mm a")
//                       : "N/A"}
//                   </TableCell>
//                   <TableCell>
//                     {calculateTimeSpent(
//                       task.id,
//                       task.startDate,
//                       task.dueDate,
//                       tasks,
//                     )}
//                   </TableCell>
//                 </TableRow>
//               ))}
//               {displayedTasks.length === 0 && (
//                 <TableRow>
//                   <TableCell colSpan={6} className="py-4 text-center">
//                     No tasks found
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           )}
//         </Table>
//       </Card>

//       {showTopRows === undefined && sortedAndFilteredTasks.length > rowsPerPage && (
//         <div className="mt-4 flex justify-center">
//           <Pagination
//             count={Math.ceil(sortedAndFilteredTasks.length / rowsPerPage)}
//             page={page}
//             onChange={handlePageChange}
//             color="primary"
//             className="dark:text-gray-300"
//             sx={{
//               '& .MuiPaginationItem-root': {
//                 color: 'inherit',
//               },
//               '& .Mui-selected': {
//                 backgroundColor: 'rgba(59, 130, 246, 0.5)',
//               },
//             }}
//           />
//         </div>
//       )}
//     </div>
//   );
// };

import React from 'react'

type Props = {}

const TeamReportsTable = (props: Props) => {
  return (
    <div>TeamReportsTable</div>
  )
}

export default TeamReportsTable