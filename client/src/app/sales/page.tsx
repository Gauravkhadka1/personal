// client/src/app/sales/page.tsx (simplified version)
"use client";

import React, { useState, useEffect } from "react";
import PaymentForm from "@/components/PaymentForm";
import { useAuth } from "../../context/AuthContext";
import withAuth from "../../hoc/withAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeletePaymentMutation,
  useGetClientsQuery,
  useLazyGetPaymentsQuery,
} from "@/state/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  FileText,
  Trash2,
  Pencil,
  Search,
  ArrowUpDown,
  BadgePlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import withRoleAuth from "../../hoc/withRoleAuth";
import Link from "next/link";
import SalesChart from "@/components/SalesChart";
import Image from "next/image";
import { usePaymentSocket } from "@/hooks/usePaymentSocket";
import ConfettiCelebration from "@/components/ConfettiCelebration";
import toast from "react-hot-toast";

type SortConfig = {
  key: string;
  direction: "ascending" | "descending";
};

type Payment = {
  id: number;
  client?: {
    id: number;
    domainName?: string;
    companyName?: string;
  };
  category: string;
  paymentType: string;
  amount: number;
  paidDate: string;
  receiptUrl?: string;
  paidNepaliDate?: string;
};

const NEPALI_MONTHS = [
  { month: 1, name: "Baishakh" },
  { month: 2, name: "Jestha" },
  { month: 3, name: "Ashadh" },
  { month: 4, name: "Shrawan" },
  { month: 5, name: "Bhadra" },
  { month: 6, name: "Ashwin" },
  { month: 7, name: "Kartik" },
  { month: 8, name: "Mangsir" },
  { month: 9, name: "Poush" },
  { month: 10, name: "Magh" },
  { month: 11, name: "Falgun" },
  { month: 12, name: "Chaitra" },
];

const CURRENT_NEPALI_YEAR = 2083;

const Sales = () => {
  const { user } = useAuth();
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(CURRENT_NEPALI_YEAR);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "paidDate",
    direction: "descending",
  });

  const [triggerGetPayments, { data: paymentsData, isLoading, error }] =
    useLazyGetPaymentsQuery();
  const { data: clients, isLoading: isClientsLoading } = useGetClientsQuery();
  const [deletePayment] = useDeletePaymentMutation();

  const userId = user?.userId?.toString();
  usePaymentSocket(userId);

  useEffect(() => {
    const fetchPayments = async () => {
      const params: any = {
        month: selectedMonth,
        year: selectedYear,
      };

      if (selectedCategory !== "All") {
        const categoryMap: Record<string, string> = {
          Domain: "domain",
          Hosting: "hosting",
          "Domain + Hosting": "domain_hosting",
          Microsoft: "microsoft",
          Website: "website",
          Maintenance: "maintenance",
          Seo: "seo",
          Product: "product",
          Other: "other",
        };
        const categoryValue = categoryMap[selectedCategory];
        if (categoryValue) {
          params.category = categoryValue;
        }
      }

      await triggerGetPayments(params);
    };

    fetchPayments();
  }, [selectedMonth, selectedYear, selectedCategory, triggerGetPayments]);

  const payments = paymentsData?.payments || [];
  const summary = paymentsData?.summary || {};
  const yearlySummary = paymentsData?.yearlySummary || {};

  const handleMonthChange = (monthNumber: number) => {
    setSelectedMonth(monthNumber);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const filteredPayments = React.useMemo(() => {
    if (!searchTerm) return payments;
    const term = searchTerm.toLowerCase();
    return payments.filter(
      (payment) =>
        payment.client?.domainName?.toLowerCase().includes(term) ||
        payment.client?.companyName?.toLowerCase().includes(term),
    );
  }, [payments, searchTerm]);

  // Sort payments
  const sortedPayments = React.useMemo(() => {
    const sortableItems = [...filteredPayments];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue: any, bValue: any;

        if (sortConfig.key === "client") {
          aValue = a.client?.domainName || a.client?.companyName || "";
          bValue = b.client?.domainName || b.client?.companyName || "";
        } else if (sortConfig.key === "category") {
          aValue = a.category;
          bValue = b.category;
        } else if (sortConfig.key === "paymentType") {
          aValue = a.paymentType;
          bValue = b.paymentType;
        } else if (sortConfig.key === "amount") {
          aValue = Number(a.amount);
          bValue = Number(b.amount);
        } else if (sortConfig.key === "paidDate") {
          aValue = new Date(a.paidDate).getTime();
          bValue = new Date(b.paidDate).getTime();
        } else {
          return 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredPayments, sortConfig]);

  const totalAmount = sortedPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      try {
        await deletePayment(id).unwrap();
        triggerGetPayments({ month: selectedMonth, year: selectedYear });
        toast.success("Payment deleted successfully!");
      } catch (error) {
        console.error("Failed to delete payment:", error);
        toast.error("Failed to delete payment");
      }
    }
  };

  const handleEdit = (payment: any) => {
    const paymentForEdit = {
      ...payment,
      clientId: payment.client?.id,
      client: payment.client
        ? {
            id: payment.client.id,
            domainName: payment.client.domainName,
            companyName: payment.client.companyName,
          }
        : null,
    };

    setSelectedPayment(paymentForEdit);
    setIsPaymentFormOpen(true);
  };

  const handlePaymentCreatedOrUpdated = (wasCreated?: boolean) => {
    setIsPaymentFormOpen(false);
    setSelectedPayment(null);
    triggerGetPayments({ month: selectedMonth, year: selectedYear });

    if (wasCreated === true) {
      setShowConfetti(true);
    } else if (wasCreated === false) {
      toast.success("Payment updated successfully!");
    }
  };

  const handleConfettiComplete = () => {
    setShowConfetti(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error loading payments</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <ConfettiCelebration
        trigger={showConfetti}
        onComplete={handleConfettiComplete}
        intensity="ultimate"
        duration={4000}
      />

      <div className="mt-1 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:border-secondary dark:bg-secondary">
        <div className="flex w-[60%] items-center gap-4">
          <h1 className="mr-4 text-2xl font-bold dark:text-gray-200">Sales</h1>
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:bg-secondary dark:text-gray-200"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
            >
              {NEPALI_MONTHS.map((month) => (
                <option key={month.month} value={month.month}>
                  {month.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:bg-secondary dark:text-gray-200"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {Array.from(
                { length: 3 },
                (_, i) => CURRENT_NEPALI_YEAR - 2 + i,
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex w-[40%] items-center gap-2">
          <div className="relative flex-1 rounded-md border dark:border-gray-600">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by client domain name or company name..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              setSelectedPayment(null);
              setIsPaymentFormOpen(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:text-gray-100 dark:hover:bg-blue-600"
          >
            <BadgePlus className="h-4 w-4 text-gray-100" />
            Create Payment
          </Button>
        </div>
      </div>

      <div className="mb-50 rounded-xl">
        {yearlySummary.months && yearlySummary.months.length > 0 && (
          <SalesChart
            monthlyData={yearlySummary.months}
            onMonthClick={handleMonthChange}
            onCategoryChange={handleCategoryChange}
            selectedCategory={selectedCategory}
            currentNepaliMonth={selectedMonth}
            totalYearlyAmount={yearlySummary.totalYearlyAmount || 0}
            totalYearlyAmountInWords={yearlySummary.totalYearlyAmountInWords}
          />
        )}
      </div>

      <PaymentForm
        isOpen={isPaymentFormOpen}
        onClose={() => {
          setIsPaymentFormOpen(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onPaymentUpdated={handlePaymentCreatedOrUpdated}
        mode={selectedPayment ? "edit" : "create"}
      />

      <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 dark:border-secondary dark:bg-secondary">
        <Table>
          <TableHeader className="bg-gray-200 dark:bg-secondary">
            <TableRow className="dark:border-b dark:border-gray-700">
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => requestSort("client")}
                  className="pl-3"
                >
                  <span className="font-bold dark:text-gray-300">Client</span>
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => requestSort("category")}
                  className="p-0"
                >
                  <span className="font-bold dark:text-gray-300">Category</span>
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => requestSort("paymentType")}
                  className="p-0"
                >
                  <span className="font-bold dark:text-gray-300">
                    Payment Type
                  </span>
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => requestSort("amount")}
                  className="p-0"
                >
                  <span className="font-bold dark:text-gray-300">Amount</span>
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => requestSort("paidDate")}
                  className="p-0"
                >
                  <span className="font-bold dark:text-gray-300">
                    Paid Date
                  </span>
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <span className="font-bold dark:text-gray-300">Receipt</span>
              </TableHead>
              <TableHead>
                <span className="font-bold dark:text-gray-300">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-gray-700 dark:text-gray-300">
            {sortedPayments.length > 0 ? (
              sortedPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Link
                      href={`/clients/${payment.client?.id}`}
                      className="pl-3 hover:underline"
                    >
                      {payment.client?.domainName ||
                        payment.client?.companyName ||
                        "N/A"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {payment.category === "domain" ? (
                      <span className="font-medium">Domain</span>
                    ) : payment.category === "hosting" ? (
                      <span className="font-medium">Hosting</span>
                    ) : (
                      payment.category
                        .split("_")
                        .map(
                          (word: string) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")
                    )}
                  </TableCell>
                  <TableCell>{payment.paymentType}</TableCell>
                  <TableCell>
                    <span className="font-bold text-green-600">
                      {payment.amount.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.paidDate), "MMM d, yyyy")}{" "}
                    <span className="text-xs italic">
                      ({payment.paidNepaliDate})
                    </span>
                  </TableCell>
                  <TableCell>
                    {payment.receiptUrl
                      ? (() => {
                          const receiptUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${payment.receiptUrl}`;
                          const isPdf = payment.receiptUrl
                            ?.toLowerCase()
                            .endsWith(".pdf");

                          if (isPdf) {
                            return (
                              <a
                                href={receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                              >
                                <FileText className="h-4 w-4" />
                                View PDF
                              </a>
                            );
                          }

                          return (
                            <a
                              href={receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <div className="relative h-12 w-12 overflow-hidden rounded border border-gray-200 transition-opacity hover:opacity-80">
                                <Image
                                  src={receiptUrl}
                                  alt="Receipt preview"
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </div>
                            </a>
                          );
                        })()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(payment)}
                    >
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(payment.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-4 text-center">
                  No payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter className="bg-gray-100 dark:bg-secondary">
            <TableRow className="dark:border-t dark:border-gray-700">
              <TableCell
                colSpan={3}
                className="text-right font-bold dark:text-gray-300"
              >
                {selectedCategory === "All"
                  ? "Total"
                  : `${selectedCategory} Total`}
                :
              </TableCell>
              <TableCell className="font-bold text-green-600">
                {totalAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell colSpan={3}></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
};

export default withRoleAuth(Sales, ["ADMIN"]);
