"use client";

import React, { useState } from "react";
import { useGetSupportExpiringClientsQuery } from "@/state/api";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  TableSortLabel,
  Chip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  MoreVertical,
  Search,
  ChevronUp,
  ChevronDown,
  Plus,
  Eye,
  Calendar,
  Clock,
  MessageSquare,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import Link from "next/link";
import withRoleAuth from "../../hoc/withRoleAuth";
import { Badge } from "@/components/ui/badge";

interface SupportExpiringClient {
  id: number;
  companyName: string;
  domainName: string;
  contactPerson: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  websiteSupportPeriod: string | null;
  websiteLiveDate: string | null;
  projectStatus: string;
  daysAgo: number; // Changed from daysRemaining
  daysAgoMessage: string; // New field
  status: string;
  supportStatus: string;
}

type SortKey =
  | "companyName"
  | "domainName"
  | "contactPerson"
  | "daysAgo"
  | "websiteSupportPeriod";

const SupportExpiringPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] =
    useState<SupportExpiringClient | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "asc" | "desc";
  }>({ key: "daysAgo", direction: "asc" });

  const { data: response, isLoading } = useGetSupportExpiringClientsQuery({
    page: currentPage,
    pageSize,
    search: searchTerm,
  });

  const clients = response?.clients || [];
  const totalCount = response?.totalCount || 0;
  const totalPages = response?.totalPages || 1;

  const router = useRouter();
  const searchParams = useSearchParams();

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    client: SupportExpiringClient,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setCurrentPage(value);
  };

  const handlePageSizeChange = (event: any) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  };

  const handleSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return <ChevronUp className="h-4 w-4 opacity-50 dark:opacity-70" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4 text-blue-500 dark:text-blue-400" />
    ) : (
      <ChevronDown className="h-4 w-4 text-blue-500 dark:text-blue-400" />
    );
  };

  const sortedClients = [...clients].sort((a, b) => {
    const aValue = a[sortConfig.key] || "";
    const bValue = b[sortConfig.key] || "";

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const getStatusColor = (daysAgo: number) => {
    if (daysAgo <= 30) return "text-red-600 dark:text-red-400"; // Recent expirations
    if (daysAgo <= 90) return "text-yellow-600 dark:text-yellow-400"; // Medium age
    return "text-gray-600 dark:text-gray-400"; // Older expirations
  };

  const getStatusText = (daysAgo: number, daysAgoMessage: string) => {
    return `Expired ${daysAgoMessage}`;
  };

  // Skeleton loading rows
  const skeletonRows = Array.from({ length: 5 }).map((_, index) => (
    <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
      <TableCell className="p-3 dark:border-gray-700">
        <Skeleton className="h-6 w-full rounded" />
      </TableCell>
      <TableCell className="p-3 dark:border-gray-700">
        <Skeleton className="h-6 w-full rounded" />
      </TableCell>
      <TableCell className="p-3 dark:border-gray-700">
        <Skeleton className="h-6 w-full rounded" />
      </TableCell>
      <TableCell className="p-3 dark:border-gray-700">
        <Skeleton className="h-6 w-full rounded" />
      </TableCell>
      <TableCell className="p-3 dark:border-gray-700">
        <Skeleton className="h-6 w-full rounded" />
      </TableCell>
      <TableCell className="p-3 dark:border-gray-700">
        <Skeleton className="h-6 w-6 rounded-full" />
      </TableCell>
    </TableRow>
  ));

  return (
    <Box className="p-4 dark:bg-primary-dark dark:text-gray-300 md:p-6">
      <Box className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <Box className="flex items-center gap-3">
          <Typography
            variant="h5"
            component="h1"
            className="font-semibold dark:text-gray-200"
          >
            Website Support Expired
          </Typography>
          <Chip
            label={`${totalCount}`}
            size="small"
            className="border dark:border-gray-700 dark:bg-secondary-dark dark:text-gray-300"
          />
        </Box>

        <Box className="flex w-full flex-col items-start gap-3 dark:text-gray-300 sm:flex-row sm:items-center md:w-auto">
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search by Company, Domain or Contact Person"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              width: "100%",
              minWidth: "400px",
              maxWidth: "400px",
              "& .MuiOutlinedInput-root": {
                height: "40px",
                borderRadius: "0.5rem",
                backgroundColor: "white",
                borderColor: "#d1d5db",
                "& fieldset": {
                  borderColor: "#d1d5db",
                },
                "&:hover fieldset": {
                  borderColor: "#d1d5db",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#d1d5db",
                },
                ".dark &": {
                  backgroundColor: "#1e293b",
                  color: "#9ca3af",
                  "& fieldset": {
                    borderColor: "#9ca3af",
                  },
                  "&:hover fieldset": {
                    borderColor: "#6b7280",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#d1d5db",
                  },
                },
              },
              "& input::placeholder": {
                color: "#6b7280",
                opacity: 1,
                ".dark &": {
                  color: "#9ca3af ",
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <Search className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              ),
              className: "dark:text-gray-300",
            }}
          />

          <FormControl
            size="small"
            className="h-10 min-w-[120px] border-gray-300 dark:border-gray-600"
          >
            <InputLabel className="dark:text-gray-300">Show</InputLabel>
            <Select
              value={pageSize}
              label="Show"
              onChange={handlePageSizeChange}
              className="h-10 rounded-lg border-gray-300 bg-white dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
              inputProps={{
                className: "dark:text-gray-300",
                sx: {
                  height: 40,
                  paddingTop: 1,
                  paddingBottom: 1,
                },
              }}
              MenuProps={{
                PaperProps: {
                  className:
                    "dark:bg-secondary-dark dark:text-gray-300 mt-1 shadow-lg rounded-lg",
                },
              }}
            >
              <MenuItem value={50} className="dark:hover:bg-gray-800">
                50
              </MenuItem>
              <MenuItem value={100} className="dark:hover:bg-gray-800">
                100
              </MenuItem>
              <MenuItem value={200} className="dark:hover:bg-gray-800">
                200
              </MenuItem>
              <MenuItem value={totalCount} className="dark:hover:bg-gray-800">
                All
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        className="mb-4 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-secondary-dark"
        elevation={0}
      >
        <Table className="min-w-[1000px]">
          <TableHead>
            <TableRow className="bg-gray-100 dark:bg-secondary-dark">
              <TableCell className="pl-3 dark:border-gray-700">
                <TableSortLabel
                  active={sortConfig.key === "companyName"}
                  direction={sortConfig.direction}
                  onClick={() => handleSort("companyName")}
                  IconComponent={() => getSortIcon("companyName")}
                  className="font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    Company
                  </p>
                </TableSortLabel>
              </TableCell>
              <TableCell className="dark:border-gray-700">
                <TableSortLabel
                  active={sortConfig.key === "domainName"}
                  direction={sortConfig.direction}
                  onClick={() => handleSort("domainName")}
                  IconComponent={() => getSortIcon("domainName")}
                  className="font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    Domain
                  </p>
                </TableSortLabel>
              </TableCell>
              <TableCell className="dark:border-gray-700">
                <TableSortLabel
                  active={sortConfig.key === "contactPerson"}
                  direction={sortConfig.direction}
                  onClick={() => handleSort("contactPerson")}
                  IconComponent={() => getSortIcon("contactPerson")}
                  className="font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    Contact Person
                  </p>
                </TableSortLabel>
              </TableCell>
              <TableCell className="dark:border-gray-700">
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  Support End Date
                </p>
              </TableCell>
              <TableCell className="dark:border-gray-700">
                <TableSortLabel
                  active={sortConfig.key === "daysAgo"}
                  direction={sortConfig.direction}
                  onClick={() => handleSort("daysAgo")}
                  IconComponent={() => getSortIcon("daysAgo")}
                  className="font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    Days Ago
                  </p>
                </TableSortLabel>
              </TableCell>
              <TableCell className="pr-3 font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  Actions
                </p>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              skeletonRows
            ) : sortedClients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  className="p-6 text-gray-500 dark:border-gray-700 dark:text-gray-400"
                >
                  No expired support projects found
                </TableCell>
              </TableRow>
            ) : (
              sortedClients.map((client) => (
                <TableRow
                  key={client.id}
                  hover
                  className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <TableCell className="pl-3 dark:border-gray-700 dark:text-gray-300">
                    <Link href={`/clients/${client.id}`}>
                      <p className="text-lg font-medium text-gray-700 hover:underline dark:text-gray-400">
                        {client.companyName || "N/A"}
                      </p>
                    </Link>
                  </TableCell>
                  <TableCell className="dark:border-gray-700 dark:text-gray-300">
                    <a
                      href={`https://${client.domainName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {client.domainName || "N/A"}
                    </a>
                  </TableCell>
                  <TableCell className="dark:border-gray-700 dark:text-gray-300">
                    <div>
                      <p className="text-lg">{client.contactPerson || "N/A"}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {client.contactPersonEmail}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {client.contactPersonPhone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="dark:border-gray-700 dark:text-gray-300">
                    {client.websiteSupportPeriod ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="text-lg">
                          {new Date(
                            client.websiteSupportPeriod,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="dark:border-gray-700">
                    <Badge
                      variant="outline"
                      className={getStatusColor(client.daysAgo)}
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      {getStatusText(client.daysAgo, client.daysAgoMessage)}
                    </Badge>
                  </TableCell>
                  <TableCell className="dark:border-gray-700">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, client)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      size="small"
                    >
                      <MoreVertical className="h-6 w-6" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Box className="mt-4 flex flex-col items-center justify-between gap-4 px-1 sm:flex-row">
          <Typography
            variant="body2"
            className="text-gray-600 dark:text-gray-400"
          >
            Showing{" "}
            <span className="font-medium text-gray-800 dark:text-gray-300">
              {(currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-800 dark:text-gray-300">
              {Math.min(currentPage * pageSize, totalCount)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-800 dark:text-gray-300">
              {totalCount}
            </span>{" "}
            entries
          </Typography>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
            shape="rounded"
            size="medium"
            sx={{
              "& .MuiPaginationItem-root": {
                color: "rgba(107, 114, 128, 1)",
                borderColor: "rgba(209, 213, 219, 1)",
                "&:hover": {
                  backgroundColor: "rgba(243, 244, 246, 1)",
                },
                "&.Mui-selected": {
                  backgroundColor: "rgba(37, 99, 235, 1)",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(29, 78, 216, 1)",
                  },
                },
              },
            }}
          />
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        className="dark:text-white"
        PaperProps={{
          className:
            "dark:bg-secondary-dark dark:text-gray-300 shadow-lg rounded-lg mt-1 border border-gray-200 dark:border-gray-700",
          elevation: 0,
        }}
        MenuListProps={{
          className: "p-1",
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          onClick={() => {
            if (selectedClient) {
              router.push(`/clients/${selectedClient.id}`);
            }
            handleMenuClose();
          }}
          className="flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
        >
          <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span>View Details</span>
        </MenuItem>
       
      </Menu>
    </Box>
  );
};

export default withRoleAuth(SupportExpiringPage, ["ADMIN"]);
