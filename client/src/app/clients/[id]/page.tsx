"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  useGetClientByIdQuery,
  useUpdateClientMutation,
  useGetClientActivityLogsQuery,
} from "@/state/api";
import { useRouter, useParams } from "next/navigation";
import { Client, ProjectTimeline, ProjectTimelineStatus } from "@/state/api";
import toast from "react-hot-toast";
import Select from "react-select";
import { FiChevronDown, FiChevronUp, FiEdit } from "react-icons/fi";
import {
  Activity,
  FolderCode,
  Plus,
  CirclePlus,
  FileText,
  ArrowUpDown,
  Building,
  User,
  Calendar,
  BadgePlus,
  Mail,
  Phone,
  MapPin,
  Smartphone,
  Hash,
  Globe,
  Cloud,
  Wrench,
  BadgeCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import withRoleAuth from "../../../hoc/withRoleAuth";
import { format } from "date-fns";
import { Briefcase, Clock, Contact } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import PaymentForm from "@/components/PaymentForm";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { CheckCircle, Edit, Trash2, Circle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ProjectTimelineComponent from "@/components/ProjectTimelineComponent";
import DeleteModal from "@/components/DeleteModal";

type DomainType = "com" | "net" | "org" | "io" | "other";
type ServiceType = "basic" | "standard" | "premium" | "custom";

interface Installment {
  number: number;
  amount: number;
  dueDate: string;
  paid: boolean;
  receipt?: string;
  receiptFile?: FileList | null;
}

interface MicrosoftService {
  noOfAccounts: string;
  amount: number;
  activeDate: string;
  expiryDate: string;
  serviceType: string;
  microsoftVatType: string;
  purchaseOrder?: string;
  vendor?: "Connex" | "iDream" | "";
  purchaseOrderFile?: FileList | null;
}

interface ClientFormData {
  domainName?: string;
  hostingSpace?: string;
  companyName?: string;
  companyEmail?: string;
  companyAddress?: string;
  companyPhone?: string;
  contactPerson?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  additionalNotes?: string;
  projectDescription?: string;
  projectTimeline?: any[];
  googleDriveLink?: string;
  startDate?: string;
  endDate?: string;
  websiteLiveDate?: string;
  websiteSupportPeriod?: string;
  pan_vat_num?: string;
  status?: string;
  webDesignCategories?: string[];
  webDesignTechStack?: string;
  webDesignRating?: number;
  webDesignTotalAmount?: number;
  webDesignVatType?: string;
  domainActiveDate?: string;
  domainExpiryDate?: string;
  domainAmount?: number;
  domainType?: string;
  domainVatType?: string;
  hostingActiveDate?: string;
  hostingExpiryDate?: string;
  hostingAmount?: number;
  hostingType?: string;
  hostingVatType?: string;
  maintenanceActiveDate?: string;
  maintenanceExpiryDate?: string;
  maintenanceAmount?: number;
  maintenanceType?: string;
  maintenanceVatType?: string;
  maintenanceDescription?: string;
  webDesignAgreement?: FileList | null;
  webDesignInstallments: Installment[];
  microsoftServices: MicrosoftService[];
}

const ClientViewEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const clientId = id ? parseInt(id) : 0;

  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [paymentCategory, setPaymentCategory] = useState("");
  const [showTimeline, setShowTimeline] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);

  const {
    data: client,
    isLoading: isClientLoading,
    isError: isClientError,
    error: clientError,
  } = useGetClientByIdQuery(clientId);
  const { data: activities, isLoading: isActivitiesLoading } =
    useGetClientActivityLogsQuery(clientId);
  const [updateClient, { isLoading: isUpdating }] = useUpdateClientMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
  } = useForm<ClientFormData>({
    defaultValues: {
      microsoftServices: [],
    },
    mode: "onChange",
  });

  const [installmentCount, setInstallmentCount] = useState<2 | 3 | 4>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [microsoftServices, setMicrosoftServices] = useState<
    MicrosoftService[]
  >([]);
  const [activeTab, setActiveTab] = useState("services");
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    webDesign: false,
    domainHosting: true,
    microsoft: false,
    maintenance: false,
    project: false,
  });

  // State for project timelines
  const [localProjectTimelines, setLocalProjectTimelines] = useState<any[]>([]);
  const [isSavingTimelines, setIsSavingTimelines] = useState(false);

  const handleDeleteMicrosoftService = (index: number) => {
    setServiceToDelete(index);
    setDeleteModalOpen(true);
  };

  const confirmDeleteMicrosoftService = () => {
    if (serviceToDelete !== null) {
      const updatedServices = [...microsoftServices];
      updatedServices.splice(serviceToDelete, 1);
      setMicrosoftServices(updatedServices);
      setServiceToDelete(null);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => {
      if (prev[section]) {
        return { ...prev, [section]: false };
      }

      const newState = Object.keys(prev).reduce(
        (acc, key) => {
          acc[key as keyof typeof expandedSections] = false;
          return acc;
        },
        {} as typeof expandedSections,
      );

      return { ...newState, [section]: true };
    });
  };

  const formatDateForDisplay = (dateString: string | Date | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  };

  const formatDateForBackend = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return new Date(
      date.getTime() + date.getTimezoneOffset() * 60000,
    ).toISOString();
  };

  const buildFileUrl = (filePath: string | undefined) => {
    if (!filePath) return "";
    if (filePath.startsWith("http")) return filePath;
    const cleanPath = filePath.replace(/^\/+/, "");
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";
    return `${baseUrl}/${cleanPath}`;
  };

  useEffect(() => {
    if (client) {
      const fields = [
        "domainName",
        "hostingSpace",
        "companyName",
        "companyEmail",
        "companyAddress",
        "companyPhone",
        "contactPerson",
        "contactPersonEmail",
        "contactPersonPhone",
        "additionalNotes",
        "projectDescription",
        "projectTimeline",
        "googleDriveLink",
        "startDate",
        "endDate",
        "websiteLiveDate",
        "websiteSupportPeriod",
        "pan_vat_num",
        "status",
        "webDesignCategories",
        "webDesignTechStack",
        "webDesignRating",
        "webDesignTotalAmount",
        "webDesignVatType",
        "domainActiveDate",
        "domainExpiryDate",
        "domainAmount",
        "domainType",
        "domainVatType",
        "hostingActiveDate",
        "hostingExpiryDate",
        "hostingAmount",
        "hostingType",
        "hostingVatType",
        "maintenanceActiveDate",
        "maintenanceExpiryDate",
        "maintenanceAmount",
        "maintenanceType",
        "maintenanceVatType",
        "maintenanceDescription",
      ];

      reset({});
      
fields.forEach((field) => {
  if (field in client) {
    // Handle webDesignCategories specially (convert comma-separated string to array)
    if (field === "webDesignCategories" && client[field as keyof Client]) {
      const categoriesString = client[field as keyof Client] as string;
      const categoriesArray = categoriesString ? categoriesString.split(",").map(cat => cat.trim()) : [];
      setValue(field as keyof ClientFormData, categoriesArray as any, { shouldDirty: false });
    } 
    // Handle date fields
    else if (
      (field.includes("Date") || field === "websiteSupportPeriod") &&
      client[field as keyof Client]
    ) {
      const formattedDate = formatDateForDisplay(
        client[field as keyof Client] as string,
      );
      setValue(field as keyof ClientFormData, formattedDate as any, {
        shouldDirty: false,
      });
    } 
    // Handle all other fields normally
    else {
      setValue(
        field as keyof ClientFormData,
        client[field as keyof Client] as any,
        { shouldDirty: false },
      );
    }
  }
});

      if (client.microsoftServices) {
        try {
          const services =
            typeof client.microsoftServices === "string"
              ? JSON.parse(client.microsoftServices)
              : client.microsoftServices;

          const formattedServices = services.map((service: any) => ({
            ...service,
            activeDate: formatDateForDisplay(service.activeDate),
            expiryDate: formatDateForDisplay(service.expiryDate),
            purchaseOrder: service.purchaseOrder,
          }));

          setMicrosoftServices(formattedServices);
        } catch (e) {
          console.error("Error parsing Microsoft services:", e);
          setMicrosoftServices([]);
        }
      } else {
        setMicrosoftServices([]);
      }

      if (client.webDesignInstallments) {
        try {
          const installments =
            typeof client.webDesignInstallments === "string"
              ? JSON.parse(client.webDesignInstallments)
              : client.webDesignInstallments;

          const formattedInstallments = installments.map((inst: any) => ({
            ...inst,
            dueDate: formatDateForDisplay(inst.dueDate),
          }));

          setValue("webDesignInstallments", formattedInstallments);
          setInstallmentCount(
            Math.min(4, Math.max(2, installments.length)) as 2 | 3 | 4,
          );
        } catch (e) {
          console.error("Error parsing installments:", e);
          setValue("webDesignInstallments", []);
        }
      } else {
        setValue("webDesignInstallments", []);
      }

      if (client.projectTimeline) {
        try {
          const timelines =
            typeof client.projectTimeline === "string"
              ? JSON.parse(client.projectTimeline)
              : client.projectTimeline;
          setLocalProjectTimelines(timelines);
        } catch (e) {
          console.error("Error parsing project timelines:", e);
          setLocalProjectTimelines([]);
        }
      } else {
        setLocalProjectTimelines([]);
      }

      
    }
  }, [client, setValue]);

  const formValues = watch();

  

  const handleInstallmentChange = (
    index: number,
    field: keyof Installment,
    value: any,
  ) => {
    const currentInstallments = watch("webDesignInstallments") || [];
    const updatedInstallments = [...currentInstallments];

    if (!updatedInstallments[index]) {
      updatedInstallments[index] = {
        number: index + 1,
        amount: 0,
        dueDate: "",
        paid: false,
      };
    }

    updatedInstallments[index] = {
      ...updatedInstallments[index],
      [field]: value,
    };

    setValue("webDesignInstallments", updatedInstallments, {
      shouldDirty: true,
    });
  };

  const handleMicrosoftServiceChange = (
    index: number,
    field: keyof MicrosoftService,
    value: any,
  ) => {
    const updatedServices = [...microsoftServices];
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: value,
    };
    setMicrosoftServices(updatedServices);
    setValue("microsoftServices", updatedServices, { shouldDirty: true });
  };

  const handleInstallmentCountChange = (count: 2 | 3 | 4) => {
    setInstallmentCount(count);
    const currentInstallments = watch("webDesignInstallments") || [];
    const newInstallments = [];

    for (let i = 0; i < count; i++) {
      newInstallments[i] = currentInstallments[i] || {
        number: i + 1,
        amount: 0,
        dueDate: "",
        paid: false,
      };
    }

    setValue("webDesignInstallments", newInstallments, { shouldDirty: true });
  };

  // Function to save timelines
  const saveTimelines = async () => {
    setIsSavingTimelines(true);
    try {
      const formData = new FormData();
      formData.append("projectTimeline", JSON.stringify(localProjectTimelines));

      await updateClient({ id: clientId, formData }).unwrap();
      toast.success("Project timelines updated successfully!");
    } catch (err) {
      console.error("Error updating timelines:", err);
      toast.error("Failed to update project timelines.");
    } finally {
      setIsSavingTimelines(false);
    }
  };

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (
          key === "webDesignInstallments" ||
          key === "webDesignAgreement" ||
          key === "webDesignInstallmentReceipts" ||
          key === "microsoftServices"
        ) {
          return;
        }

        if (typeof value === "boolean") {
          formData.append(key, String(value));
        } else if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      if (
        data.webDesignAgreement instanceof FileList &&
        data.webDesignAgreement.length > 0
      ) {
        formData.append("webDesignAgreement", data.webDesignAgreement[0]);
      }

      const currentInstallments = watch("webDesignInstallments") || [];
      const processedInstallments = currentInstallments.map((inst) => ({
        ...inst,
        dueDate: inst.dueDate ? formatDateForBackend(inst.dueDate) : "",
        receipt: inst.receiptFile ? undefined : inst.receipt,
      }));

      formData.append(
        "webDesignInstallments",
        JSON.stringify(processedInstallments),
      );

      currentInstallments.forEach((inst, index) => {
        if (
          inst.receiptFile instanceof FileList &&
          inst.receiptFile.length > 0
        ) {
          formData.append(
            `webDesignInstallment${index + 1}Receipt`,
            inst.receiptFile[0],
          );
        }
      });

      const processedMicrosoftServices = microsoftServices.map((service) => ({
        ...service,
        activeDate: service.activeDate
          ? formatDateForBackend(service.activeDate)
          : "",
        expiryDate: service.expiryDate
          ? formatDateForBackend(service.expiryDate)
          : "",
        vendor: service.vendor,
        purchaseOrder: service.purchaseOrderFile
          ? undefined
          : service.purchaseOrder,
      }));

      formData.append(
        "microsoftServices",
        JSON.stringify(processedMicrosoftServices),
      );

      microsoftServices.forEach((service, index) => {
        if (service.purchaseOrderFile && service.purchaseOrderFile.length > 0) {
          formData.append(
            `microsoftServices[${index}][purchaseOrder]`,
            service.purchaseOrderFile[0],
          );
        }
      });

      await updateClient({ id: clientId, formData }).unwrap();
      toast.success("Client updated successfully!");
      router.push("/expiry/list");
    } catch (err) {
      console.error("Error updating client:", err);
      toast.error("Failed to update Client.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isClientLoading)
    return (
      <div className="min-h-screen bg-gray-100 p-6 dark:bg-secondary-dark">
        <div className="mx-auto w-full">
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-secondary-dark">
            <Skeleton className="mb-4 h-24 w-24 rounded-full" />
            <Skeleton className="mb-2 h-8 w-64" />
            <Skeleton className="mb-6 h-6 w-48" />
            <div className="mb-6 flex gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-32" />
              ))}
            </div>
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );

  if (isClientError)
    return (
      <div className="min-h-screen bg-gray-100 p-6 dark:bg-secondary-dark">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-secondary-dark">
            Error loading client: {JSON.stringify(clientError)}
          </div>
        </div>
      </div>
    );

  return (
    <div className="bg-gray-50 dark:bg-primary-dark">
      <div className="mx-auto w-full">
        <div className="flex items-start justify-between overflow-hidden border-t border-gray-200 bg-gray-50 shadow-lg dark:border-gray-600 dark:bg-secondary-dark">
          {/* Header Section */}
          <div className="w-[25%] border-r border-gray-200 bg-gray-50 p-4 pb-4 dark:border-gray-600">
            {/* Domain & Company Name  */}
            <div className="mb-4 flex flex-col items-center justify-center gap-4 rounded-lg bg-white p-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-gray-200 dark:border-gray-700 dark:bg-secondary-dark">
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {client?.companyName?.charAt(0) || "C"}
                </span>
              </div>
              <div className="w-full max-w-md flex-1">
                {isEditingCompany ? (
                  <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-secondary-dark">
                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("companyName", { required: true })}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                        placeholder="Company Name"
                      />
                      {errors.companyName && (
                        <p className="mt-1 text-base text-red-600">
                          Company name is required
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                        Domain Name
                      </label>
                      <input
                        type="text"
                        {...register("domainName")}
                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                        placeholder="domain.com"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingCompany(false);
                          reset({
                            companyName: client?.companyName,
                            domainName: client?.domainName,
                          });
                        }}
                        className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 dark:bg-secondary-dark dark:text-gray-200 dark:hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingCompany(false)}
                        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="group flex w-full items-center justify-center gap-4">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-200">
                        {client?.companyName || "Client Details"}
                      </h1>
                      <p className="mt-1 text-base font-medium text-blue-600 dark:text-blue-400">
                        {client?.domainName || "domain.com"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingCompany(true)}
                      className="text-gray-500 opacity-0 transition-opacity duration-200 hover:text-gray-700 group-hover:opacity-100 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <FiEdit className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Contact Information Section */}
            <div>
              <h3 className="mb-3 text-[14px] text-gray-600">
                Contact Details
              </h3>
              <div className="space-y-4 rounded-lg bg-white p-4 dark:bg-secondary-dark">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <User className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="">
                    <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-300">
                      Full Name
                    </label>
                    <div className="flex items-center rounded-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        type="text"
                        {...register("contactPerson")}
                        className="w-full rounded-md bg-transparent pr-3 text-[14px] font-semibold text-gray-900 focus:outline-none dark:text-gray-200"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Smartphone className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="">
                    <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-300">
                      Mobile
                    </label>
                    <div className="flex items-center rounded-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        type="tel"
                        {...register("contactPersonPhone")}
                        className="w-full rounded-md bg-transparent pr-3 text-[14px] font-semibold text-gray-900 focus:outline-none dark:text-gray-200"
                        placeholder="+977 9800000000"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Phone className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="">
                    <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-300">
                      Phone
                    </label>
                    <div className="flex items-center rounded-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        type="tel"
                        {...register("companyPhone")}
                        className="w-full rounded-md bg-transparent pr-3 text-[14px] font-semibold text-gray-900 focus:outline-none dark:text-gray-200"
                        placeholder="+977 9800000000"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Mail className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="">
                    <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-300">
                      Email 1
                    </label>
                    <div className="flex items-center rounded-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        type="email"
                        {...register("companyEmail")}
                        className="w-full rounded-md bg-transparent pr-3 text-[14px] font-semibold text-gray-900 focus:outline-none dark:text-gray-200"
                        placeholder="info@acme.com"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Mail className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="">
                    <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-300">
                      Email 2
                    </label>
                    <div className="flex items-center rounded-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        type="email"
                        {...register("contactPersonEmail")}
                        className="w-full rounded-md bg-transparent pr-3 text-[14px] font-semibold text-gray-900 focus:outline-none dark:text-gray-200"
                        placeholder="john.doe@acme.com"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <MapPin className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="">
                    <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-300">
                      Company Address
                    </label>
                    <div className="flex items-center rounded-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        type="text"
                        {...register("companyAddress")}
                        className="w-full rounded-md bg-transparent pr-3 text-[14px] font-semibold text-gray-900 focus:outline-none dark:text-gray-200"
                        placeholder="123 Main St, City, Country"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Hash className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="">
                    <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-300">
                      Pan Vat Num
                    </label>
                    <div className="flex items-center rounded-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        type="text"
                        {...register("pan_vat_num")}
                        className="w-full rounded-md bg-transparent pr-3 text-[14px] font-semibold text-gray-900 focus:outline-none dark:text-gray-200"
                        placeholder="Pan Vat No."
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="my-3 text-[14px] text-gray-600">
                  Additional Notes
                </h3>
                <div className="mt-2 rounded-md border border-gray-300 bg-white font-semibold text-[#0a0a0a] dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300">
                  <RichTextEditor
                    content={watch("additionalNotes") || ""}
                    onContentChange={(content) =>
                      setValue("additionalNotes", content, {
                        shouldDirty: true,
                      })
                    }
                    placeholder="Any special requirements or notes about this client..."
                    className="min-h-[200px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-[75%] bg-gray-50">
            {/* Tabs - Removed Timeline tab */}
            <nav className="m-4 -mb-px flex justify-between rounded-lg border border-gray-200 bg-white px-8 dark:border-gray-700">
              {/* Left side tabs */}
              <div className="flex space-x-8">
                {[
                  {
                    id: "services",
                    label: "Services",
                    icon: <Briefcase className="mr-2 inline-block h-5 w-5" />,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center border-b-2 px-1 py-4 text-base font-medium ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Right side tab (Edit History) */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab("payment")}
                  className={`flex items-center border-b-2 px-1 py-4 text-base font-medium ${
                    activeTab === "payment"
                      ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <FileText className="mr-2 inline-block h-4 w-4" />
                  Payment History
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex items-center border-b-2 px-1 py-4 text-base font-medium ${
                    activeTab === "history"
                      ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <Clock className="mr-2 inline-block h-4 w-4" />
                  Edit History
                </button>
              </div>
            </nav>

            {/* Tab Content */}
            <div className="p-4">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
                encType="multipart/form-data"
              >
                {activeTab === "services" && (
                  <div className="space-y-6 bg-gray-50">
                    {/* Domain & Hosting Service Section */}
                    <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-secondary-dark">
                      <div
                        className="mb-4 flex cursor-pointer items-center justify-between"
                        onClick={() => toggleSection("domainHosting")}
                      >
                        <div className="flex items-center gap-4">
                          <Globe className="h-6 w-6 text-[#0a0a0a] dark:text-gray-400" />
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                            Domain Service
                          </h2>
                        </div>

                        <div className="ml-10 flex items-center gap-4">
                          <Cloud className="h-7 w-7 text-[#0a0a0a] dark:text-gray-400" />
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                            Hosting Service
                          </h2>
                        </div>

                        {expandedSections.domainHosting ? (
                          <FiChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <FiChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>

                      {expandedSections.domainHosting && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          {/* Domain Service */}
                          <div className="space-y-4 rounded-md border border-gray-300 bg-white px-6 pb-6 pt-2 dark:border-gray-600">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-bold text-gray-900 dark:text-gray-200">
                                Domain Service
                              </h3>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsPaymentFormOpen(true);
                                  setPaymentCategory("domain");
                                }}
                                className="mt-2"
                              >
                                <BadgePlus className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                                Domain Payment
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                  Amount
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  {...register("domainAmount")}
                                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                  VAT Type
                                </label>
                                <select
                                  {...register("domainVatType")}
                                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                >
                                  <option value="">Select VAT Type</option>
                                  <option value="inclusive">
                                    VAT Inclusive
                                  </option>
                                  <option value="exclusive">
                                    VAT Exclusive
                                  </option>
                                  <option value="non-vat">Non-VAT</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                  Active Date
                                </label>
                                <input
                                  type="date"
                                  {...register("domainActiveDate")}
                                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                />
                              </div>

                              <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                  Expiry Date
                                </label>
                                <input
                                  type="date"
                                  {...register("domainExpiryDate")}
                                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Hosting Service */}
                          <div className="space-y-4 rounded-md border border-gray-300 bg-white px-6 pb-6 pt-2 dark:border-gray-600">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-bold text-gray-900 dark:text-gray-200">
                                Hosting Service
                              </h3>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setIsPaymentFormOpen(true);
                                  setPaymentCategory("hosting");
                                }}
                                className="mt-2"
                              >
                                <BadgePlus className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                                Hosting Payment
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                  Space (GB)
                                </label>
                                <input
                                  type="text"
                                  {...register("hostingSpace")}
                                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                  placeholder="10"
                                />
                              </div>
                              <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                  Amount
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  {...register("hostingAmount")}
                                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                  VAT Type
                                </label>
                                <select
                                  {...register("hostingVatType")}
                                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                >
                                  <option value="">Select VAT Type</option>
                                  <option value="inclusive">
                                    VAT Inclusive
                                  </option>
                                  <option value="exclusive">
                                    VAT Exclusive
                                  </option>
                                  <option value="non-vat">Non-VAT</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                  Active Date
                                </label>
                                <input
                                  type="date"
                                  {...register("hostingActiveDate")}
                                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                />
                              </div>

                              <div>
                                <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                  Expiry Date
                                </label>
                                <input
                                  type="date"
                                  {...register("hostingExpiryDate")}
                                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Maintenance Service Section */}
                    <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-secondary-dark">
                      <div
                        className="mb-4 flex cursor-pointer items-center justify-between"
                        onClick={() => toggleSection("maintenance")}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Wrench className="h-7 w-7 text-[#0a0a0a] dark:text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                              Maintenance Service
                            </h2>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsPaymentFormOpen(true);
                              setPaymentCategory("maintenance");
                            }}
                            className="mt-2"
                          >
                            <CirclePlus className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                            Maintenance Payment
                          </Button>
                        </div>

                        {expandedSections.maintenance ? (
                          <FiChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <FiChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>

                      {expandedSections.maintenance && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                Service Type
                              </label>
                              <select
                                {...register("maintenanceType")}
                                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                              >
                                <option value="basic">Basic</option>
                                <option value="standard">Standard</option>
                                <option value="premium">Premium</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                Amount
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                {...register("maintenanceAmount")}
                                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                VAT Type
                              </label>
                              <select
                                {...register("maintenanceVatType")}
                                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                              >
                                <option value="">Select VAT Type</option>
                                <option value="inclusive">VAT Inclusive</option>
                                <option value="exclusive">VAT Exclusive</option>
                                <option value="non-vat">Non-VAT</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                Active Date
                              </label>
                              <input
                                type="date"
                                {...register("maintenanceActiveDate")}
                                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                              />
                            </div>

                            <div>
                              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                Expiry Date
                              </label>
                              <input
                                type="date"
                                {...register("maintenanceExpiryDate")}
                                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                              />
                            </div>
                          </div>
                          <div className="col-span-full">
                            <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                              Maintenance Description
                            </label>
                            <div className="mt-2 rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300">
                              <RichTextEditor
                                content={watch("maintenanceDescription") || ""}
                                onContentChange={(content) =>
                                  setValue("maintenanceDescription", content, {
                                    shouldDirty: true,
                                  })
                                }
                                placeholder="Write maintenance description..."
                                className="min-h-[200px]"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Microsoft Service Section */}
                    <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-secondary-dark">
                      <div
                        className="mb-4 flex cursor-pointer items-center justify-between"
                        onClick={() => toggleSection("microsoft")}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Image
                              src="/microsoft.png"
                              height={20}
                              width={20}
                              alt="microsoft"
                            />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                              Microsoft Services
                            </h2>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsPaymentFormOpen(true);
                              setPaymentCategory("microsoft");
                            }}
                            className="mt-2"
                          >
                            <CirclePlus className="h-4 w-4 text-gray-600 dark:text-gray-200" />
                            Microsoft Payment
                          </Button>
                        </div>

                        {expandedSections.microsoft ? (
                          <FiChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <FiChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>

                      {expandedSections.microsoft && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                setMicrosoftServices([
                                  ...microsoftServices,
                                  {
                                    noOfAccounts: "",
                                    amount: 0,
                                    activeDate: "",
                                    expiryDate: "",
                                    serviceType: "",
                                    microsoftVatType: "",
                                    vendor: "",
                                    purchaseOrder: undefined,
                                  },
                                ]);
                              }}
                              className="flex items-center rounded-md border border-blue-600 bg-gray-50 px-4 py-2 text-base text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <BadgePlus className="mr-1 h-4 w-4" />
                              Add New Microsoft Service
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {microsoftServices.map((service, index) => (
                              <div
                                key={index}
                                className="rounded-md border border-gray-400 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-secondary-dark"
                              >
                                <div className="mb-3 flex items-center justify-between">
                                  <h5 className="text-base font-medium text-gray-900 dark:text-gray-200">
                                    Microsoft Service {index + 1}
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteMicrosoftService(index)
                                    }
                                    className="text-base text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                  >
                                    Delete
                                  </button>
                                </div>

                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                        No of Accounts
                                      </label>
                                      <input
                                        type="text"
                                        value={service.noOfAccounts}
                                        onChange={(e) =>
                                          handleMicrosoftServiceChange(
                                            index,
                                            "noOfAccounts",
                                            e.target.value,
                                          )
                                        }
                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                        placeholder="10"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                        Amount
                                      </label>
                                      <input
                                        type="number"
                                        step="0.01"
                                        value={service.amount}
                                        onChange={(e) =>
                                          handleMicrosoftServiceChange(
                                            index,
                                            "amount",
                                            parseFloat(e.target.value) || 0,
                                          )
                                        }
                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                        placeholder="0.00"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                        VAT Type
                                      </label>
                                      <select
                                        value={service.microsoftVatType}
                                        onChange={(e) =>
                                          handleMicrosoftServiceChange(
                                            index,
                                            "microsoftVatType",
                                            e.target.value,
                                          )
                                        }
                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                      >
                                        <option value="">
                                          Select VAT Type
                                        </option>
                                        <option value="inclusive">
                                          VAT Inclusive
                                        </option>
                                        <option value="exclusive">
                                          VAT Exclusive
                                        </option>
                                        <option value="non-vat">Non-VAT</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                        Active Date
                                      </label>
                                      <input
                                        type="date"
                                        value={service.activeDate}
                                        onChange={(e) =>
                                          handleMicrosoftServiceChange(
                                            index,
                                            "activeDate",
                                            e.target.value,
                                          )
                                        }
                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                        Expiry Date
                                      </label>
                                      <input
                                        type="date"
                                        value={service.expiryDate}
                                        onChange={(e) =>
                                          handleMicrosoftServiceChange(
                                            index,
                                            "expiryDate",
                                            e.target.value,
                                          )
                                        }
                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                        Service Type
                                      </label>
                                      <select
                                        value={service.serviceType}
                                        onChange={(e) =>
                                          handleMicrosoftServiceChange(
                                            index,
                                            "serviceType",
                                            e.target.value,
                                          )
                                        }
                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                      >
                                        <option value="365 Business Basic">
                                          Business Basic
                                        </option>
                                        <option value="365 Business Standard">
                                          Business Standard
                                        </option>
                                        <option value="365 Business Premium">
                                          Business Premium
                                        </option>
                                        <option value="Apps for business">
                                          Apps for business
                                        </option>
                                        <option value=" Non-Profit">
                                          Non-Profit
                                        </option>
                                        <option value="Education">
                                          Education
                                        </option>
                                        <option value="Copilot">Copilot</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                        Vendor
                                      </label>
                                      <select
                                        value={service.vendor || ""}
                                        onChange={(e) =>
                                          handleMicrosoftServiceChange(
                                            index,
                                            "vendor",
                                            e.target.value as
                                              | "Connex"
                                              | "iDream"
                                              | undefined,
                                          )
                                        }
                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-semibold text-[#0a0a0a] focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                      >
                                        <option value="">Select Vendor</option>
                                        <option value="Connex">Connex</option>
                                        <option value="iDream">iDream</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Project Description Section */}
                    <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-secondary-dark">
                      <div
                        className="mb-4 flex cursor-pointer items-center justify-between"
                        onClick={() => toggleSection("project")}
                      >
                        <div className="flex w-full items-center justify-between">
                          <div className="flex items-center gap-4">
                            <FolderCode className="h-7 w-7 text-[#0a0a0a] dark:text-gray-400" />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                              Web Design Services
                            </h2>
                          </div>
                        </div>

                        {expandedSections.project ? (
                          <FiChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <FiChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>

                      {expandedSections.project && (
                        <div>
                          <div className="flex items-center justify-between gap-8">
                            <div className="w-[25%]">
                              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                Categories{" "}
                                <span className="text-xs text-gray-500">
                                  (Multiple Select Option)
                                </span>
                              </label>
                              <Select
                                options={[
                                  { value: "APP", label: "APP" },
                                  { value: "Conference", label: "Conference" },
                                  { value: "Corporate", label: "Corporate" },
                                  { value: "Ecommerce", label: "E-commerce" },
                                  { value: "E-learning", label: "E-learning" },
                                  {
                                    value: "Edu Consultancy",
                                    label: "Edu Consultancy",
                                  },
                                  {
                                    value: "Engineering",
                                    label: "Engineering",
                                  },
                                  { value: "Government", label: "Government" },
                                  {
                                    value: "Hospitals/ Clinics",
                                    label: "Hospitals/ Clinics",
                                  },
                                  {
                                    value: "Hotel/ Resort/ Homestay",
                                    label: "Hotel/ Resort/ Homestay",
                                  },
                                  { value: "Hydropower", label: "Hydropower" },
                                  {
                                    value: "International",
                                    label: "International",
                                  },
                                  { value: "News/ Blog", label: "News/Blog" },
                                  { value: "Ngo/ Ingo", label: "NGO/INGO" },
                                  { value: "Other", label: "Other" },
                                  { value: "Outsourced", label: "Outsourced" },
                                  {
                                    value: "Personal Portfolio",
                                    label: "Personal Portfolio",
                                  },
                                  {
                                    value: "Product Catalog",
                                    label: "Product Catalog",
                                  },
                                  {
                                    value: "Real Estate",
                                    label: "Real Estate",
                                  },
                                  { value: "School", label: "School" },
                                  { value: "Startups", label: "Startups" },
                                  { value: "Trekking", label: "Trekking" },
                                ]}
                                placeholder="Select Categories"
                                className="mt-1"
                                classNamePrefix="select"
                                isMulti={true}
                                value={
                                  watch("webDesignCategories")?.map((cat) => ({
                                    value: cat,
                                    label: cat,
                                  })) || []
                                }
                                onChange={(selected) => {
                                  const categories = selected
                                    ? selected.map((option) => option.value)
                                    : [];
                                  setValue("webDesignCategories", categories, {
                                    shouldDirty: true,
                                  });
                                }}
                                styles={{
                                  control: (base, { isFocused }) => ({
                                    ...base,
                                    backgroundColor: "hsl(var(--background))",
                                    borderColor: isFocused
                                      ? "hsl(var(--primary))"
                                      : "hsl(var(--border))",
                                    borderWidth: "1px",
                                    borderRadius: "0.375rem",
                                    boxShadow: isFocused
                                      ? "0 0 0 2px hsl(var(--primary)/0.2)"
                                      : "none",
                                    "&:hover": {
                                      borderColor: "hsl(var(--primary))",
                                    },
                                    minHeight: "38px",
                                  }),
                                  menu: (base) => ({
                                    ...base,
                                    backgroundColor: "hsl(var(--background))",
                                    borderColor: "hsl(var(--border))",
                                    borderWidth: "1px",
                                    borderRadius: "0.375rem",
                                    marginTop: "4px",
                                    boxShadow:
                                      "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                    zIndex: 9999,
                                  }),
                                  option: (
                                    base,
                                    { isFocused, isSelected },
                                  ) => ({
                                    ...base,
                                    backgroundColor: isSelected
                                      ? "hsl(var(--primary))"
                                      : isFocused
                                        ? "hsl(var(--primary)/0.1)"
                                        : "transparent",
                                    color:
                                      isSelected || isFocused
                                        ? "hsl(var(--primary-foreground))"
                                        : "hsl(var(--foreground))",
                                    "&:active": {
                                      backgroundColor:
                                        "hsl(var(--primary)/0.2)",
                                    },
                                  }),
                                  singleValue: (base) => ({
                                    ...base,
                                    color: "hsl(var(--foreground))",
                                  }),
                                  input: (base) => ({
                                    ...base,
                                    color: "hsl(var(--foreground))",
                                  }),
                                  placeholder: (base) => ({
                                    ...base,
                                    color: "hsl(var(--muted-foreground))",
                                  }),
                                }}
                              />
                            </div>

                            <div className="w-[25%]">
                              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                Tech Stack
                              </label>
                              <select
                                {...register("webDesignTechStack")}
                                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                              >
                                <option value="">Select Tech Stack</option>
                                <option value="HTML + WordPress">
                                  HTML + WordPress
                                </option>
                                <option value="HTML + Laravel">
                                  HTML + Laravel
                                </option>
                                <option value="Next.js + Laravel">
                                  Next.js + Laravel
                                </option>
                                <option value="Next.js + Node.js">
                                  Next.js + Node.js
                                </option>
                              </select>
                            </div>

                            <div className="w-[25%]">
                              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                Rating
                              </label>
                              <select
                                {...register("webDesignRating")}
                                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                              >
                                <option value="">Select Rating</option>
                                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(
                                  (rating) => (
                                    <option
                                      key={rating}
                                      value={rating}
                                      selected={
                                        watch("webDesignRating") === rating
                                      }
                                    >
                                      {rating}
                                    </option>
                                  ),
                                )}
                              </select>
                            </div>
                            <div className="w-[25%]">
                              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                Agreement Attachment
                              </label>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                {...register("webDesignAgreement")}
                                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                              />
                              {client?.webDesignAgreement && (
                                <div className="mt-2 flex-col items-center gap-2">
                                  <span className="text-base font-normal text-gray-600 dark:text-gray-300">
                                    Current Agreement:
                                  </span>
                                  <a
                                    href={buildFileUrl(
                                      client.webDesignAgreement,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-blue-600 hover:text-blue-800"
                                    title="View PDF"
                                  >
                                    <Image
                                      src="/pdf.png"
                                      alt="PDF Icon"
                                      width={40}
                                      height={40}
                                      className="mt-2 h-12 w-12"
                                    />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Add these new date fields */}
                          <div className="mt-5 flex items-center justify-start gap-8">
                            <div className="w-[23%]">
                              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                Project Start Date
                              </label>
                              <input
                                type="date"
                                {...register("startDate")}
                                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                              />
                            </div>
                            <div className="w-[23%]">
                              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                Project Due Date
                              </label>
                              <input
                                type="date"
                                {...register("endDate")}
                                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                              />
                            </div>
                            <div className="w-[23%]">
                              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                Google Drive Link
                              </label>
                              <input
                                type="url"
                                {...register("googleDriveLink")}
                                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                                placeholder="https://drive.google.com/..."
                              />
                            </div>
                          </div>
                          <div className="mt-5 flex items-center justify-start gap-8">
                            <div className="w-[23%]">
                              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                Website Live Date
                              </label>
                              <input
                                type="date"
                                {...register("websiteLiveDate")}
                                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                              />
                            </div>
                            <div className="w-[23%]">
                              <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                                Support Expiry Date
                              </label>
                              <input
                                type="date"
                                {...register("websiteSupportPeriod")}
                                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                              />
                            </div>
                          </div>

                          <div className="mt-8">
                            <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                              Project Description
                            </label>
                            <div className="mt-2 rounded-md border border-gray-300 bg-white dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300">
                              <RichTextEditor
                                content={watch("projectDescription") || ""}
                                onContentChange={(content) =>
                                  setValue("projectDescription", content, {
                                    shouldDirty: true,
                                  })
                                }
                                placeholder="Write project description..."
                                className="min-h-[300px]"
                              />
                            </div>
                          </div>

                          {/* Project Timeline Section - Added to Project Description Tab */}
                          <div className="mt-8">
                            <div className="mb-4 flex items-center justify-between">
                              <h3 className="text-lg font-semibold">
                                Project Timeline
                              </h3>
                              <Button
                                onClick={() => setShowTimeline(!showTimeline)}
                                variant="outline"
                                type="button"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {showTimeline
                                  ? "Hide Timeline"
                                  : "Show Timeline"}
                              </Button>
                            </div>

                            {showTimeline && (
                              <div className="rounded-xl bg-gray-50 p-6 dark:bg-secondary-dark">
                                <div className="mb-4 flex items-center justify-between">
                                  <Button
                                    onClick={saveTimelines}
                                    disabled={
                                      isSavingTimelines ||
                                      localProjectTimelines.length === 0
                                    }
                                  >
                                    {isSavingTimelines
                                      ? "Saving..."
                                      : "Save Timelines"}
                                  </Button>
                                </div>
                                <ProjectTimelineComponent
                                  timelines={localProjectTimelines}
                                  clientId={clientId}
                                  onUpdate={setLocalProjectTimelines}
                                  isUpdating={isUpdating}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "payment" && (
                  <div className="rounded-xl bg-gray-50 p-6 dark:bg-secondary-dark">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                        Payment History
                      </h2>
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="overflow-hidden rounded-lg border dark:border-gray-700">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <Button variant="ghost" className="p-0">
                                Client
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" className="p-0">
                                Category
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" className="p-0">
                                Payment Type
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" className="p-0">
                                Amount
                              </Button>
                            </TableHead>
                            <TableHead>
                              <Button variant="ghost" className="p-0">
                                Paid Date
                              </Button>
                            </TableHead>
                            <TableHead>Receipt</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {client?.payments?.length ? (
                            client.payments.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>
                                  {client.domainName ||
                                    client.companyName ||
                                    "N/A"}
                                </TableCell>
                                <TableCell>
                                  {payment.category
                                    .split("_")
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1),
                                    )
                                    .join(" ")}
                                </TableCell>
                                <TableCell>{payment.paymentType}</TableCell>
                                <TableCell>
                                  {payment.amount.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  {format(
                                    new Date(payment.paidDate),
                                    "MMM d, yyyy",
                                  )}
                                </TableCell>
                                <TableCell>
                                  {payment.receiptUrl ? (
                                    <a
                                      href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${payment.receiptUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block"
                                    >
                                      <div className="relative h-12 w-12 overflow-hidden rounded border border-gray-200 transition-opacity hover:opacity-80">
                                        <Image
                                          src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${payment.receiptUrl}`}
                                          alt="Receipt preview"
                                          fill
                                          className="object-cover"
                                          sizes="48px"
                                        />
                                      </div>
                                    </a>
                                  ) : (
                                    "N/A"
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="py-4 text-center"
                              >
                                No payment history found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="rounded-xl bg-gray-50 p-6 dark:bg-secondary-dark">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                        Edit History
                      </h2>
                      <Activity className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="space-y-4">
                      {isActivitiesLoading ? (
                        <p className="text-gray-600 dark:text-gray-300">
                          Loading activities...
                        </p>
                      ) : activities?.length ? (
                        activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="border-b pb-3 last:border-0"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium capitalize">
                                  {activity.action.toLowerCase()}
                                </p>
                                <p className="text-base text-gray-600 dark:text-gray-400">
                                  {activity.details}
                                </p>
                              </div>
                              <div className="ml-4 whitespace-nowrap text-base text-gray-500">
                                {format(
                                  new Date(activity.timestamp),
                                  "MMM d, yyyy h:mm a",
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="py-4 text-center text-gray-500">
                          No activities found
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {isDirty && (
                  <div className="flex justify-end pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <BadgeCheck className="h-5 w-5 text-white dark:text-white" />
                      {isSubmitting ? "Updating..." : "Update Client"}
                    </button>
                  </div>
                )}

                {/* Add this before the final closing tags */}
                <PaymentForm
                  isOpen={isPaymentFormOpen}
                  onClose={() => setIsPaymentFormOpen(false)}
                  mode="create"
                  payment={{
                    clientId: clientId.toString(),
                    category: paymentCategory,
                    amount:
                      paymentCategory === "website"
                        ? watch("webDesignTotalAmount")?.toString()
                        : paymentCategory === "domain"
                          ? watch("domainAmount")?.toString()
                          : paymentCategory === "hosting"
                            ? watch("hostingAmount")?.toString()
                            : paymentCategory === "maintenance"
                              ? watch("maintenanceAmount")?.toString()
                              : "",
                    // Add other default values as needed
                  }}
                />

                <DeleteModal
                  isOpen={deleteModalOpen}
                  onClose={() => {
                    setDeleteModalOpen(false);
                    setServiceToDelete(null);
                  }}
                  onConfirm={confirmDeleteMicrosoftService}
                  title="Delete Microsoft Service?"
                  description="This action cannot be undone. This will permanently delete this Microsoft service from the client's record."
                  confirmText="Yes, delete!"
                  cancelText="No, keep it."
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withRoleAuth(ClientViewEditPage, ["ADMIN"]);
