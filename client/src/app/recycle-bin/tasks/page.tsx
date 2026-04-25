// client/src/app/recycle-bin/tasks/page.tsx
"use client";

import React, { useState } from "react";
import {
  useGetAllDeletedTasksQuery,
  useGetMyDeletedTasksQuery, // Add this import
  useRestoreTaskMutation,
  usePermanentlyDeleteTaskMutation,
  User,
} from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Trash2, AlertCircle, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

interface DeletedTask {
  id: number;
  title: string;
  deletedAt: string;
  client: {
    id: number;
    domainName?: string;
    companyName?: string;
  };
  assignedUsers: User[];
}

const DeletedTasksPage = () => {
  const { user } = useAuth();
  const { data: allDeletedTasks = [], refetch: refetchAll, isLoading: isLoadingAll } = useGetAllDeletedTasksQuery();
  const { data: myDeletedTasks = [], refetch: refetchMy, isLoading: isLoadingMy } = useGetMyDeletedTasksQuery();
  const [restoreTask] = useRestoreTaskMutation();
  const [permanentlyDeleteTask] = usePermanentlyDeleteTaskMutation();
  const [isRestoring, setIsRestoring] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Use appropriate data based on user role
  const deletedTasks = user?.role === "ADMIN" ? allDeletedTasks : myDeletedTasks;
  const isLoading = user?.role === "ADMIN" ? isLoadingAll : isLoadingMy;
  const refetch = user?.role === "ADMIN" ? refetchAll : refetchMy;

  const handleRestore = async (taskId: number) => {
    setIsRestoring(taskId);
    try {
      await restoreTask(taskId).unwrap();
      toast.success("Task restored successfully!");
      refetch();
    } catch (error) {
      console.error("Failed to restore task:", error);
      toast.error("Failed to restore task!");
    } finally {
      setIsRestoring(null);
    }
  };

  const handlePermanentDelete = async (taskId: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this task? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(taskId);
    try {
      await permanentlyDeleteTask(taskId).unwrap();
      toast.success("Task permanently deleted!");
      refetch();
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task!");
    } finally {
      setIsDeleting(null);
    }
  };

  // Filter tasks based on search term
  const filteredTasks = deletedTasks.filter((task: DeletedTask) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      task.title.toLowerCase().includes(searchLower) ||
      (task.client.domainName?.toLowerCase().includes(searchLower) || false) ||
      (task.client.companyName?.toLowerCase().includes(searchLower) || false)
    );
  });

  // Check if user has access to recycle bin
  const hasAccess = user?.role === "ADMIN" || user?.role === "DESIGNER" || user?.role === "DEVELOPER" || user?.role === "INTERN";

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Only administrators, designers, and developers can access the recycle bin.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Deleted Tasks</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {filteredTasks.length} deleted tasks
              </Badge>
              {user?.role !== "ADMIN" && (
                <Badge variant="outline" className="text-xs">
                  Only your deleted tasks
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by task title, domain, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p>Loading deleted tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {searchTerm ? (
                <p>No deleted tasks match your search.</p>
              ) : user?.role === "ADMIN" ? (
                <p>No deleted tasks found.</p>
              ) : (
                <p>You haven't deleted any tasks yet.</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Title</TableHead>
                  <TableHead>Client/Domain</TableHead>
                  <TableHead>Assigned Users</TableHead>
                  <TableHead>Deleted Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task: DeletedTask) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      {task.title}
                    </TableCell>
                    <TableCell>
                      {task.client.companyName || 
                       task.client.domainName || 
                       "N/A"}
                    </TableCell>
                    <TableCell>
                      {task.assignedUsers?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {task.assignedUsers.map((user: User) => (
                            <Badge key={user.userId} variant="outline" className="text-xs">
                              {user.firstname} {user.lastname}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {task.deletedAt
                        ? format(new Date(task.deletedAt), "MMM d, yyyy HH:mm")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(task.id)}
                          disabled={isRestoring === task.id}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          {isRestoring === task.id ? "Restoring..." : "Restore"}
                        </Button>
                        {user?.role === "ADMIN" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handlePermanentDelete(task.id)}
                            disabled={isDeleting === task.id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {isDeleting === task.id ? "Deleting..." : "Delete Permanently"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeletedTasksPage;