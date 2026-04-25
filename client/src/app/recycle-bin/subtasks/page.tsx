// client/src/app/recycle-bin/subtasks/page.tsx
"use client";

import React, { useState } from "react";
import {
  useGetAllDeletedSubtasksQuery,
  useGetMyDeletedSubtasksQuery, // Add this import
  useRestoreSubtaskMutation,
  usePermanentlyDeleteSubtaskMutation,
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

interface DeletedSubtask {
  id: number;
  title: string;
  deletedAt: string;
  parentTask: {
    id: number;
    title: string;
    client: {
      id: number;
      domainName?: string;
      companyName?: string;
    };
  };
  assignedUsers: User[];
}

const DeletedSubtasksPage = () => {
  const { user } = useAuth();
  const { data: allDeletedSubtasks = [], refetch: refetchAll, isLoading: isLoadingAll } = useGetAllDeletedSubtasksQuery();
  const { data: myDeletedSubtasks = [], refetch: refetchMy, isLoading: isLoadingMy } = useGetMyDeletedSubtasksQuery();
  const [restoreSubtask] = useRestoreSubtaskMutation();
  const [permanentlyDeleteSubtask] = usePermanentlyDeleteSubtaskMutation();
  const [isRestoring, setIsRestoring] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Use appropriate data based on user role
  const deletedSubtasks = user?.role === "ADMIN" ? allDeletedSubtasks : myDeletedSubtasks;
  const isLoading = user?.role === "ADMIN" ? isLoadingAll : isLoadingMy;
  const refetch = user?.role === "ADMIN" ? refetchAll : refetchMy;

  const handleRestore = async (subtaskId: number) => {
    setIsRestoring(subtaskId);
    try {
      await restoreSubtask(subtaskId).unwrap();
      toast.success("Subtask restored successfully!");
      refetch();
    } catch (error) {
      console.error("Failed to restore subtask:", error);
      toast.error("Failed to restore subtask!");
    } finally {
      setIsRestoring(null);
    }
  };

  const handlePermanentDelete = async (subtaskId: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this subtask? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(subtaskId);
    try {
      await permanentlyDeleteSubtask(subtaskId).unwrap();
      toast.success("Subtask permanently deleted!");
      refetch();
    } catch (error) {
      console.error("Failed to delete subtask:", error);
      toast.error("Failed to delete subtask!");
    } finally {
      setIsDeleting(null);
    }
  };

  // Filter subtasks based on search term
  const filteredSubtasks = deletedSubtasks.filter((subtask: DeletedSubtask) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      subtask.title.toLowerCase().includes(searchLower) ||
      subtask.parentTask.title.toLowerCase().includes(searchLower) ||
      (subtask.parentTask.client.domainName?.toLowerCase().includes(searchLower) || false) ||
      (subtask.parentTask.client.companyName?.toLowerCase().includes(searchLower) || false)
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
            <span>Deleted Subtasks</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {filteredSubtasks.length} deleted subtasks
              </Badge>
              {user?.role !== "ADMIN" && (
                <Badge variant="outline" className="text-xs">
                  Only your deleted subtasks
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
                placeholder="Search by subtask, task, domain, or company..."
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
              <p>Loading deleted subtasks...</p>
            </div>
          ) : filteredSubtasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {searchTerm ? (
                <p>No deleted subtasks match your search.</p>
              ) : user?.role === "ADMIN" ? (
                <p>No deleted subtasks found.</p>
              ) : (
                <p>You haven't deleted any subtasks yet.</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subtask Title</TableHead>
                  <TableHead>Parent Task</TableHead>
                  <TableHead>Client/Domain</TableHead>
                  <TableHead>Assigned Users</TableHead>
                  <TableHead>Deleted Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubtasks.map((subtask: DeletedSubtask) => (
                  <TableRow key={subtask.id}>
                    <TableCell className="font-medium">
                      {subtask.title}
                    </TableCell>
                    <TableCell>
                      {subtask.parentTask?.title || "N/A"}
                    </TableCell>
                    <TableCell>
                      {subtask.parentTask.client.companyName || 
                       subtask.parentTask.client.domainName || 
                       "N/A"}
                    </TableCell>
                    <TableCell>
                      {subtask.assignedUsers?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {subtask.assignedUsers.map((user: User) => (
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
                      {subtask.deletedAt
                        ? format(new Date(subtask.deletedAt), "MMM d, yyyy HH:mm")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(subtask.id)}
                          disabled={isRestoring === subtask.id}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          {isRestoring === subtask.id ? "Restoring..." : "Restore"}
                        </Button>
                        {user?.role === "ADMIN" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handlePermanentDelete(subtask.id)}
                            disabled={isDeleting === subtask.id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {isDeleting === subtask.id ? "Deleting..." : "Delete Permanently"}
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

export default DeletedSubtasksPage;