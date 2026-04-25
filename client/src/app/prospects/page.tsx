"use client";

import React, { useState, useEffect, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Activity,
  Plus,
  Pencil,
  Trash2,
  Grid3x3,
  Calendar,
  Filter,
  List,
  PlusSquare,
  Share2,
  Table,
  Search,
  X,
  MessageSquare,
  ArrowRight,
  User,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  useGetProspectsQuery,
  useUpdateProspectMutation,
  useCreateProspectsMutation,
  useDeleteProspectsMutation,
  useGetProspectFollowupNoteQuery,
} from "@/state/api";
import { format, differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/sonner";
import withRoleAuth from "../../hoc/withRoleAuth";
import { ProspectsStatus, Prospects } from "@/state/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatISO } from "date-fns";
import { setHours, setMinutes } from "date-fns";
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
import ProspectFollowupNotePopup from "@/components/Prospect/ProspectFollowupNotePopup";

type Props = {
  params: { id: string };
};

interface ActivityLog {
  id: number;
  action: string;
  details: string | null;
  timestamp: string;
  userId: number;
  user?: {
    username?: string;
  };
}

const prospectsStatus: ProspectsStatus[] = [
  ProspectsStatus.New,
  ProspectsStatus.Dealing,
  ProspectsStatus.QuoteSent,
  ProspectsStatus.AgreementSent,
  ProspectsStatus.Converted,
];

type ProspectsType = {
  id: number;
  name: string;
  description: string;
  status: ProspectsStatus;
  category: string;
  inquiryDate?: string;
  activityLogs?: ActivityLog[];
};

const ModalNewProspects = ({
  isOpen,
  onClose,
  prospect = null,
  refetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  prospect?: ProspectsType | null;
  refetch: () => void;
}) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [createProspects, { isLoading: isCreating }] =
    useCreateProspectsMutation();
  const [updateProspect, { isLoading: isUpdating }] =
    useUpdateProspectMutation();

  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProspectsStatus>(ProspectsStatus.New);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [inquiryDate, setInquiryDate] = useState<Date | null>(null);

  useEffect(() => {
    if (prospect) {
      setName(prospect.name || "");
      setStatus(prospect.status || ProspectsStatus.New);
      setCategory(prospect.category || "");
      setDescription(prospect.description || "");
      setInquiryDate(
        prospect.inquiryDate ? new Date(prospect.inquiryDate) : null,
      );
    } else {
      setName("");
      setStatus(ProspectsStatus.New);
      setCategory("");
      setDescription("");
      setInquiryDate(null);
    }
  }, [prospect]);

  const handleSubmit = async () => {
    if (!name || !category) {
      toast.error("Name and category are required fields.");
      return;
    }

    const prospectsData = {
      name,
      status,
      category,
      description,
      inquiryDate: inquiryDate
        ? formatISO(inquiryDate, { representation: "complete" })
        : undefined,
      updatedBy: userId,
    };

    try {
      if (prospect) {
        await updateProspect({
          prospectsId: prospect.id,
          ...prospectsData,
        }).unwrap();
        toast.success("Prospect updated successfully!");
      } else {
        await createProspects(prospectsData).unwrap();
        toast.success("Prospect created successfully!");
      }
      refetch();
      onClose();
    } catch (error) {
      toast.error("An error occurred while saving the prospect.");
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? "" : "hidden"}`}
    >
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold dark:text-white">
            {prospect ? "Edit Prospect" : "Create New Prospect"}
          </h2>
          <X
            onClick={onClose}
            className="h-5 w-5 cursor-pointer text-gray-800 dark:text-gray-200"
          />
        </div>

        <form
          className="mt-4 space-y-6 dark:text-gray-100"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-blue-400"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="flex items-center justify-between">
            <div className="w-[45%]">
              <select
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:ring-blue-200"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                <option value="NGO/ INGO">NGO/ INGO</option>
                <option value="tourism">Tourism</option>
                <option value="ecommerce">Ecommerce</option>
                <option value="education">Education</option>
                <option value="company">Company</option>
                <option value="portfolio">Portfolio</option>
                <option value="APP">APP</option>
                <option value="Hotel">Hotel</option>
                <option value="News">News</option>
                <option value="Hydropower">Hydropower</option>
              </select>
            </div>

            <div className="flex w-[45%] space-x-4">
              <DatePicker
                selected={inquiryDate}
                onChange={(date) => setInquiryDate(date)}
                dateFormat="yyyy-MM-dd"
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-blue-400"
                placeholderText="Select Inquiry Date"
              />
            </div>
          </div>

          <textarea
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-blue-400"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button
            type="submit"
            className={`mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:text-gray-100 dark:hover:bg-blue-600 dark:focus:ring-blue-400 ${
              isCreating || isUpdating ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating
              ? "Processing..."
              : prospect
                ? "Update Prospect"
                : "Create Prospect"}
          </button>
        </form>
      </div>
    </div>
  );
};

const ProspectsPage = ({ params }: Props) => {
  const { id } = params;
  const [activeTab, setActiveTab] = useState("Board");
  const [isModalNewProspectsOpen, setIsModalNewProspectsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [selectedProspect, setSelectedProspect] =
    useState<ProspectsType | null>(null);
  const { user } = useAuth();
  const { user: authUser } = useAuth();
  const userId = user?.userId?.toString();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [prospectToDelete, setProspectToDelete] = useState<number | null>(null);

  const [showActivityPopup, setShowActivityPopup] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return <Plus size={16} className="text-blue-500" />;
      case "STATUS_UPDATE":
        return <Activity size={16} className="text-purple-500" />;
      case "DUE_DATE_UPDATE":
        return <ArrowRight size={16} className="text-orange-500" />;
      case "ASSIGNEE_UPDATE":
        return <User size={16} className="text-green-500" />;
      default:
        return <Activity size={16} className="text-gray-500" />;
    }
  };

  const formatActivityMessage = (log: ActivityLog) => {
    const { action, details, timestamp, user } = log;
    const formattedTime = format(
      new Date(timestamp),
      "MMM d, yyyy 'at' h:mm a",
    );

    switch (action) {
      case "CREATE":
        return `${user?.username || "Someone"} created the prospect on ${formattedTime}`;
      case "STATUS_UPDATE":
        if (!details)
          return `${user?.username || "Someone"} updated the task status on ${formattedTime}`;
        const [fromStatus, toStatus] = details.split("|");
        return `${user?.username || "Someone"} updated status from ${fromStatus} to ${toStatus} on ${formattedTime}`;
      case "DUE_DATE_UPDATE":
        if (!details)
          return `${user?.username || "Someone"} updated the due date on ${formattedTime}`;
        const [oldDate, newDate] = details.split("|");
        return `${user?.username || "Someone"} changed due date from ${format(new Date(oldDate), "MMM d, h:mm a")} to ${format(new Date(newDate), "MMM d, h:mm a")} on ${formattedTime}`;
      case "ASSIGNEE_UPDATE":
        return `${user?.username || "Someone"} reassigned the task on ${formattedTime}`;
      default:
        return `${user?.username || "Someone"} modified the task on ${formattedTime}`;
    }
  };

  const {
    data: prospectsData,
    isLoading,
    error,
    refetch,
  } = useGetProspectsQuery({});

  useEffect(() => {
    refetch();
  }, []); // Only refetch on mount

  const prospects =
    prospectsData
      ?.map((prospect) => ({
        ...prospect,
        status: prospect.status as ProspectsStatus,
      }))
      .filter(
        (prospect) =>
          searchTerm === "" ||
          prospect.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prospect.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prospect.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      ) || [];

  const [createProspect] = useCreateProspectsMutation();
  const [updateProspect] = useUpdateProspectMutation();
  const [deleteProspect] = useDeleteProspectsMutation();

  const handleCreateProspect = async (prospectData: Partial<Prospects>) => {
    try {
      await createProspect(prospectData).unwrap();
      toast.success("Prospect created successfully!");
      setIsModalNewProspectsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to create prospect!");
    }
  };

  const handleEditProspect = async (
    prospectId: number,
    prospectData: Partial<Prospects>,
  ) => {
    try {
      await updateProspect({
        prospectsId: prospectId,
        ...prospectData,
      }).unwrap();
      toast.success("Prospect updated successfully!");
      setIsModalNewProspectsOpen(false);
      refetch();
    } catch (error) {
      toast.error("Failed to update prospect!");
    }
  };

  const handleDeleteProspect = async (prospectId: number) => {
    setProspectToDelete(prospectId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!prospectToDelete) return;

    try {
      await deleteProspect(prospectToDelete).unwrap();
      toast.success("Prospect deleted successfully!");
      refetch();
    } catch (error) {
      toast.error("Failed to delete prospect!");
    } finally {
      setDeleteDialogOpen(false);
      setProspectToDelete(null);
    }
  };

  const moveProspects = (prospectsId: number, toStatus: ProspectsStatus) => {
    if (!userId) {
      console.error("No authenticated user found");
      return;
    }

    const prospect = prospects.find((p) => p.id === prospectsId);
    if (!prospect) {
      console.error("Prospect not found");
      return;
    }

    updateProspect({
      prospectsId,
      name: prospect.name,
      description: prospect.description,
      status: toStatus,
      category: prospect.category,
      inquiryDate: prospect.inquiryDate,
    })
      .unwrap()
      .then(() => {
        toast.success(`Prospect status updated to ${toStatus}`);
        refetch();
      })
      .catch(() => {
        toast.error("Failed to update prospect status");
      });
  };

  const [showProspectFollowupNote, setShowProspectFollowupNote] =
    useState(false);
  const [selectedProspectId, setSelectedProspectId] = useState<number | null>(
    null,
  );
  const { data: prospectFollowupNote } = useGetProspectFollowupNoteQuery(
    selectedProspectId || 0,
  );

  const ProspectHeader = () => {
    return (
      <div className="mx-4 my-3 flex flex-wrap-reverse justify-between gap-2 rounded-lg border-y border-gray-200 pb-[8px] pt-2 dark:border-stroke-dark dark:bg-secondary md:items-center">
        <div className="mx-4 flex items-center gap-3 text-2xl font-medium dark:text-neutral-100">
          <Users className="h-6 w-6 text-[#0a0a0a] dark:text-gray-200" />
          Prospects
        </div>

        <div className="mx-4 flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedProspect(null);
              setIsModalNewProspectsOpen(true);
            }}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            New Prospect
          </button>
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search prospects..."
              className="rounded-md border border-gray-300 py-2 pl-10 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
            />
            {localSearchTerm && (
              <button
                onClick={() => {
                  setLocalSearchTerm("");
                  setSearchTerm("");
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ProspectColumn = React.forwardRef<
    HTMLDivElement,
    {
      status: ProspectsStatus;
      prospects: ProspectsType[];
      moveProspects: (prospectId: number, toStatus: ProspectsStatus) => void;
      setIsModalNewProspectsOpen: (isOpen: boolean) => void;
    }
  >(({ status, prospects, moveProspects, setIsModalNewProspectsOpen }, ref) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: "prospect",
      drop: (item: { id: number }) => moveProspects(item.id, status),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }));

    const prospectsCount = prospects.filter(
      (prospect) => prospect.status === status,
    ).length;

    const statusColor: Record<string, string> = {
      New: "bg-gray-100 dark:bg-secondary",
      Dealing: "bg-blue-50 dark:bg-secondary",
      QuoteSent: "bg-yellow-50 dark:bg-secondary",
      AgreementSent: "bg-purple-50 dark:bg-secondary",
      Converted: "bg-green-50 dark:bg-secondary",
    };

    const statusBorderColor: Record<string, string> = {
      New: "border-gray-100 dark:border-secondary",
      Dealing: "border-blue-100 dark:border-secondary",
      QuoteSent: "border-yellow-100 dark:border-secondary",
      AgreementSent: "border-purple-100 dark:border-secondary",
      Converted: "border-green-100 dark:border-secondary",
    };

    return (
      <div
        ref={(node) => {
          drop(node);
          if (typeof ref === "function") ref(node);
        }}
        className={`h-[75vh] min-w-[280px] flex-none rounded-lg py-2 xl:px-2 ${statusColor[status]} ${statusBorderColor[status]} border ${isOver ? "ring-2 ring-blue-500 dark:ring-blue-400/50" : ""}`}
      >
        <div
          className={`mb-3 flex w-full items-center justify-between rounded-t-lg border-b px-4 py-2 ${statusColor[status]} ${statusBorderColor[status]}`}
        >
          <div
            className={`w-2 !bg-[${statusColor[status]}] rounded-s-lg`}
            style={{ backgroundColor: statusColor[status] }}
          />
          <div className="flex w-full items-center justify-between rounded-e-lg text-base dark:bg-secondary">
            <h3 className="flex items-center text-base font-semibold dark:text-gray-300">
              {status}{" "}
              <span
                className="ml-2 inline-block rounded-full bg-gray-200 p-1 text-center text-sm leading-none dark:bg-secondary-dark"
                style={{ width: "1.5rem", height: "1.5rem" }}
              >
                {prospectsCount}
              </span>
            </h3>
          </div>
        </div>
        <div className="custom-scrollbar h-[65vh] overflow-y-auto">
          {prospects
            .filter((prospect) => prospect.status === status)
            .map((prospect) => (
              <div key={prospect.id} className="relative">
                <ProspectItem
                  prospect={prospect}
                  onEdit={() => {
                    setSelectedProspect(prospect);
                    setIsModalNewProspectsOpen(true);
                  }}
                  onDelete={() => handleDeleteProspect(prospect.id)}
                />
              </div>
            ))}
        </div>
      </div>
    );
  });

  const ProspectItem = ({
    prospect,
    onEdit,
    onDelete,
  }: {
    prospect: ProspectsType;
    onEdit: () => void;
    onDelete: () => void;
  }) => {
    const dragRef = useRef(null);
    const [hovered, setHovered] = useState(false);
    const [showActivityLogs, setShowActivityLogs] = useState(false);

    const { data: prospectFollowupNotes } = useGetProspectFollowupNoteQuery(
      prospect.id,
    );

    const [{ isDragging }, drag] = useDrag(() => ({
      type: "prospect",
      item: { id: prospect.id },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    drag(dragRef);

    const formattedInquiryDate = prospect.inquiryDate
      ? format(new Date(prospect.inquiryDate), "MMM d")
      : "";

    const daysAgo = prospect.inquiryDate
      ? differenceInDays(new Date(), new Date(prospect.inquiryDate))
      : null;

    const creationLog = prospect.activityLogs?.find(
      (log) => log.action === "CREATE",
    );
    return (
      <div
        ref={dragRef}
        className={`group relative mb-4 rounded-md p-4 shadow dark:border dark:border-gray-700/75 ${
          isDragging ? "opacity-50" : "opacity-100"
        } bg-white dark:bg-secondary`}
        style={{ minWidth: "250px", maxWidth: "250px" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className={`absolute right-2 top-2 z-10 flex gap-2.5 rounded-md border border-gray-400 bg-white p-1 px-1 py-1 shadow-md transition-opacity duration-200 dark:bg-dark-tertiary ${
            hovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            className="h-4 w-4 cursor-pointer text-gray-600 hover:text-blue-500 dark:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil size={16} />
          </button>
          <button
            className="h-4 w-4 cursor-pointer text-gray-600 hover:text-red-500 dark:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="px-1">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-500 dark:text-neutral-500">
              <div className="rounded-md border bg-gray-100 px-1.5 text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {prospect.category}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-neutral-500">
              <div>
                {daysAgo !== null && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    {daysAgo === 0
                      ? "Today"
                      : `${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="mb-1 flex justify-between">
              <h4 className="flex items-center justify-between break-all text-base font-medium text-dashboard-tasktitle dark:text-gray-300">
                {prospect.name}
              </h4>
            </div>
            <button
              onClick={() => {
                setSelectedProspectId(prospect.id);
                setShowProspectFollowupNote(true);
              }}
              className="flex items-center gap-1 hover:text-blue-500"
            >
              <MessageSquare className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              {prospectFollowupNotes && prospectFollowupNotes.length > 0 && (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {prospectFollowupNotes.length}
                </span>
              )}

              {showActivityLogs && (
                <div className="mt-2 space-y-2 border-t pt-2">
                  {prospect.activityLogs?.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start text-xs text-gray-500 dark:text-gray-400"
                    >
                      {getActivityIcon(log.action)}
                      <span className="ml-1">{formatActivityMessage(log)}</span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="mb-1 flex justify-between">
              <h4 className="flex items-center justify-between break-all text-sm font-medium text-muted-foreground dark:text-gray-300">
                {prospect.description}
              </h4>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading)
    return (
      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-5">
        {prospectsStatus.map((status) => (
          <div key={status} className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-4">
                  <Skeleton className="h-4 w-[200px]" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <Skeleton className="mt-2 h-4 w-[80px]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  if (error) return <div>An error occurred while fetching prospects</div>;

  return (
    <div>
      <Toaster />
      <ProspectHeader />
      <DndProvider backend={HTML5Backend}>
        <div className="mx-4 flex gap-4 overflow-x-auto pb-4">
          {prospectsStatus.map((status) => (
            <ProspectColumn
              key={status}
              status={status}
              prospects={prospects}
              moveProspects={moveProspects}
              setIsModalNewProspectsOpen={setIsModalNewProspectsOpen}
            />
          ))}
        </div>
      </DndProvider>

      <ModalNewProspects
        isOpen={isModalNewProspectsOpen}
        onClose={() => setIsModalNewProspectsOpen(false)}
        prospect={selectedProspect}
        refetch={refetch}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this Prospect?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              prospect and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, delete it!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {showProspectFollowupNote && selectedProspectId && (
        <ProspectFollowupNotePopup
          prospectId={selectedProspectId}
          userId={authUser?.userId}
          onClose={() => setShowProspectFollowupNote(false)}
        />
      )}
    </div>
  );
};

export default withRoleAuth(ProspectsPage, ["ADMIN"]);