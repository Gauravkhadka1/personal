// client/src/app/clients/create/page.tsx (updated version)
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
// import { toast } from "sonner";
import toast from "react-hot-toast";
import Select from "react-select";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useCreateClientMutation } from "@/state/api";
import {
  BadgePlus,
  Cloud,
  Factory,
  FolderCode,
  Globe,
  Hash,
  Mail,
  MapPin,
  Phone,
  Plus,
  Smartphone,
  User,
  Wrench,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import withRoleAuth from "@/hoc/withRoleAuth";
import { Briefcase, Clock, Contact } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import Image from "next/image";
import ConfettiCelebration from "@/components/ConfettiCelebration";

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
  vendor?: "Connex" | "iDream";
  purchaseOrder: File | null;
}

interface ClientFormData {
  domainName?: string;
  hostingSpace?: string;
  companyName: string;
  companyEmail?: string;
  companyAddress?: string;
  companyPhone?: string;
  contactPerson?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  additionalNotes?: string;
  projectDescription?: string;
  googleDriveLink?: string;
  startDate?: string;
  endDate?: string;
  pan_vat_num?: string;
  webDesignCategories?: string[];
  webDesignTechStack?: string;
  webDesignRating?: number;
  webDesignTotalAmount?: number;
  webDesignVatType?: string;
  webDesignAgreement?: FileList | null;
  webDesignInstallments?: Installment[];
  domainActiveDate?: string;
  domainExpiryDate?: string;
  domainAmount?: number;
  domainType?: DomainType;
  domainVatType?: string;
  hostingActiveDate?: string;
  hostingExpiryDate?: string;
  hostingAmount?: number;
  hostingType?: ServiceType;
  hostingVatType?: string;

  microsoftServices?: MicrosoftService[];

  maintenanceActiveDate?: string;
  maintenanceExpiryDate?: string;
  maintenanceAmount?: number;
  maintenanceType?: ServiceType;
  maintenanceVatType?: string;
  maintenanceDescription?: string;
}

const ClientCreatePage = () => {
  const router = useRouter();
  const [createClient, { isLoading: isCreating }] = useCreateClientMutation();
  const [showConfetti, setShowConfetti] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ClientFormData>();
  const [installmentCount, setInstallmentCount] = useState<2 | 3 | 4>(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("contact");

  const [microsoftServices, setMicrosoftServices] = useState<
    MicrosoftService[]
  >([
    {
      noOfAccounts: "",
      amount: 0,
      activeDate: "",
      expiryDate: "",
      serviceType: "365 Business Basic",
      microsoftVatType: "",
      vendor: undefined,
      purchaseOrder: null,
    },
  ]);

  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    webDesign: false,
    domainHosting: true,
    maintenance: false,
    microsoft: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
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

    setValue("webDesignInstallments", newInstallments);
  };

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

    setValue("webDesignInstallments", updatedInstallments);
  };

  const handleConfettiComplete = () => {
    setShowConfetti(false);
  };

  // Replace the existing onSubmit function with:
  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Append all regular fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === "webDesignInstallments") {
          formData.append(key, JSON.stringify(value));
        }
        // Handle webDesignCategories as JSON string
        else if (key === "webDesignCategories" && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value instanceof FileList && value.length > 0) {
          formData.append(key, value[0]);
        } else if (
          value !== null &&
          value !== undefined &&
          typeof value !== "object"
        ) {
          formData.append(key, String(value));
        }
      });

      microsoftServices.forEach((service, index) => {
        formData.append(
          `microsoftServices[${index}][noOfAccounts]`,
          service.noOfAccounts,
        );
        formData.append(
          `microsoftServices[${index}][amount]`,
          String(service.amount),
        );
        formData.append(
          `microsoftServices[${index}][activeDate]`,
          service.activeDate,
        );
        formData.append(
          `microsoftServices[${index}][expiryDate]`,
          service.expiryDate,
        );
        formData.append(
          `microsoftServices[${index}][serviceType]`,
          service.serviceType,
        );
        formData.append(
          `microsoftServices[${index}][microsoftVatType]`,
          service.microsoftVatType,
        );

        if (service.vendor) {
          formData.append(
            `microsoftServices[${index}][vendor]`,
            service.vendor,
          );
        }

        if (service.purchaseOrder) {
          formData.append(
            `microsoftServices[${index}][purchaseOrder]`,
            service.purchaseOrder,
          );
        }
      });

      // Append installment receipt files
      if (data.webDesignInstallments) {
        data.webDesignInstallments.forEach((installment, index) => {
          if (installment.receiptFile && installment.receiptFile.length > 0) {
            formData.append(
              `webDesignInstallments[${index}][receiptFile]`,
              installment.receiptFile[0],
            );
          }
        });
      }

      await createClient(formData).unwrap();
      
      // Show success toast
  toast.success("Client created successfully!");
      
      // Trigger confetti celebration
      setShowConfetti(true);
      
      // Redirect after a short delay to allow celebration to start
      setTimeout(() => {
        router.push("/expiry/list");
      }, 1500);
      
    } catch (error: any) {
      console.error("Error creating client:", error);
      if (error.data?.error === "DOMAIN_EXISTS") {
        toast.error(
          <div>
            <p>{error.data.message}</p>
            <button
              onClick={() =>
                router.push(`/clients/${error.data.existingClientId}`)
              }
              className="mt-2 text-blue-500 underline"
            >
              View existing client
            </button>
          </div>,
          { duration: 5000 },
        );
      } else {
        toast.error("Failed to create client");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="overflow-hidden border-t border-gray-200 bg-gray-50 shadow-md dark:bg-primary-dark">
      {/* Confetti Celebration Component */}
      <ConfettiCelebration 
        trigger={showConfetti}
        onComplete={handleConfettiComplete}
        intensity="ultimate"
        duration={4000}
      />
      
      <div className="px-4">
        <h1 className="my-2 flex items-center gap-2 rounded-lg bg-white p-4 text-2xl font-bold text-gray-800 dark:text-gray-200">
          <BadgePlus className="h-6 w-6 text-gray-600" />
          Create New Client
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-start justify-between">
            {/* Contact Information Section */}

            <div className="flex w-[25%] flex-col gap-6 border-r border-gray-200 md:flex-row">
              {/* Company Details */}
              <div className="flex-1 space-y-4 rounded-lg bg-white p-4 dark:bg-secondary-dark">
                {/* Company Name  */}
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Factory className="h-6 w-6 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="w-full">
                    <label className="mb-1 block text-[12px] font-semibold text-gray-600 dark:text-gray-300">
                      Company Name <span className="italic">(Required)</span>
                    </label>
                    <div className="flex items-center rounded-md border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        type="text"
                        {...register("companyName", { required: true })}
                        className="w-full rounded-md bg-transparent px-3 py-1 font-semibold text-[#0a0a0a] focus:outline-none dark:text-gray-200"
                        placeholder="Acme Inc."
                      />
                    </div>
                  </div>
                </div>

                {errors.companyName && (
                  <p className="mt-1 text-base text-red-600">
                    Company name is required
                  </p>
                )}

                {/* Domain Name  */}
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Globe className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="w-full">
                    <label className="block text-[12px] font-semibold text-gray-600 dark:text-gray-300">
                      Domain Name
                    </label>
                    <div className="flex items-center rounded-md border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        type="text"
                        {...register("domainName")}
                        className="w-full rounded-md bg-transparent px-3 py-1 font-semibold text-[#0a0a0a] focus:outline-none dark:text-gray-200"
                        placeholder="acme.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Email  */}
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Mail className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="w-full">
                    <label className="block text-[12px] font-semibold text-gray-600 dark:text-gray-300">
                      Company Email
                    </label>
                    <div className="flex items-center rounded-md border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        type="email"
                        {...register("companyEmail")}
                        className="w-full rounded-md bg-transparent px-3 py-1 font-semibold text-[#0a0a0a] focus:outline-none dark:text-gray-200"
                        placeholder="info@acme.com"
                      />
                    </div>
                  </div>
                </div>
                {/* Company Phone  */}
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Phone className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="w-full">
                    <label className="block text-[12px] font-semibold text-gray-600 dark:text-gray-300">
                      Company Phone
                    </label>
                    <div className="flex items-center rounded-md border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        type="tel"
                        {...register("companyPhone")}
                        className="w-full rounded-md bg-transparent px-3 py-1 font-semibold text-[#0a0a0a] focus:outline-none dark:text-gray-200"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
                {/* Company Address  */}
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <MapPin className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="w-full">
                    <label className="block text-[12px] font-semibold text-gray-600 dark:text-gray-300">
                      Company Address
                    </label>
                    <div className="flex items-center rounded-md border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        {...register("companyAddress")}
                        type="text"
                        className="w-full rounded-md bg-transparent px-3 py-1 font-semibold text-[#0a0a0a] focus:outline-none dark:text-gray-200"
                        placeholder="123 Main St, City, Country"
                      />
                    </div>
                  </div>
                </div>
                {/* PAN VAT N0.  */}
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Hash className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="w-full">
                    <label className="block text-[12px] font-semibold text-gray-600 dark:text-gray-300">
                      Pan/ Vat Number
                    </label>
                    <div className="flex items-center rounded-md border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        {...register("pan_vat_num")}
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-1 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                        placeholder="pan vat number"
                      />
                    </div>
                  </div>
                </div>
                {/* Contact Person  */}
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <User className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="w-full">
                    <label className="block text-[12px] font-semibold text-gray-600 dark:text-gray-300">
                      Contact Person
                    </label>
                    <div className="flex items-center rounded-md border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        type="text"
                        {...register("contactPerson")}
                        className="w-full rounded-md bg-transparent px-3 py-1 font-semibold text-[#0a0a0a] focus:outline-none dark:text-gray-200"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                </div>
                {/* Contact Person Phone */}
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Smartphone className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="w-full">
                    <label className="block text-[12px] font-semibold text-gray-600 dark:text-gray-300">
                      Contact Person Phone
                    </label>
                    <div className="flex items-center rounded-md border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        type="tel"
                        {...register("contactPersonPhone")}
                        className="w-full rounded-md bg-transparent px-3 py-1 font-semibold text-[#0a0a0a] focus:outline-none dark:text-gray-200"
                        placeholder="+1 (555) 987-6543"
                      />
                    </div>
                  </div>
                </div>
                {/* Contact Person Email */}
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <Mail className="h-5 w-5 text-[#0a0a0a] dark:text-gray-400" />
                  </div>
                  <div className="w-full">
                    <label className="block text-[12px] font-semibold text-gray-600 dark:text-gray-300">
                      Contact Person Email
                    </label>
                    <div className="flex items-center rounded-md border border-gray-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark">
                      <input
                        type="email"
                        {...register("contactPersonEmail")}
                        className="w-full rounded-md bg-transparent px-3 py-1 font-semibold text-[#0a0a0a] focus:outline-none dark:text-gray-200"
                        placeholder="john.doe@acme.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-base font-semibold text-gray-700 dark:text-gray-300">
                    Additional Notes
                  </label>
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

            <div className="w-[75%] space-y-6 bg-gray-50 pl-6">
              {/* Domain & Hosting Service Section */}
              <div className="overflow-hidden rounded-lg border dark:border-gray-700">
                <div
                  className="flex cursor-pointer items-center justify-between bg-white p-4"
                  onClick={() => toggleSection("domainHosting")}
                >
                  <div className="flex w-full items-center justify-between bg-white">
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
                </div>
                {expandedSections.domainHosting && (
                  <div className="flex flex-col gap-4 bg-white md:flex-row">
                    {/* Domain Service */}
                    <div className="m-4 mt-2 flex-1 space-y-4 rounded-lg border border-gray-200 p-4 dark:bg-secondary-dark">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                            Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register("domainAmount")}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                            VAT Type
                          </label>
                          <select
                            {...register("domainVatType")}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
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
                          <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                            Active Date
                          </label>
                          <input
                            type="date"
                            {...register("domainActiveDate")}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            {...register("domainExpiryDate")}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Hosting Service */}
                    <div className="my-4 mr-4 mt-2 flex-1 space-y-4 rounded-lg border border-gray-200 p-4 dark:bg-secondary-dark">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                            Space (GB)
                          </label>
                          <input
                            type="text"
                            {...register("hostingSpace")}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                            placeholder="10"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                            Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register("hostingAmount")}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                            VAT Type
                          </label>
                          <select
                            {...register("hostingVatType")}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
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
                          <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                            Active Date
                          </label>
                          <input
                            type="date"
                            {...register("hostingActiveDate")}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            {...register("hostingExpiryDate")}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Maintenance Service Section */}

              <div className="overflow-hidden rounded-lg border bg-white dark:border-gray-700">
                <div
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-white p-4"
                  onClick={() => toggleSection("maintenance")}
                >
                  <div className="flex items-center gap-4">
                    <Wrench className="h-7 w-7 text-[#0a0a0a] dark:text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                      Maintenance Service
                    </h2>
                  </div>

                  {expandedSections.maintenance ? (
                    <FiChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <FiChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>

                {expandedSections.maintenance && (
                  <div className="flex flex-col gap-6 md:flex-row">
                    <div className="flex-1 space-y-4 rounded-lg p-6 dark:bg-secondary-dark">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                            Service Type
                          </label>
                          <select
                            {...register("maintenanceType")}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                          >
                            <option value="">Select Service Type</option>
                            <option value="basic">Basic</option>
                            <option value="standard">Standard</option>
                            <option value="premium">Premium</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                            Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            {...register("maintenanceAmount")}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                            VAT Type
                          </label>
                          <select
                            {...register("maintenanceVatType")}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
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
                          <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                            Active Date
                          </label>
                          <input
                            type="date"
                            {...register("maintenanceActiveDate")}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            {...register("maintenanceExpiryDate")}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                          />
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
                    </div>
                  </div>
                )}
              </div>

              {/* Microsoft Service Section */}

              <div className="overflow-hidden rounded-lg border bg-white dark:border-gray-700">
                <div
                  className="mb-4 flex cursor-pointer items-center justify-between p-4"
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
                  </div>

                  {expandedSections.microsoft ? (
                    <FiChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <FiChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                {expandedSections.microsoft && (
                  <div className="flex flex-col gap-6">
                    <div className="flex-1 space-y-4 rounded-lg p-6 dark:bg-secondary-dark">
                      <div className="mb-8 flex items-center justify-between">
                        <button className="flex items-center gap-2 rounded-md border border-blue-600 bg-gray-50 px-4 py-2 text-blue-600">
                          <BadgePlus
                            className="ml-2 h-5 w-5 cursor-pointer text-blue-600"
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
                                  purchaseOrder: null,
                                },
                              ]);
                            }}
                          />
                          Add New Microsoft Service
                        </button>
                      </div>

                      <div className="space-y-8">
                        {/* Group services into pairs for 2-column layout */}
                        {Array.from({
                          length: Math.ceil(microsoftServices.length / 2),
                        }).map((_, rowIndex) => (
                          <div
                            key={rowIndex}
                            className="grid grid-cols-1 gap-8 md:grid-cols-2"
                          >
                            {/* Render 2 services per row */}
                            {[0, 1].map((colIndex) => {
                              const serviceIndex = rowIndex * 2 + colIndex;
                              const service = microsoftServices[serviceIndex];

                              if (!service) return null; // Skip if no service for this position

                              return (
                                <div
                                  key={serviceIndex}
                                  className="rounded-lg border border-gray-300 p-4 dark:border-gray-700"
                                >
                                  <h5 className="mb-3 font-medium text-gray-700 dark:text-gray-300">
                                    Microsoft Service {serviceIndex + 1}
                                  </h5>

                                  <div className="space-y-4">
                                    {/* Service Type and Purchase Order in same row */}

                                    {/* Number of Accounts and Amount in one row */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                      <div>
                                        <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                                          No of Accounts
                                        </label>
                                        <input
                                          type="text"
                                          value={service.noOfAccounts}
                                          onChange={(e) => {
                                            const updatedServices = [
                                              ...microsoftServices,
                                            ];
                                            updatedServices[
                                              serviceIndex
                                            ].noOfAccounts = e.target.value;
                                            setMicrosoftServices(
                                              updatedServices,
                                            );
                                          }}
                                          className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                                          placeholder="10"
                                        />
                                      </div>

                                      <div>
                                        <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                                          Amount
                                        </label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={service.amount}
                                          onChange={(e) => {
                                            const updatedServices = [
                                              ...microsoftServices,
                                            ];
                                            updatedServices[
                                              serviceIndex
                                            ].amount =
                                              parseFloat(e.target.value) || 0;
                                            setMicrosoftServices(
                                              updatedServices,
                                            );
                                          }}
                                          className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                                          VAT Type
                                        </label>
                                        <select
                                          value={service.microsoftVatType || ""}
                                          onChange={(e) => {
                                            const updatedServices = [
                                              ...microsoftServices,
                                            ];
                                            updatedServices[
                                              serviceIndex
                                            ].microsoftVatType = e.target.value;
                                            setMicrosoftServices(
                                              updatedServices,
                                            );
                                          }}
                                          className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
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
                                          <option value="non-vat">
                                            Non-VAT
                                          </option>
                                        </select>
                                      </div>
                                    </div>

                                    {/* Dates in one row */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                      <div>
                                        <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                                          Active Date
                                        </label>
                                        <input
                                          type="date"
                                          value={service.activeDate}
                                          onChange={(e) => {
                                            const updatedServices = [
                                              ...microsoftServices,
                                            ];
                                            updatedServices[
                                              serviceIndex
                                            ].activeDate = e.target.value;
                                            setMicrosoftServices(
                                              updatedServices,
                                            );
                                          }}
                                          className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                                        />
                                      </div>

                                      <div>
                                        <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                                          Expiry Date
                                        </label>
                                        <input
                                          type="date"
                                          value={service.expiryDate}
                                          onChange={(e) => {
                                            const updatedServices = [
                                              ...microsoftServices,
                                            ];
                                            updatedServices[
                                              serviceIndex
                                            ].expiryDate = e.target.value;
                                            setMicrosoftServices(
                                              updatedServices,
                                            );
                                          }}
                                          className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                      <div>
                                        <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                                          Service Type
                                        </label>
                                        <select
                                          value={service.serviceType}
                                          onChange={(e) => {
                                            const updatedServices = [
                                              ...microsoftServices,
                                            ];
                                            updatedServices[
                                              serviceIndex
                                            ].serviceType = e.target.value;
                                            setMicrosoftServices(
                                              updatedServices,
                                            );
                                          }}
                                          className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
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
                                          <option value="Copilot">
                                            Copilot
                                          </option>
                                        </select>
                                      </div>

                                      <div>
                                        <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                                          Vendor
                                        </label>
                                        <select
                                          value={service.vendor || ""}
                                          onChange={(e) => {
                                            const updatedServices = [
                                              ...microsoftServices,
                                            ];
                                            updatedServices[
                                              serviceIndex
                                            ].vendor = e.target.value as
                                              | "Connex"
                                              | "iDream"
                                              | undefined;
                                            setMicrosoftServices(
                                              updatedServices,
                                            );
                                          }}
                                          className="w-full rounded-md border border-gray-300 px-3 py-2 font-semibold text-[#0a0a0a] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                                        >
                                          <option value="">
                                            Select Vendor
                                          </option>
                                          <option value="Connex">Connex</option>
                                          <option value="iDream">iDream</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Web Design Service Section */}
              <div className="overflow-hidden rounded-lg border bg-white dark:border-gray-700">
                <div
                  className="mb-4 flex cursor-pointer items-center justify-between p-4"
                  onClick={() => toggleSection("webDesign")}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FolderCode className="h-7 w-7 text-[#0a0a0a] dark:text-gray-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                        Web Design Services
                      </h2>
                    </div>
                  </div>

                  {expandedSections.webDesign ? (
                    <FiChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <FiChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                {expandedSections.webDesign && (
                  <div className="flex flex-col gap-6 md:flex-row">
                    <div className="flex-1 space-y-4 rounded-lg px-6 pb-6 dark:bg-secondary-dark">
                      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                        <div className="mb-4 flex items-center justify-between gap-6">
                          <div className="w-[30%]">
                            <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
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
                                { value: "Engineering", label: "Engineering" },
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
                                { value: "Real Estate", label: "Real Estate" },
                                { value: "School", label: "School" },
                                { value: "Startups", label: "Startups" },
                                { value: "Trekking", label: "Trekking" },
                              ]}
                              placeholder="Select Categories"
                              className="basic-single"
                              classNamePrefix="select"
                              isMulti={true} // Enable multi-select
                              onChange={(selected) => {
                                const categories = selected
                                  ? selected.map((option) => option.value)
                                  : [];
                                setValue("webDesignCategories", categories);
                              }}
                              styles={{
                                control: (base) => ({
                                  ...base,
                                  backgroundColor: "hsl(var(--secondary))",
                                  borderColor: "hsl(var(--border))",
                                  borderWidth: "1px",
                                  borderRadius: "0.375rem",
                                  boxShadow: "none",
                                  "&:hover": {
                                    borderColor: "hsl(var(--ring))",
                                  },
                                  "&:focus-within": {
                                    borderColor: "hsl(var(--ring))",
                                    boxShadow: "0 0 0 1px hsl(var(--ring))",
                                  },
                                  minHeight: "42px",
                                }),
                                menu: (base) => ({
                                  ...base,
                                  backgroundColor: "hsl(var(--secondary))",
                                  borderColor: "hsl(var(--border))",
                                  borderWidth: "1px",
                                  borderRadius: "0.375rem",
                                  marginTop: "2px",
                                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                                  zIndex: 9999,
                                }),
                                menuList: (base) => ({
                                  ...base,
                                  padding: 0,
                                }),
                                option: (base, { isFocused, isSelected }) => ({
                                  ...base,
                                  backgroundColor: isSelected
                                    ? "hsl(var(--accent))"
                                    : isFocused
                                      ? "hsl(var(--accent))"
                                      : "transparent",
                                  color:
                                    isSelected || isFocused
                                      ? "hsl(var(--accent-foreground))"
                                      : "hsl(var(--secondary-foreground))",
                                  borderBottom: "1px solid hsl(var(--border))",
                                  "&:last-child": {
                                    borderBottom: "none",
                                  },
                                  "&:active": {
                                    backgroundColor: "hsl(var(--accent))",
                                  },
                                }),
                                multiValue: (base) => ({
                                  ...base,
                                  backgroundColor: "hsl(var(--accent))",
                                  borderRadius: "4px",
                                }),
                                multiValueLabel: (base) => ({
                                  ...base,
                                  color: "hsl(var(--accent-foreground))",
                                }),
                                multiValueRemove: (base) => ({
                                  ...base,
                                  color: "hsl(var(--accent-foreground))",
                                  "&:hover": {
                                    backgroundColor: "hsl(var(--destructive))",
                                    color: "white",
                                  },
                                }),
                                // ... rest of your styles remain the same
                              }}
                              theme={(theme) => ({
                                ...theme,
                                colors: {
                                  ...theme.colors,
                                  primary: "hsl(var(--primary))",
                                  primary25: "hsl(var(--accent))",
                                  primary50: "hsl(var(--accent))",
                                  primary75: "hsl(var(--accent))",
                                  neutral0: "hsl(var(--secondary))",
                                  neutral5: "hsl(var(--muted))",
                                  neutral10: "hsl(var(--muted))",
                                  neutral20: "hsl(var(--border))",
                                  neutral30: "hsl(var(--border))",
                                  neutral40: "hsl(var(--muted-foreground))",
                                  neutral50: "hsl(var(--muted-foreground))",
                                  neutral60: "hsl(var(--muted-foreground))",
                                  neutral70: "hsl(var(--muted-foreground))",
                                  neutral80: "hsl(var(--secondary-foreground))",
                                  neutral90: "hsl(var(--secondary-foreground))",
                                },
                              })}
                            />
                          </div>

                          <div className="w-[30%]">
                            <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                              Tech Stack
                            </label>
                            <select
                              {...register("webDesignTechStack")}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
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
                          <div className="w-[30%]">
                            <label className="mb-1 block text-base font-medium text-gray-700 dark:text-gray-300">
                              Agreement Attachment
                            </label>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              {...register("webDesignAgreement")}
                              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-300"
                            />
                          </div>
                        </div>
                        <div className="mt-5 flex items-center justify-between gap-8">
                          <div className="w-[30%]">
                            <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                              Project Start Date
                            </label>
                            <input
                              type="date"
                              {...register("startDate")}
                              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                            />
                          </div>
                          <div className="w-[30%]">
                            <label className="block text-base font-medium text-gray-700 dark:text-gray-300">
                              Project Due Date
                            </label>
                            <input
                              type="date"
                              {...register("endDate")}
                              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-secondary-dark dark:text-gray-200"
                            />
                          </div>
                          <div className="w-[30%]">
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
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end py-6">
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BadgePlus className="h-4 w-4 text-white" />
              {isCreating ? "Creating..." : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default withRoleAuth(ClientCreatePage, ["ADMIN"]);