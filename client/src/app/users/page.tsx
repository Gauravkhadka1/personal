"use client";
import { useGetUsersQuery, useUpdateUserRoleMutation } from "@/state/api";
import React, { useState } from "react";
import Header from "@/components/Header";
import withRoleAuth from "../../hoc/withRoleAuth";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone } from "lucide-react";

const restrictedUserIds = ["11", "24", "26", "30"];
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

const Users = () => {
  const { data: users, isLoading, isError } = useGetUsersQuery();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  let filteredUsers = users || [];

  const [updateUserRole, { isLoading: isUpdating }] =
    useUpdateUserRoleMutation();
  const [pendingUpdate, setPendingUpdate] = useState<{
    userId: number;
    newRole: string;
    currentRole: string;
    username: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!isAdmin) {
    filteredUsers = filteredUsers.filter(
      (user) => !restrictedUserIds.includes(String(user.userId)),
    );
  }

  // Sort users based on custom order
  filteredUsers = [...filteredUsers].sort((a, b) => {
    const indexA = customOrder.indexOf(String(a.userId) || "");
    const indexB = customOrder.indexOf(String(b.userId) || "");
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const buildImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
  };

  const handleRoleChange = (
    userId: number,
    username: string,
    currentRole: string,
    newRole: string,
  ) => {
    if (currentRole === newRole) return;

    setPendingUpdate({
      userId,
      newRole,
      currentRole,
      username,
    });
    setIsDialogOpen(true);
  };

  const confirmRoleUpdate = async () => {
    if (!pendingUpdate) return;

    try {
      await updateUserRole({
        userId: pendingUpdate.userId,
        role: pendingUpdate.newRole,
      }).unwrap();
      toast.success("User role updated successfully!");
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role. Please try again.");
    } finally {
      setIsDialogOpen(false);
      setPendingUpdate(null);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "DESIGNER":
        return "Designer";
      case "DEVELOPER":
        return "Developer";
      case "INTERN":
        return "Intern";
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "team";
      case "DESIGNER":
        return "team";
      case "DEVELOPER":
        return "partner";
      case "INTERN":
        return "client";
      default:
        return "outline";
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError || !filteredUsers) return <div>Error fetching users</div>;

  return (
    <div className="flex w-full flex-col p-8 dark:text-gray-300">
      <div className="mb-4 flex items-center justify-between">
        <Header name="Users" />
        {isAdmin && (
          <Link href="/users/create" passHref>
            <Button>Create User</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <Card
            key={user.userId}
            className="transition-shadow hover:shadow-lg dark:bg-dark-secondary"
          >
            <CardHeader className="flex flex-col items-center pb-2">
              <Link href={`/users/user-${user.userId}`} passHref>
                <div className="relative mb-3 h-16 w-16 cursor-pointer">
                  <Avatar className="h-full w-full">
                    {user.profilePictureUrl ? (
                      <AvatarImage
                        src={buildImageUrl(user.profilePictureUrl)}
                        alt={`${user.firstname} ${user.lastname}`}
                      />
                    ) : (
                      <AvatarFallback className="text-xl">
                        {user.firstname?.charAt(0)}
                        {user.lastname?.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
              </Link>
              <div className="text-center">
                <Link href={`/users/user-${user.userId}`} passHref>
                  <h3 className="text-lg font-semibold dark:text-gray-200">
                    {user.firstname} {user.lastname}
                  </h3>
                </Link>

                <p className="text-base text-gray-500 dark:text-gray-400">
                  {getRoleDisplayName(user.role)}
                </p>
              </div>
            </CardHeader>

            <CardContent className="py-2 text-start">
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <p className="text-base text-gray-600 dark:text-gray-300">
                    {user.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <p className="text-base text-gray-600 dark:text-gray-300">
                    {user.phone}
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between pt-4">
              <Link href={`/users/user-${user.userId}`} passHref>
                <Button variant="outline" size="sm" className="text-sm">
                  View Details
                </Button>
              </Link>

            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingUpdate && (
                <>
                  Are you sure you want to change{" "}
                  <strong>{pendingUpdate.username}</strong>'s role from{" "}
                  <strong>
                    {getRoleDisplayName(pendingUpdate.currentRole)}
                  </strong>{" "}
                  to{" "}
                  <strong>{getRoleDisplayName(pendingUpdate.newRole)}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleUpdate}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default withRoleAuth(Users, ["ADMIN", "DESIGNER", "DEVELOPER"]);
