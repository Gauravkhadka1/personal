// client/src/components/PaymentForm/index.tsx
import {
  useGetClientsQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
} from "@/state/api";
import Modal from "@/components/Modal";
import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Select from "react-select";
import { FileUploader } from "react-drag-drop-files";
import { FileIcon, defaultStyles } from "react-file-icon";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  payment?: any;
  onPaymentUpdated?: (wasCreated?: boolean) => void;
  mode: 'create' | 'edit';
};

const paymentCategories = [
  { value: "website", label: "Website/ APP" },
  { value: "microsoft", label: "Microsoft" },
  { value: "domain", label: "Domain" },
  { value: "hosting", label: "Hosting" },
  { value: "domain_hosting", label: "Domain + Hosting" },
  { value: "maintenance", label: "Maintenance" },
  { value: "seo", label: "SEO" },
  { value: "product", label: "Product" },
  { value: "other", label: "Other" },
];

const PaymentForm = ({ isOpen, onClose, payment, onPaymentUpdated, mode }: Props) => {
  const { user } = useAuth();
  const [createPayment, { isLoading: isCreating }] = useCreatePaymentMutation();
  const [updatePayment, { isLoading: isUpdating }] = useUpdatePaymentMutation();
  const { data: clients, isLoading: isClientsLoading } = useGetClientsQuery();

  const [clientId, setClientId] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [domainAmount, setDomainAmount] = useState("");
  const [hostingAmount, setHostingAmount] = useState("");
  const [paidDate, setPaidDate] = useState<Date | null>(new Date());
  const [files, setFiles] = useState<File[]>([]);
  const [existingReceiptUrl, setExistingReceiptUrl] = useState<string | null>(null);

  const fileTypes = ["JPG", "JPEG", "PNG", "PDF"];
  const fileUploaderStyles = {
    width: "100%",
    height: "100px",
    border: "2px dashed hsl(var(--border))",
    borderRadius: "0.375rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    marginBottom: "1rem",
  };

  useEffect(() => {
    if (mode === 'edit' && payment) {
      setClientId(payment.clientId?.toString() || "");
      setPaymentType(payment.paymentType || "");
      setCategory(payment.category || "");
      setAmount(payment.amount?.toString() || "");
      setPaidDate(payment.paidDate ? new Date(payment.paidDate) : new Date());
      setExistingReceiptUrl(payment.receiptUrl || null);
    } else {
      // Reset form for create mode
      setClientId("");
      setPaymentType("");
      setCategory("");
      setAmount("");
      setDomainAmount("");
      setHostingAmount("");
      setPaidDate(new Date());
      setFiles([]);
      setExistingReceiptUrl(null);
    }
  }, [payment, mode]);

  const handleFileChange = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    setFiles((prevFiles) => [...prevFiles, ...fileArray]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleRemoveExistingReceipt = () => {
    setExistingReceiptUrl(null);
  };

  const clientOptions = clients
    ?.map((client) => ({
      value: client.id.toString(),
      label: client.domainName || client.companyName || "Unnamed Client",
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId || !paymentType || !category || !paidDate) {
      toast.error("All fields are required");
      return;
    }

    // Handle Domain + Hosting - create two separate payments
    if (category === "domain_hosting") {
      if (!domainAmount || !hostingAmount) {
        toast.error("Both domain amount and hosting amount are required");
        return;
      }
      
      const domainAmt = parseFloat(domainAmount);
      const hostingAmt = parseFloat(hostingAmount);
      
      if (isNaN(domainAmt) || isNaN(hostingAmt)) {
        toast.error("Invalid domain or hosting amount");
        return;
      }

      // Create first payment for Domain
      const domainFormData = new FormData();
      domainFormData.append("clientId", clientId);
      domainFormData.append("paymentType", `${paymentType} (Domain)`);
      domainFormData.append("category", "domain");
      domainFormData.append("amount", domainAmt.toString());
      domainFormData.append("paidDate", paidDate.toISOString());
      
      // Create second payment for Hosting
      const hostingFormData = new FormData();
      hostingFormData.append("clientId", clientId);
      hostingFormData.append("paymentType", `${paymentType} (Hosting)`);
      hostingFormData.append("category", "hosting");
      hostingFormData.append("amount", hostingAmt.toString());
      hostingFormData.append("paidDate", paidDate.toISOString());
      
      // Add files to both payments (same receipt for both)
      if (files.length > 0) {
        files.forEach((file) => {
          domainFormData.append("receipt", file);
          hostingFormData.append("receipt", file);
        });
      }

      try {
        await Promise.all([
          createPayment(domainFormData).unwrap(),
          createPayment(hostingFormData).unwrap()
        ]);
        toast.success("Domain and Hosting payments created successfully!");
        
        if (onPaymentUpdated) {
          onPaymentUpdated(true);
        }
        onClose();
      } catch (error) {
        toast.error("Failed to create domain and hosting payments");
      }
      return;
    }

    // Regular payment (single)
    if (!amount) {
      toast.error("Amount is required");
      return;
    }

    const formData = new FormData();
    formData.append("clientId", clientId);
    formData.append("paymentType", paymentType);
    formData.append("category", category);
    formData.append("amount", amount);
    formData.append("paidDate", paidDate.toISOString());
    
    if (files.length > 0) {
      files.forEach((file) => {
        formData.append("receipt", file);
      });
    }

    try {
      if (mode === 'edit' && payment) {
        if (existingReceiptUrl === null && payment.receiptUrl) {
          formData.append("removeReceipt", "true");
        }
        
        await updatePayment({
          id: payment.id,
          formData
        }).unwrap();
        toast.success("Payment updated successfully!");
        
        if (onPaymentUpdated) {
          onPaymentUpdated(false);
        }
      } else {
        await createPayment(formData).unwrap();
        toast.success("Payment created successfully!");
        
        if (onPaymentUpdated) {
          onPaymentUpdated(true);
        }
      }
      
      onClose();
      
      if (mode === 'create') {
        setClientId("");
        setPaymentType("");
        setCategory("");
        setAmount("");
        setDomainAmount("");
        setHostingAmount("");
        setPaidDate(new Date());
        setFiles([]);
      } else {
        setFiles([]);
      }
    } catch (error) {
      toast.error(`Failed to ${mode} payment`);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      name={mode === 'create' ? "Create New Payment" : "Edit Payment"}
    >
      <form
        className="mt-4 space-y-6 rounded-md bg-white pt-2 text-gray-900 dark:bg-secondary-dark dark:text-gray-100"
        onSubmit={handleSubmit}
      >
        <div className="text-gray-900 dark:text-gray-100">
          <Select
            options={clientOptions}
            value={clientOptions?.find((option) => option.value === clientId) || null}
            onChange={(selectedOption) => setClientId(selectedOption?.value || "")}
            placeholder="Select Client"
            isSearchable
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={isClientsLoading}
            noOptionsMessage={() => "No clients found"}
            required
          />
        </div>

        <div className="text-gray-900 dark:text-gray-100">
          <Select
            options={paymentCategories}
            value={paymentCategories.find((c) => c.value === category) || null}
            onChange={(selectedOption) => setCategory(selectedOption?.value || "")}
            placeholder="Select Category"
            isSearchable
            className="react-select-container"
            classNamePrefix="react-select"
            required
          />
        </div>

        <input
          type="text"
          className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-secondary-dark dark:text-gray-100 dark:focus:ring-blue-400"
          placeholder="Payment Type (e.g., Invoice #123)"
          value={paymentType}
          onChange={(e) => setPaymentType(e.target.value)}
          required
        />

        {/* Conditional amount inputs based on category */}
        {category === "domain_hosting" ? (
          <div className="space-y-3">
            <input
              type="number"
              step="0.01"
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-secondary-dark dark:text-gray-100 dark:focus:ring-blue-400"
              placeholder="Domain Amount"
              value={domainAmount}
              onChange={(e) => setDomainAmount(e.target.value)}
              required
            />
            <input
              type="number"
              step="0.01"
              className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-secondary-dark dark:text-gray-100 dark:focus:ring-blue-400"
              placeholder="Hosting Amount"
              value={hostingAmount}
              onChange={(e) => setHostingAmount(e.target.value)}
              required
            />
            {domainAmount && hostingAmount && (
              <div className="text-sm text-muted-foreground">
                Total: {(parseFloat(domainAmount) + parseFloat(hostingAmount)).toFixed(2)}
              </div>
            )}
          </div>
        ) : (
          <input
            type="number"
            step="0.01"
            className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-secondary-dark dark:text-gray-100 dark:focus:ring-blue-400"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required={category !== "domain_hosting"}
          />
        )}

        <DatePicker
          selected={paidDate}
          onChange={(date) => setPaidDate(date)}
          dateFormat="yyyy-MM-dd"
          className="w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-secondary-dark dark:text-gray-100 dark:focus:ring-blue-400"
          placeholderText="Paid Date"
          required
        />

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            Receipt Attachment
          </label>
          
          {mode === 'edit' && existingReceiptUrl && (
            <div className="mb-4">
              <div className="flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8">
                    <FileIcon
                      extension={existingReceiptUrl.split('.').pop()}
                      {...defaultStyles[existingReceiptUrl.split('.').pop() as keyof typeof defaultStyles]}
                    />
                  </div>
                  <span className="truncate">{existingReceiptUrl.split('/').pop()}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveExistingReceipt}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Current receipt - upload new file to replace
              </p>
            </div>
          )}

          <FileUploader
            multiple={true} 
            handleChange={handleFileChange}
            name="file"
            types={fileTypes}
            children={
              <div style={fileUploaderStyles}>
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Drag & drop receipt here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPG, JPEG, PNG, PDF
                  </p>
                </div>
              </div>
            }
          />

          {files.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium">
                {mode === 'create' ? 'Files to Upload:' : 'New Receipt:'}
              </h4>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                {files.map((file, index) => (
                  <div key={index} className="relative flex items-center gap-2 rounded-md border p-2">
                    <div className="h-8 w-8">
                      <FileIcon
                        extension={file.name.split(".").pop()}
                        {...defaultStyles[
                          file.name.split(".").pop() as keyof typeof defaultStyles
                        ]}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:text-gray-100 dark:hover:bg-blue-600 dark:focus:ring-blue-400 ${
            isCreating || isUpdating ? "cursor-not-allowed opacity-50" : ""
          }`}
          disabled={isCreating || isUpdating}
        >
          {isCreating || isUpdating ? "Processing..." : mode === 'create' ? "Create Payment" : "Update Payment"}
        </button>
      </form>
    </Modal>
  );
};

export default PaymentForm;