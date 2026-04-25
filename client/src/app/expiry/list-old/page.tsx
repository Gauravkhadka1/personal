"use client";

import React, { useState, useRef } from "react";
import { useGetClientsQuery, useSendReminderMutation } from "@/state/api";
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
  Select,
  FormControl,
  InputLabel,
  Pagination,
  TableSortLabel,
  Chip,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  MoreVertical,
  Search,
  ChevronUp,
  ChevronDown,
  Plus,
  Filter,
  X,
  Ban,
  CheckCircle,
  Eye,
  RotateCw,
  BellRing,
  Info,
  Loader2,
  MoreHorizontal,
  MessageSquare,
  MessageSquareText,
  Mails,
  Download,
} from "lucide-react";
import { Client } from "@/state/api";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useUpdateClientMutation,
  useRenewClientServiceMutation,
  useGetFollowupNoteQuery,
} from "@/state/api";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import InvoiceGenerator from "@/components/InvoiceGenerator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import withRoleAuth from "../../../hoc/withRoleAuth";
import Link from "next/link";
import { useAuth } from "../../../context/AuthContext";
import FollowupNotePopup from "@/components/Client/FollowupNotePopup";
import DownloadInvoice, {
  DownloadInvoiceHandle,
} from "@/components/DownloadInvoice";

interface ServiceExpiry {
  type: string;
  expiry: string | Date | undefined;
  amount: number | undefined;
  daysLeft: number | string;
  vatType?: "inclusive" | "exclusive" | "non-vat" | null;
}

interface ClientExpiryGroup {
  client: Client;
  services: ServiceExpiry[];
  totalAmount: number;
}
interface RenewServiceData {
  client: Client;
  services: {
    type: string;
    currentExpiry: Date | string | undefined;
  }[];
}

type SortKey =
  | "domainName"
  | "companyName"
  | "contactPerson"
  | "serviceType"
  | "daysLeft"
  | "amount"
  | "expiryDate"
  | "lastReminderDate";

const ExpiryList = () => {
  const { data: clients = [], isLoading } = useGetClientsQuery();

  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [updateClient] = useUpdateClientMutation();
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "asc" | "desc";
  }>({ key: "daysLeft", direction: "asc" });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  const [isRenewingServices, setIsRenewingServices] = useState(false);

  const { user: authUser } = useAuth();

  const [showFollowupNote, setShowFollowupNote] = useState(false);
  const { data: followupNote } = useGetFollowupNoteQuery(
    selectedClient?.id || 0,
  );

  const { data: allFollowupNotes } = useGetFollowupNoteQuery(0);

  const [isEmailConfirmOpen, setIsEmailConfirmOpen] = useState(false);
  const [pendingEmailClient, setPendingEmailClient] = useState<Client | null>(
    null,
  );
  const [pendingServiceType, setPendingServiceType] = useState("");

  const [isSendingToClient, setIsSendingToClient] = useState(false);
  const [isSendingPreview, setIsSendingPreview] = useState(false);
  const [sendReminder, { isLoading: isSendingReminder }] =
    useSendReminderMutation();

  const handleSendEmail = async (sendToClient: boolean = false) => {
    if (!pendingEmailClient) return;

    try {
      // Set the appropriate loading state
      if (sendToClient) {
        setIsSendingToClient(true);
      } else {
        setIsSendingPreview(true);
      }

      await toast.promise(
        sendReminder({
          id: pendingEmailClient.id,
          serviceType: pendingServiceType,
          sendToClient,
          previewEmail: !sendToClient,
        }).unwrap(),
        {
          loading: sendToClient
            ? "Sending email to client..."
            : "Sending preview to your email...",
          success: sendToClient
            ? "Email sent to client successfully!"
            : "Preview email sent to your inbox!",
          error: sendToClient
            ? "Failed to send email to client"
            : "Failed to send preview email",
        },
      );
    } catch (error) {
      console.error("Error sending email:", error);
    } finally {
      setIsEmailConfirmOpen(false);
      setPendingEmailClient(null);
      setPendingServiceType("");
      handleMenuClose();
      // Reset both loading states
      setIsSendingToClient(false);
      setIsSendingPreview(false);
    }
  };

  // Service type options
  const serviceOptions = [
    { id: "all", label: "All" },
    // { id: "domain", label: "Domain" },
    // { id: "hosting", label: "Hosting" },
    { id: "domain_hosting", label: "Domain + Hosting" },
    { id: "microsoft", label: "Microsoft" },
    { id: "maintenance", label: "Maintenance" },
    { id: "web_design", label: "Web Design" },
  ];

  // Get filter from URL
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter");

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    client: Client,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedClient(client);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedClient(null);
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingActionClient, setPendingActionClient] = useState<Client | null>(
    null,
  );

  const handleSuspendToggle = async (client: Client) => {
    try {
      const newStatus = client.status === "suspend" ? "active" : "suspend";

      // Create FormData and append the status
      const formData = new FormData();
      formData.append("status", newStatus);

      await updateClient({
        id: client.id,
        formData: formData,
      }).unwrap();

      toast.success(
        `Client ${newStatus === "suspend" ? "suspended" : "activated"} successfully`,
      );
    } catch (error) {
      console.error("Error updating client status:", error);
      toast.error("Failed to update client status");
    } finally {
      setPendingActionClient(null);
      setIsConfirmOpen(false);
    }
  };

  const handleSuspendClick = (client: Client) => {
    setPendingActionClient(client);
    setIsConfirmOpen(true);
  };

  const handleSendReminder = (client: Client, serviceType: string) => {
    setPendingEmailClient(client);
    setPendingServiceType(serviceType);
    setIsEmailConfirmOpen(true);
  };

  const calculateDaysLeft = (
    expiryDate: string | Date | undefined,
  ): number | string => {
    if (!expiryDate) return "N/A";

    // Get current time in Nepal (UTC+5:45)
    const now = new Date();
    const nepalOffset = 5.75 * 60 * 60 * 1000; // 5 hours 45 minutes in milliseconds
    const nepalTime = new Date(now.getTime() + nepalOffset);

    // Set to beginning of day in Nepal time
    const today = new Date(nepalTime);
    today.setUTCHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const shouldIncludeService = (
    daysLeft: number | string,
    filter: string | null,
    client: Client,
    serviceType: string,
  ): boolean => {
    // Always include if filter is suspended and client is suspended
    if (filter === "suspended") {
      return client.status === "suspend";
    }

    // Exclude suspended clients for all other filters
    if (client.status === "suspend") return false;

    // First check if the service matches the URL filter criteria
    let matchesFilter = true;
    if (filter && typeof daysLeft === "number") {
      switch (filter) {
        case "30":
          matchesFilter = daysLeft >= 16 && daysLeft <= 30;
          break;
        case "15":
          matchesFilter = daysLeft >= 8 && daysLeft <= 15;
          break;
        case "7":
          matchesFilter = daysLeft >= 1 && daysLeft <= 7;
          break;
        case "expired":
          matchesFilter = daysLeft < 0;
          break;
        default:
          matchesFilter = true;
      }
    }

    // If it doesn't match the URL filter, exclude regardless of tab
    if (!matchesFilter) return false;

    // Then check if service type matches selected tab
    if (activeTab !== "all") {
      const normalizedServiceType = serviceType.split(" - ")[0].toLowerCase();

      if (activeTab === "domain_hosting") {
        return (
          normalizedServiceType === "domain" ||
          normalizedServiceType === "hosting"
        );
      }

      if (activeTab === "web_design") {
        return serviceType.includes("Web Design");
      }

      if (normalizedServiceType !== activeTab) {
        return false;
      }
    }

    return true;
  };

  const getOrdinalNumber = (n: number, installments: any[] = []): string => {
    // If this is the last installment and has a due date, show as "Final"
    const isLastWithDate =
      n === installments.length && installments[n - 1]?.dueDate;

    if (isLastWithDate) {
      return "Final";
    }

    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const getClientExpiryGroups = (): ClientExpiryGroup[] => {
    const groups: ClientExpiryGroup[] = [];

    clients.forEach((client) => {
      if (filter === "suspended" && client.status !== "suspend") {
        return;
      }

      const services: ServiceExpiry[] = [];
      // Add web design installments
      if (client.webDesignInstallments) {
        try {
          const installments =
            typeof client.webDesignInstallments === "string"
              ? JSON.parse(client.webDesignInstallments)
              : client.webDesignInstallments;

          installments.forEach((installment: any) => {
            if (!installment.paid) {
              const daysLeft = calculateDaysLeft(installment.dueDate);
              if (
                shouldIncludeService(daysLeft, filter, client, "Web Design")
              ) {
                services.push({
                  type: `Web Design ${getOrdinalNumber(installment.number, installments)} Installment`,
                  expiry: installment.dueDate,
                  amount: installment.amount,
                  daysLeft,
                  vatType: client.webDesignVatType,
                });
              }
            }
          });
        } catch (e) {
          console.error("Error parsing installments:", e);
        }
      }

      if (client.microsoftServices) {
        try {
          const msServices =
            typeof client.microsoftServices === "string"
              ? JSON.parse(client.microsoftServices)
              : client.microsoftServices;

          msServices.forEach((service: any) => {
            const daysLeft = calculateDaysLeft(service.expiryDate);
            if (shouldIncludeService(daysLeft, filter, client, "Microsoft")) {
              services.push({
                type: `Microsoft (${service.noOfAccounts} accounts)`,
                expiry: service.expiryDate,
                amount: service.amount,
                daysLeft,
                vatType: service.microsoftVatType,
              });
            }
          });
        } catch (e) {
          console.error("Error parsing Microsoft services:", e);
        }
      }

      // Add other services
      [
        {
          type: "Domain",
          expiry: client.domainExpiryDate,
          amount: client.domainAmount,
          vatType: client.domainVatType,
        },
        {
          type: "Hosting",
          expiry: client.hostingExpiryDate,
          amount: client.hostingAmount,
          vatType: client.hostingVatType,
        },
        {
          type: "Maintenance",
          expiry: client.maintenanceExpiryDate,
          amount: client.maintenanceAmount,
          vatType: client.maintenanceVatType,
        },
      ].forEach((service) => {
        if (service.expiry) {
          const daysLeft = calculateDaysLeft(service.expiry);
          if (shouldIncludeService(daysLeft, filter, client, service.type)) {
            services.push({
              ...service,
              daysLeft,
            });
          }
        }
      });

      // Group services by expiry date
      const dateGroups: Record<string, ServiceExpiry[]> = {};

      services.forEach((service) => {
        const dateKey = service.expiry
          ? new Date(service.expiry).toISOString().split("T")[0]
          : "none";

        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = [];
        }
        dateGroups[dateKey].push(service);
      });

      // Create a group for each expiry date
      Object.entries(dateGroups).forEach(([dateKey, services]) => {
        if (dateKey === "none") return;

        // For Microsoft services with same date, combine them
        const microsoftServices = services.filter((s) =>
          s.type.startsWith("Microsoft"),
        );
        const otherServices = services.filter(
          (s) => !s.type.startsWith("Microsoft"),
        );

        // Calculate total Microsoft accounts and amount
        const microsoftTotalAccounts = microsoftServices.reduce(
          (sum, service) =>
            sum +
            parseInt(service.type.match(/\((\d+) accounts\)/)?.[1] || "0"),
          0,
        );
        const microsoftTotalAmount = microsoftServices.reduce(
          (sum, service) => sum + (service.amount || 0),
          0,
        );

        // Combine all services for display
        const displayServices = [...otherServices];
        if (microsoftServices.length > 0) {
          displayServices.push({
            type: `Microsoft (${microsoftTotalAccounts} accounts)`,
            expiry: microsoftServices[0].expiry,
            amount: microsoftTotalAmount,
            daysLeft: microsoftServices[0].daysLeft,
          });
        }

        const totalAmount = displayServices.reduce(
          (sum, service) => sum + (service.amount || 0),
          0,
        );

        groups.push({
          client,
          services: displayServices,
          totalAmount,
        });
      });
    });

    return groups;
  };

  const expiryGroups = getClientExpiryGroups();

  const filteredGroups = expiryGroups.filter((group) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      group.client.domainName?.toLowerCase().includes(searchLower) ||
      group.client.companyName?.toLowerCase().includes(searchLower) ||
      group.client.contactPerson?.toLowerCase().includes(searchLower)
    );
  });

  const sortedGroups = [...filteredGroups].sort((a, b) => {
    const aValue =
      sortConfig.key === "daysLeft"
        ? Math.min(
            ...a.services.map((s) =>
              typeof s.daysLeft === "number" ? s.daysLeft : Infinity,
            ),
          )
        : sortConfig.key === "expiryDate"
          ? new Date(a.services[0].expiry || 0).getTime()
          : sortConfig.key === "amount"
            ? a.totalAmount
            : sortConfig.key === "companyName"
              ? a.client.companyName || ""
              : sortConfig.key === "contactPerson"
                ? a.client.contactPerson || ""
                : sortConfig.key === "serviceType"
                  ? a.client.serviceType || ""
                  : sortConfig.key === "lastReminderDate"
                    ? new Date(a.client.lastReminderDate || 0).getTime()
                    : a.client.domainName || "";

    const bValue =
      sortConfig.key === "daysLeft"
        ? Math.min(
            ...b.services.map((s) =>
              typeof s.daysLeft === "number" ? s.daysLeft : Infinity,
            ),
          )
        : sortConfig.key === "expiryDate"
          ? new Date(b.services[0].expiry || 0).getTime()
          : sortConfig.key === "amount"
            ? b.totalAmount
            : sortConfig.key === "companyName"
              ? b.client.companyName || ""
              : sortConfig.key === "serviceType"
                ? b.client.serviceType || ""
                : sortConfig.key === "contactPerson"
                  ? b.client.contactPerson || ""
                  : b.client.domainName || "";

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const totalGroups = sortedGroups.length;
  const totalPages = Math.ceil(totalGroups / pageSize);
  const paginatedGroups = sortedGroups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

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

  const getFilterTitle = () => {
    switch (filter) {
      case "30":
        return "Expiring in 30 Days";
      case "15":
        return "Expiring in 15 Days";
      case "7":
        return "Expiring in 7 Days";
      case "expired":
        return "Expired Services";
      case "suspended":
        return "Suspended Clients";
      default:
        return "All Expiring Services";
    }
  };

  // Calculate counts for each tab
  const getTabCounts = () => {
    const counts: Record<string, number> = {};

    serviceOptions.forEach((option) => {
      if (option.id === "all") {
        counts.all = expiryGroups.length;
      } else if (option.id === "domain_hosting") {
        counts.domain_hosting = expiryGroups.filter((group) =>
          group.services.some(
            (s) =>
              (s.type.startsWith("Domain") || s.type.startsWith("Hosting")) &&
              shouldIncludeService(s.daysLeft, filter, group.client, s.type),
          ),
        ).length;
      } else if (option.id === "web_design") {
        counts.web_design = expiryGroups.filter((group) =>
          group.services.some(
            (s) =>
              s.type.includes("Web Design") &&
              shouldIncludeService(s.daysLeft, filter, group.client, s.type),
          ),
        ).length;
      } else {
        counts[option.id] = expiryGroups.filter((group) =>
          group.services.some(
            (s) =>
              s.type.startsWith(option.label) &&
              shouldIncludeService(s.daysLeft, filter, group.client, s.type),
          ),
        ).length;
      }
    });

    return counts;
  };

  const tabCounts = getTabCounts();

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
        <Skeleton className="h-6 w-full rounded" />
      </TableCell>
      <TableCell className="p-3 dark:border-gray-700">
        <Skeleton className="h-6 w-6 rounded-full" />
      </TableCell>
    </TableRow>
  ));

  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);

  const [renewServiceData, setRenewServiceData] =
    useState<RenewServiceData | null>(null);

  const [sendEmail, setSendEmail] = useState(false);

  const [renewClientService] = useRenewClientServiceMutation();

  const handleRenewService = async () => {
    if (!renewServiceData) return;

    setIsRenewingServices(true);
    try {
      const renewPromises = renewServiceData.services.map((service) => {
        const newExpiryDate = new Date(service.currentExpiry || new Date());
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

        return renewClientService({
          id: renewServiceData.client.id,
          serviceType: service.type.split(" (")[0],
          newExpiryDate: newExpiryDate.toISOString(),
          sendEmail,
        }).unwrap();
      });

      await toast.promise(Promise.all(renewPromises), {
        loading: "Renewing services...",
        success: "Services renewed successfully!",
        error: "Failed to renew services",
      });
    } catch (error) {
      console.error("Error renewing services:", error);
    } finally {
      setIsRenewingServices(false);
      setIsRenewDialogOpen(false);
      setRenewServiceData(null);
      setSendEmail(false);
    }
  };

  const calculateDaysAgo = (dateString: string): string => {
    if (!dateString) return "Never";

    const reminderDate = new Date(dateString);
    const now = new Date();

    // Get current time in Nepal (UTC+5:45)
    const nepalOffset = 5.75 * 60 * 60 * 1000; // 5 hours 45 minutes in milliseconds
    const nepalTime = new Date(now.getTime() + nepalOffset);

    const diffTime = nepalTime.getTime() - reminderDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        if (diffMinutes < 2) return "Just now";
        return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
      }
      if (diffHours < 12) return "Today";
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    }

    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

    // For older dates, show the actual date
    return reminderDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const downloadInvoiceRef = useRef<DownloadInvoiceHandle>(null);

  return (
    <Box className="p-4 dark:bg-primary-dark dark:text-gray-300 md:p-6">
      <Box className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <Box className="flex items-center gap-3">
          <Typography
            variant="h5"
            component="h1"
            className="font-semibold dark:text-gray-200"
          >
            {getFilterTitle()}
          </Typography>
          <Chip
            label={`${totalGroups}`}
            size="small"
            className="border dark:border-gray-700 dark:bg-secondary-dark dark:text-gray-300"
          />
        </Box>

        <Box className="flex w-full flex-col items-start gap-3 dark:text-gray-300 sm:flex-row sm:items-center md:w-auto">
          {/* Search Field */}
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search by Domain, Company Name or Contact Person"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              width: "100%",
              minWidth: "400px",
              maxWidth: "400px",
              "& .MuiOutlinedInput-root": {
                height: "40px",
                borderRadius: "0.5rem", // rounded-lg
                backgroundColor: "white",
                borderColor: "#d1d5db", // light mode: border-gray-300
                "& fieldset": {
                  borderColor: "#d1d5db", // light border
                },
                "&:hover fieldset": {
                  borderColor: "#d1d5db",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#d1d5db",
                },
                // Dark mode styles (based on .dark class)
                ".dark &": {
                  backgroundColor: "#1e293b", // Tailwind dark:bg-secondary-dark
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
                color: "#6b7280", // light: text-gray-500
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
              className: "dark:text-gray-300", // text color in dark mode
            }}
          />

          {/* Add Client Button */}
          <Button
            onClick={() => router.push("/clients/create")}
            className="h-10 w-full bg-blue-600 text-white shadow-sm hover:bg-blue-700 sm:w-auto"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Client
          </Button>

          {/* Select Dropdown */}
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
              <MenuItem value={totalGroups} className="dark:hover:bg-gray-800">
                All
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Tabs */}
      <Box className="mb-4">
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => {
            setActiveTab(newValue);
            setCurrentPage(1);
          }}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: "#2563eb",
            },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.875rem",
              color: "hsl(var(--muted-foreground))",
              "&.Mui-selected": {
                color: "#2563eb",
              },
            },
          }}
        >
          {serviceOptions.map((option) => (
            <Tab
              key={option.id}
              label={
                <div className="flex items-center gap-2 text-base">
                  {option.label}
                  <Badge variant="secondary" className="px-1.5 py-0.5">
                    {tabCounts[option.id] || 0}
                  </Badge>
                </div>
              }
              value={option.id}
            />
          ))}
        </Tabs>
      </Box>

      <TableContainer
        component={Paper}
        className="mb-4 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-secondary-dark"
        elevation={0}
      >
        <Table className="min-w-[1000px]">
          <TableHead>
            <TableRow className="bg-gray-200 dark:bg-secondary-dark">
              <TableCell className="pl-3 dark:border-gray-700">
                <TableSortLabel
                  active={sortConfig.key === "companyName"}
                  direction={sortConfig.direction}
                  onClick={() => handleSort("companyName")}
                  IconComponent={() => getSortIcon("companyName")}
                  className="font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    {" "}
                    Company
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
                <TableSortLabel
                  active={sortConfig.key === "serviceType"}
                  direction={sortConfig.direction}
                  onClick={() => handleSort("serviceType")}
                  IconComponent={() => getSortIcon("serviceType")}
                  className="font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    Service Type
                  </p>
                </TableSortLabel>
              </TableCell>

              <TableCell className="dark:border-gray-700">
                <TableSortLabel
                  active={sortConfig.key === "amount"}
                  direction={sortConfig.direction}
                  onClick={() => handleSort("amount")}
                  IconComponent={() => getSortIcon("amount")}
                  className="font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    Amount
                  </p>
                </TableSortLabel>
              </TableCell>

              <TableCell className="dark:border-gray-700">
                <TableSortLabel
                  active={sortConfig.key === "expiryDate"}
                  direction={sortConfig.direction}
                  onClick={() => handleSort("expiryDate")}
                  IconComponent={() => getSortIcon("expiryDate")}
                  className="font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                    Expiry Date
                  </p>
                </TableSortLabel>
              </TableCell>
              <TableCell className="p-3 dark:border-gray-700">
                <TableSortLabel
                  active={sortConfig.key === "lastReminderDate"}
                  direction={sortConfig.direction}
                  onClick={() => handleSort("lastReminderDate")}
                  IconComponent={() => getSortIcon("lastReminderDate")}
                  className="text-lg font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                >
                  Last Reminder
                </TableSortLabel>
              </TableCell>
              <TableCell className="pr-3 font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  Notes
                </p>
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
            ) : paginatedGroups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  className="p-6 text-gray-500 dark:border-gray-700 dark:text-gray-400"
                >
                  No expiring services found
                  {activeTab !== "all" &&
                    ` for selected service type: ${serviceOptions.find((o) => o.id === activeTab)?.label}`}
                </TableCell>
              </TableRow>
            ) : (
              paginatedGroups.map((group, index) => {
                const earliestService = group.services.reduce(
                  (earliest, current) => {
                    if (!earliest) return current;
                    if (
                      typeof current.daysLeft === "number" &&
                      typeof earliest.daysLeft === "number"
                    ) {
                      return current.daysLeft < earliest.daysLeft
                        ? current
                        : earliest;
                    }
                    return earliest;
                  },
                  group.services[0],
                );

                const expiryDate = earliestService.expiry
                  ? new Date(earliestService.expiry)
                  : null;
                const daysLeft = earliestService.daysLeft;

                return (
                  <TableRow
                    key={`${group.client.id}-${index}`}
                    hover
                    className={`border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50`}
                  >
                    <TableCell className="cursor-pointer pl-3 dark:border-gray-700 dark:text-gray-300">
                      <a
                        href={`https://${group.client.domainName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-[260px] text-xl font-medium text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-400"
                      >
                        {group.client.domainName || "N/A"}
                      </a>
                      <Link href={`/clients/${group.client.id}`}>
                        <p className="w-[260px] text-lg text-gray-500 hover:underline dark:text-gray-300">
                          {" "}
                          {group.client.companyName || "N/A"}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell
                      onClick={() => router.push(`/clients/${group.client.id}`)}
                      className="dark:border-gray-700 dark:text-gray-300"
                    >
                      <p className="w-[200px] text-lg text-gray-700 dark:text-gray-300">
                        {group.client.contactPerson || "N/A"}
                      </p>
                      <p className="w-[200px] text-base text-gray-600 dark:text-gray-300">
                        {group.client.contactPersonPhone}
                      </p>
                    </TableCell>
                    <TableCell className="p-3 dark:border-gray-700 dark:text-gray-300">
                      <div className="flex w-[150px] flex-wrap items-center gap-1 text-base text-gray-700 dark:text-gray-300">
                        {group.services
                          .map((s) => s.type) // Show full type including installment numbers
                          .filter(
                            (value, index, self) =>
                              self.indexOf(value) === index,
                          ) // Remove duplicates
                          .join(" + ")}
                      </div>
                    </TableCell>
                    <TableCell className="dark:border-gray-700 dark:text-gray-300">
                      <p className="text-lg text-gray-700 dark:text-gray-300">
                        {" "}
                        {typeof group.totalAmount === "number"
                          ? group.totalAmount.toFixed(2)
                          : "0.00"}
                      </p>
                    </TableCell>

                    <TableCell className="dark:border-gray-700 dark:text-gray-300">
                      <div>
                        <div>
                          <span
                            className={`text-lg font-medium text-gray-700 dark:text-gray-300 ${
                              typeof daysLeft === "number"
                                ? daysLeft < 0
                                  ? "text-red-600 dark:text-red-400"
                                  : daysLeft <= 7
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : daysLeft <= 30
                                      ? "text-blue-600 dark:text-blue-400"
                                      : "dark:text-gray-300"
                                : "dark:text-gray-300"
                            }`}
                          >
                            {daysLeft}
                            {typeof daysLeft === "number" && daysLeft < 0} days
                          </span>
                        </div>
                        <p className="text-lg text-gray-700 dark:text-gray-300">
                          {expiryDate
                            ? expiryDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>
                    </TableCell>

                     <TableCell className="p-3 dark:border-gray-700 text-lg text-gray-500 dark:text-gray-400">
                        <p className="text-lg text-gray-700 dark:text-gray-300">
                      {group.client.lastReminderDate ? (
                        <div className="flex flex-col text-base text-gray-500 dark:text-gray-400">
                          <span>
                            {calculateDaysAgo(group.client.lastReminderDate)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(
                              group.client.lastReminderDate,
                            ).toLocaleString("en-US", {
                              weekday: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ) : (
                        "Not Sent"
                      )}
                      </p>
                    </TableCell>

                    <TableCell className="dark:border-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1 text-base text-gray-500 dark:text-gray-400">
                        <button
                          onClick={() => {
                            setSelectedClient(group.client);
                            setShowFollowupNote(true);
                          }}
                          className="flex items-center gap-1 hover:text-blue-500"
                        >
                          <MessageSquare className="h-5 w-5" />
                        </button>
                        {(allFollowupNotes ?? []).filter(
                          (note) => note.clientId === group.client.id,
                        ).length > 0 && (
                          <span>
                            {
                              (allFollowupNotes ?? []).filter(
                                (note) => note.clientId === group.client.id,
                              ).length
                            }
                          </span>
                        )}
                      </div>
                    </TableCell>

                   

                    <TableCell className="dark:border-gray-700">
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, group.client)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        size="small"
                      >
                        <MoreHorizontal className="h-6 w-6" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
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
              {Math.min(currentPage * pageSize, totalGroups)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-800 dark:text-gray-300">
              {totalGroups}
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
              "& .MuiPaginationItem-root.Mui-selected": {
                backgroundColor: "rgba(37, 99, 235, 1)",
                color: "white",
              },
            }}
            className="dark:[&>ul>li>button.Mui-selected:hover]:bg-blue-700 dark:[&>ul>li>button.Mui-selected]:bg-blue-600 dark:[&>ul>li>button.Mui-selected]:text-white dark:[&>ul>li>button]:border-gray-700 dark:[&>ul>li>button]:bg-gray-800/50 dark:[&>ul>li>button]:text-gray-300"
          />
        </Box>
      )}

      {/* Action Menu */}
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

        <MenuItem
          onClick={() => {
            if (selectedClient && downloadInvoiceRef.current) {
              const clientGroup = expiryGroups.find(
                (g) => g.client.id === selectedClient.id,
              );
              if (clientGroup) {
                downloadInvoiceRef.current.generateInvoice();
              }
            }
            handleMenuClose();
          }}
          className="flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
        >
          <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span>Download Invoice</span>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedClient) {
              const clientGroup = expiryGroups.find(
                (g) => g.client.id === selectedClient.id,
              );
              if (clientGroup && clientGroup.services.length > 0) {
                handleSendReminder(
                  selectedClient,
                  clientGroup.services[0].type,
                );
              }
            }
          }}
          disabled={
            isSendingReminder ||
            (!selectedClient?.contactPersonEmail &&
              !selectedClient?.companyEmail)
          }
          className="flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
        >
          {isSendingReminder ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BellRing className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          )}
          <span>Send Reminder</span>
          {!selectedClient?.contactPersonEmail &&
            !selectedClient?.companyEmail && (
              <Tooltip title="No email addresses available">
                <Info className="h-4 w-4 text-red-500" />
              </Tooltip>
            )}
        </MenuItem>

        {/* <MenuItem
          
          className="flex items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
        >
          <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <span>Renew Service</span>
        </MenuItem> */}

        <MenuItem
          onClick={() => {
            if (selectedClient) {
              handleSuspendClick(selectedClient);
            }
            handleMenuClose();
          }}
          sx={{
            "&:hover": {
              backgroundColor:
                selectedClient?.status === "suspend"
                  ? "rgba(220, 252, 231, 1)" // green-100
                  : "rgba(254, 226, 226, 1)", // red-100
            },
          }}
          className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${
            selectedClient?.status === "suspend"
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {selectedClient?.status === "suspend" ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <Ban className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          {selectedClient?.status === "suspend" ? "Activate" : "Suspend"}
        </MenuItem>
      </Menu>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingActionClient?.status === "suspend"
                ? `Activate ${pendingActionClient?.companyName || pendingActionClient?.domainName || "this account"}?`
                : `Suspend ${pendingActionClient?.companyName || pendingActionClient?.domainName || "this account"}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingActionClient?.status === "suspend"
                ? "This will restore all services for this account."
                : "This will temporarily disable all services for this account."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                pendingActionClient && handleSuspendToggle(pendingActionClient)
              }
              className={
                pendingActionClient?.status === "suspend"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {pendingActionClient?.status === "suspend"
                ? "Activate"
                : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
        <AlertDialogContent className="border-green-500 dark:border-green-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-600 dark:text-green-400">
              Renew Services Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will extend the expiry date by 1 year for the following
              services:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            {renewServiceData?.services.map((service, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  checked={true}
                  disabled
                  className="border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:text-white"
                />
                <label className="text-sm">
                  {service.type} (expires{" "}
                  {service.currentExpiry
                    ? new Date(service.currentExpiry).toLocaleDateString()
                    : "N/A"}
                  )
                </label>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="send-email"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(!!checked)}
              className="border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:text-white"
            />
            <label
              htmlFor="send-email"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Send email to client
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRenewService}
              disabled={isRenewingServices}
              className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
            >
              {isRenewingServices ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Renew Services
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DownloadInvoice
        ref={downloadInvoiceRef}
        client={selectedClient || ({} as Client)}
        services={
          selectedClient
            ? expiryGroups.find((g) => g.client.id === selectedClient.id)
                ?.services || []
            : []
        }
      />

      {showFollowupNote && (
        <FollowupNotePopup
          clientId={selectedClient?.id || 0}
          userId={authUser?.userId}
          onClose={() => setShowFollowupNote(false)}
        />
      )}

      {/* Add this AlertDialog near your other dialogs */}
      <AlertDialog
        open={isEmailConfirmOpen}
        onOpenChange={setIsEmailConfirmOpen}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-blue-600 dark:text-blue-400">
              Confirm Email Sending
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              Do you really want to send an email to:
              {pendingEmailClient?.contactPersonEmail && (
                <div className="mt-2">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Contact Person: {pendingEmailClient.contactPersonEmail}
                  </span>
                </div>
              )}
              {pendingEmailClient?.companyEmail && (
                <div className="mt-2">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Company: {pendingEmailClient.companyEmail}
                  </span>
                </div>
              )}
              {!pendingEmailClient?.contactPersonEmail &&
                !pendingEmailClient?.companyEmail && (
                  <div className="mt-2 text-red-500">
                    No email addresses available!
                  </div>
                )}
              <div className="mt-3">
                for the{" "}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {pendingServiceType}
                </span>{" "}
                service?
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => handleSendEmail(true)}
              disabled={
                isSendingToClient ||
                isSendingPreview ||
                (!pendingEmailClient?.contactPersonEmail &&
                  !pendingEmailClient?.companyEmail)
              }
              className="h-12 bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSendingToClient ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Yes, Send to Client
              {pendingEmailClient?.contactPersonEmail &&
              pendingEmailClient?.companyEmail
                ? "s"
                : ""}
              !
            </Button>

            <Button
              onClick={() => handleSendEmail(false)}
              disabled={isSendingPreview || isSendingToClient}
              variant="outline"
              className="h-12 border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              {isSendingPreview ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Send it to me for Preview
            </Button>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
};

export default withRoleAuth(ExpiryList, ["ADMIN"]);
