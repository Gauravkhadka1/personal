"use client";

import React, { useState, useEffect } from "react";
import {
  useGetClientsListQuery,
  useDeleteClientMutation,
  useGetClientCountsQuery,
  useGetClientDesignCountsQuery,
  useGetClientsByDesignCriteriaQuery,
  Client,
  ClientDesignCounts,
  ClientsResponse,
  isDesignCriteriaResponse,
  isListResponse,
  getClientsFromResponse,
  getTotalPagesFromResponse,
  getCurrentPageFromResponse,
  getTotalCountFromResponse,
} from "@/state/api";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MoreVertical,
  EyeIcon,
  TrashIcon,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import withRoleAuth from "../../../hoc/withRoleAuth";

// Helper function to safely get categories as array
const getCategoriesAsArray = (client: Client): string[] => {
  // Check if webDesignCategories exists and is an array
  if (client.webDesignCategories && Array.isArray(client.webDesignCategories)) {
    return client.webDesignCategories.filter(cat => cat && typeof cat === 'string');
  }
  
  // // Fallback to webDesignCategory (string) if it exists
  // if (client.webDesignCategories && typeof client.webDesignCategories === 'string') {
  //   // If it's a comma-separated string, split it
  //   if (client.webDesignCategories.includes(',')) {
  //     return client.webDesignCategories.split(',').map(c => c.trim()).filter(c => c);
  //   }
  //   return [client.webDesignCategories];
  // }
  
  return [];
};

// Helper function to format categories for display
const formatCategories = (client: Client): string => {
  const categories = getCategoriesAsArray(client);
  if (categories.length === 0) return "-";
  if (categories.length === 1) return categories[0];
  return `${categories[0]} +${categories.length - 1}`;
};

// Helper function to get category badges for tooltip or full display
const getCategoryBadges = (client: Client): string[] => {
  return getCategoriesAsArray(client);
};

const ClientListPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTechStacks, setSelectedTechStacks] = useState<string[]>([]);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const pageSize = 10;

  // Get design counts for filters
  const { data: designCountsData } = useGetClientDesignCountsQuery();

  // Determine which query to use based on filters
  const hasDesignFilters =
    selectedCategories.length > 0 || selectedTechStacks.length > 0;

  // Regular clients query
  const {
    data: paginatedData,
    isLoading: isLoadingClients,
    isError: isClientsError,
    error: clientsError,
  } = useGetClientsListQuery(
    {
      page: currentPage,
      pageSize,
      search: searchQuery,
    },
    {
      skip: hasDesignFilters,
    },
  );

  // Design filtered clients query
  const {
    data: designFilteredData,
    isLoading: isLoadingDesignClients,
    isError: isDesignClientsError,
    error: designClientsError,
  } = useGetClientsByDesignCriteriaQuery(
    {
      category: selectedCategories.length > 0 ? selectedCategories : undefined,
      techStack: selectedTechStacks.length > 0 ? selectedTechStacks : undefined,
      page: currentPage,
      pageSize,
      sortBy: "webDesignRating",
      sortOrder: "desc",
    },
    {
      skip: !hasDesignFilters,
    },
  );

  // Use appropriate data based on filters
  const currentData: ClientsResponse | undefined = hasDesignFilters
    ? designFilteredData
    : paginatedData;
  const isLoading = hasDesignFilters
    ? isLoadingDesignClients
    : isLoadingClients;
  const isError = hasDesignFilters ? isDesignClientsError : isClientsError;
  const error = hasDesignFilters ? designClientsError : clientsError;

  // Get data using helper functions
  const clients = currentData ? getClientsFromResponse(currentData) : [];
  const totalPages = currentData ? getTotalPagesFromResponse(currentData) : 1;
  const totalCount = currentData ? getTotalCountFromResponse(currentData) : 0;

  const { data: countsData } = useGetClientCountsQuery();
  const [deleteClient] = useDeleteClientMutation();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [dropdownOpenId, setDropdownOpenId] = useState<number | null>(null);
  const [hoveredCategoryClient, setHoveredCategoryClient] = useState<number | null>(null);

  const handleViewClient = (id: number) => {
    router.push(`/clients/${id}`);
  };

  const handleDeleteClick = (id: number) => {
    setClientToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (clientToDelete) {
      try {
        await deleteClient(clientToDelete).unwrap();
        setDeleteDialogOpen(false);
        setClientToDelete(null);
        setDropdownOpenId(null);
        setCurrentPage(1);
      } catch (error) {
        console.error("Failed to delete client:", error);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const handleTechStackToggle = (techStack: string) => {
    setSelectedTechStacks((prev) =>
      prev.includes(techStack)
        ? prev.filter((t) => t !== techStack)
        : [...prev, techStack],
    );
  };

  const handleApplyFilters = () => {
    setIsFilterDialogOpen(false);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedTechStacks([]);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 || selectedTechStacks.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
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

  return (
    <div className="relative p-4">
      <div className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-secondary-dark">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Client List
              </h1>
              <span className="rounded-full bg-gray-200 px-2 py-1 text-sm text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                {countsData?.totalClients || 0}
              </span>
            </div>

            <div className="flex space-x-2">
              <div className="mb-4">
                <div className="relative rounded-md border dark:border-gray-400">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-200" />
                  <Input
                    type="search"
                    placeholder="Search by Domain, Company Name or Contact Person"
                    className="min-w-[380px] pl-9 dark:text-gray-200"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-200 dark:hover:text-gray-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <Button onClick={() => router.push("/clients/create")}>
                <Plus className="h-4 w-4" />
                Create Client
              </Button>

              <div className="flex space-x-2">
                <Dialog
                  open={isFilterDialogOpen}
                  onOpenChange={setIsFilterDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="dark:border-gray-700 dark:text-gray-300"
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                      {hasActiveFilters && (
                        <span className="ml-2 rounded-full bg-blue-600 px-2 py-1 text-xs text-white">
                          {selectedCategories.length +
                            selectedTechStacks.length}
                        </span>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl h-[95%] dark:border-gray-700 dark:bg-secondary-dark">
                    <DialogHeader>
                      <DialogTitle className="text-gray-800 dark:text-gray-300">
                        Filter
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* Categories Filter - Updated to two columns */}
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-300">
                          Categories ({selectedCategories.length} selected)
                        </h3>
                        <ScrollArea className="h-70 rounded-md border p-4 dark:border-gray-700">
                          <div className="grid grid-cols-2 gap-x-16 gap-y-2">
                            {designCountsData?.categories &&
                              Object.entries(designCountsData.categories).map(
                                ([category, count]) => (
                                  <div
                                    key={category}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`category-${category}`}
                                      checked={selectedCategories.includes(
                                        category,
                                      )}
                                      onCheckedChange={() =>
                                        handleCategoryToggle(category)
                                      }
                                      className="dark:border-gray-600"
                                    />
                                    <Label
                                      htmlFor={`category-${category}`}
                                      className="flex-1 cursor-pointer text-sm text-gray-800 dark:text-gray-300"
                                    >
                                      {category}
                                    </Label>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {count}
                                    </span>
                                  </div>
                                ),
                              )}
                          </div>
                        </ScrollArea>
                      </div>

                      <Separator className="dark:bg-gray-700" />

                      {/* Tech Stack Filter - Reduced height */}
                      <div>
                        <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-300">
                          Tech Stack ({selectedTechStacks.length} selected)
                        </h3>
                        <ScrollArea className="h-70 rounded-md border p-4 dark:border-gray-700">
                          <div className="space-y-2">
                            {designCountsData?.techStacks &&
                              Object.entries(designCountsData.techStacks).map(
                                ([techStack, count]) => (
                                  <div
                                    key={techStack}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`techstack-${techStack}`}
                                      checked={selectedTechStacks.includes(
                                        techStack,
                                      )}
                                      onCheckedChange={() =>
                                        handleTechStackToggle(techStack)
                                      }
                                      className="dark:border-gray-600"
                                    />
                                    <Label
                                      htmlFor={`techstack-${techStack}`}
                                      className="flex-1 cursor-pointer text-sm text-gray-800 dark:text-gray-300"
                                    >
                                      {techStack}
                                    </Label>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {count}
                                    </span>
                                  </div>
                                ),
                              )}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={handleClearFilters}
                          className="dark:border-gray-600 dark:text-gray-300"
                        >
                          Clear Filters
                        </Button>
                        <Button onClick={handleApplyFilters} className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700">
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Active filters:
              </span>
              {selectedCategories.map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {category}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleCategoryToggle(category)}
                  />
                </span>
              ))}
              {selectedTechStacks.map((techStack) => (
                <span
                  key={techStack}
                  className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  {techStack}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={() => handleTechStackToggle(techStack)}
                  />
                </span>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear all
              </Button>
            </div>
          )}

          <div className="rounded-lg border dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] text-gray-800 dark:text-gray-300">
                    Company Name
                  </TableHead>
                  <TableHead className="text-gray-800 dark:text-gray-300">
                    Domain Name
                  </TableHead>
                  <TableHead className="text-gray-800 dark:text-gray-300">
                    Contact Person
                  </TableHead>
                  <TableHead className="text-gray-800 dark:text-gray-300">
                    Categories
                  </TableHead>
                  <TableHead className="text-gray-800 dark:text-gray-300">
                    Tech Stack
                  </TableHead>
                  <TableHead className="text-gray-800 dark:text-gray-300">
                    Rating
                  </TableHead>
                  <TableHead className="text-right text-gray-800 dark:text-gray-300">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      {searchQuery || hasActiveFilters
                        ? `No clients found matching your criteria`
                        : "No clients found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => {
                    const categories = getCategoriesAsArray(client);
                    const displayCategories = formatCategories(client);
                    const allCategories = getCategoryBadges(client);
                    
                    return (
                      <TableRow
                        key={client.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <TableCell
                          onClick={() => handleViewClient(client.id)}
                          className="cursor-pointer font-medium text-gray-800 hover:underline dark:text-gray-300"
                        >
                          {client.companyName}
                        </TableCell>
                        <TableCell className="text-blue-600 dark:text-blue-400">
                          <a
                            href={`https://${client.domainName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline"
                          >
                            {client.domainName}
                          </a>
                        </TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">
                          {client.contactPerson}
                        </TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">
                          {categories.length > 0 ? (
                            <div 
                              className="relative"
                              onMouseEnter={() => setHoveredCategoryClient(client.id)}
                              onMouseLeave={() => setHoveredCategoryClient(null)}
                            >
                              <span className="cursor-help">
                                {displayCategories}
                              </span>
                              {hoveredCategoryClient === client.id && allCategories.length > 1 && (
                                <div className="absolute z-10 mt-1 rounded-md bg-gray-900 px-3 py-2 text-sm text-white shadow-lg dark:bg-gray-800">
                                  <div className="space-y-1">
                                    {allCategories.map((cat, idx) => (
                                      <div key={idx} className="whitespace-nowrap">
                                        {cat}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">
                          {client.webDesignTechStack || "-"}
                        </TableCell>
                        <TableCell className="text-gray-800 dark:text-gray-300">
                          {client.webDesignRating || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu
                            open={dropdownOpenId === client.id}
                            onOpenChange={(open) => {
                              if (open) {
                                setDropdownOpenId(client.id);
                              } else {
                                setDropdownOpenId(null);
                              }
                            }}
                          >
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDropdownOpenId((prev) =>
                                    prev === client.id ? null : client.id,
                                  );
                                }}
                              >
                                <MoreVertical className="h-4 w-4 text-gray-800 dark:text-gray-300" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-40 dark:border-gray-700 dark:bg-secondary-dark"
                            >
                              <DropdownMenuItem
                                onClick={() => handleViewClient(client.id)}
                                className="cursor-pointer text-gray-800 focus:bg-gray-100 dark:text-gray-300 dark:focus:bg-gray-700"
                              >
                                <EyeIcon className="mr-2 h-4 w-4" />
                                <span>View Client</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(client.id)}
                                className="cursor-pointer text-red-600 focus:bg-gray-100 focus:text-red-600 dark:text-red-400 dark:focus:bg-gray-700 dark:focus:text-red-400"
                              >
                                <TrashIcon className="mr-2 h-4 w-4" />
                                <span>Delete Client</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="dark:border-gray-700 dark:text-gray-300"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="dark:border-gray-700 dark:text-gray-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={
                          currentPage === pageNum
                            ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                            : "dark:border-gray-700 dark:text-gray-300"
                        }
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="dark:border-gray-700 dark:text-gray-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="dark:border-gray-700 dark:text-gray-300"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="dark:border-gray-700 dark:bg-secondary-dark">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800 dark:text-gray-300">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
              This action cannot be undone. This will permanently delete the
              client and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default withRoleAuth(ClientListPage, ["ADMIN"]);