"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  Filter,
  X,
} from "lucide-react";
import FinanceCard from "@/components/FinanceCard";
import NepaliDateFilter from "@/components/NepaliDateFilter";
import ExpenseCategoryCard from "@/components/ExpenseCategoryCard";
import {
  useGetUsersQuery,
  useGetFinancialSummaryQuery,
  useCreateEarnedIncomeMutation,
  useUpdateEarnedIncomeMutation,
  useDeleteEarnedIncomeMutation,
  useCreatePassiveIncomeMutation,
  useUpdatePassiveIncomeMutation,
  useDeletePassiveIncomeMutation,
  useGetExpenseCategoriesQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
  useGetAssetsQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useCreateLiabilityMutation,
  useUpdateLiabilityMutation,
  useDeleteLiabilityMutation,
  useGetExpenseCategorySummaryQuery,
  useGetDailyExpensesQuery,
  useCreateDailyExpenseMutation,
  useUpdateDailyExpenseMutation,
  useDeleteDailyExpenseMutation,
} from "@/state/api";
import { useAuth } from "../../context/AuthContext";
import withRoleAuth from "../../hoc/withRoleAuth";
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

// Modal Components
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<{
    nepaliYear?: number;
    nepaliMonth?: number;
    startDate?: string;
    endDate?: string;
  }>({});

  // Category filter state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
    type: "income" | "passiveIncome" | "expense" | "asset" | "liability" | "dailyExpense";
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal states
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [isEditIncomeModalOpen, setIsEditIncomeModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isEditAssetModalOpen, setIsEditAssetModalOpen] = useState(false);
  const [isAddLiabilityModalOpen, setIsAddLiabilityModalOpen] = useState(false);
  const [isEditLiabilityModalOpen, setIsEditLiabilityModalOpen] = useState(false);
  const [isAddDailyExpenseModalOpen, setIsAddDailyExpenseModalOpen] = useState(false);
  const [isEditDailyExpenseModalOpen, setIsEditDailyExpenseModalOpen] = useState(false);

  // Income Edit states (both earned and passive)
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [editingIncomeType, setEditingIncomeType] = useState<"earned" | "passive">("earned");
  const [editIncomeForm, setEditIncomeForm] = useState({
    name: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
  });

  // Add Income state
  const [addIncomeForm, setAddIncomeForm] = useState({
    name: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
  });

  // Asset Edit states
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editAssetForm, setEditAssetForm] = useState({
    name: "",
    value: 0,
    date: new Date().toISOString().split("T")[0],
  });

  // Add Asset state
  const [addAssetForm, setAddAssetForm] = useState({
    name: "",
    value: 0,
    date: new Date().toISOString().split("T")[0],
  });

  // Liability Edit states
  const [editingLiabilityId, setEditingLiabilityId] = useState<string | null>(null);
  const [editLiabilityForm, setEditLiabilityForm] = useState({
    name: "",
    value: 0,
    date: new Date().toISOString().split("T")[0],
  });

  // Add Liability state
  const [addLiabilityForm, setAddLiabilityForm] = useState({
    name: "",
    value: 0,
    date: new Date().toISOString().split("T")[0],
  });

  // Expense Category Edit states
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseForm, setEditExpenseForm] = useState({
    name: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
  });

  // Add Expense Category state
  const [addExpenseForm, setAddExpenseForm] = useState({
    name: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
  });

  // Daily Expenses states
  const [editingDailyExpenseId, setEditingDailyExpenseId] = useState<string | null>(null);
  const [dailyExpenseForm, setDailyExpenseForm] = useState({
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    expenseCategoryId: "",
  });

  const {
    data: financialData,
    isLoading,
    error,
    refetch,
  } = useGetFinancialSummaryQuery(filter);

  const { data: expenseCategoriesData, refetch: refetchExpenseCategories } =
    useGetExpenseCategoriesQuery(filter);

  // Daily Expenses query with category filter
  const dailyExpensesFilter = {
    ...filter,
    ...(selectedCategoryFilter && { expenseCategoryId: selectedCategoryFilter }),
  };
  
  const {
    data: dailyExpensesData,
    isLoading: dailyExpensesLoading,
    refetch: refetchDailyExpenses,
  } = useGetDailyExpensesQuery(dailyExpensesFilter);

  const [createEarnedIncome] = useCreateEarnedIncomeMutation();
  const [updateEarnedIncome] = useUpdateEarnedIncomeMutation();
  const [deleteEarnedIncome] = useDeleteEarnedIncomeMutation();

  const [createPassiveIncome] = useCreatePassiveIncomeMutation();
  const [updatePassiveIncome] = useUpdatePassiveIncomeMutation();
  const [deletePassiveIncome] = useDeletePassiveIncomeMutation();

  const [createExpenseCategory] = useCreateExpenseCategoryMutation();
  const [updateExpenseCategory] = useUpdateExpenseCategoryMutation();
  const [deleteExpenseCategory] = useDeleteExpenseCategoryMutation();

  const [createAsset] = useCreateAssetMutation();
  const [updateAsset] = useUpdateAssetMutation();
  const [deleteAsset] = useDeleteAssetMutation();

  const [createLiability] = useCreateLiabilityMutation();
  const [updateLiability] = useUpdateLiabilityMutation();
  const [deleteLiability] = useDeleteLiabilityMutation();

  const [createDailyExpense] = useCreateDailyExpenseMutation();
  const [updateDailyExpense] = useUpdateDailyExpenseMutation();
  const [deleteDailyExpense] = useDeleteDailyExpenseMutation();

  const earnedIncomes =
    financialData?.data?.details?.earnedIncomes.map((income: any) => ({
      id: income.id,
      name: income.name,
      amount: income.amount,
      date: income.date,
    })) || [];

  const passiveIncomes =
    financialData?.data?.details?.passiveIncomes.map((income: any) => ({
      id: income.id,
      name: income.name,
      amount: income.amount,
      date: income.date,
    })) || [];

  const assets =
    financialData?.data?.details?.assets.map((asset: any) => ({
      id: asset.id,
      name: asset.name,
      value: asset.value,
      date: asset.date,
    })) || [];

  const liabilities =
    financialData?.data?.details?.liabilities.map((liab: any) => ({
      id: liab.id,
      name: liab.name,
      value: liab.value,
      date: liab.date,
    })) || [];

  const allIncomes = [...earnedIncomes, ...passiveIncomes].map((income) => ({
    id: income.id,
    name: income.name,
    amount: income.amount,
    date: income.date,
  }));

  const totalIncome = financialData?.data?.summary?.totalIncome || 0;
  const totalExpenses = financialData?.data?.summary?.totalExpenses || 0;
  const totalLiabilities = financialData?.data?.summary?.totalLiabilities || 0;
  const totalAssets = financialData?.data?.summary?.totalAssets || 0;

  // Daily Expenses handlers
  const handleDailyExpenseSubmit = async () => {
    if (
      !dailyExpenseForm.description ||
      !dailyExpenseForm.amount ||
      !dailyExpenseForm.date ||
      !dailyExpenseForm.expenseCategoryId
    )
      return;

    try {
      if (editingDailyExpenseId) {
        await updateDailyExpense({
          id: editingDailyExpenseId,
          ...dailyExpenseForm,
        }).unwrap();
        setEditingDailyExpenseId(null);
        setIsEditDailyExpenseModalOpen(false);
      } else {
        await createDailyExpense(dailyExpenseForm).unwrap();
        setIsAddDailyExpenseModalOpen(false);
      }
      resetDailyExpenseForm();
      refetchDailyExpenses();
      refetch();
      refetchExpenseCategories();
    } catch (err) {
      console.error("Failed to save daily expense:", err);
    }
  };

  const handleEditDailyExpense = (expense: any) => {
    setEditingDailyExpenseId(expense.id);
    setDailyExpenseForm({
      description: expense.description,
      amount: expense.amount,
      date: expense.date ? expense.date.split("T")[0] : new Date().toISOString().split("T")[0],
      expenseCategoryId: expense.expenseCategoryId,
    });
    setIsEditDailyExpenseModalOpen(true);
  };

  const resetDailyExpenseForm = () => {
    setDailyExpenseForm({
      description: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      expenseCategoryId: "",
    });
  };

  const handleDeleteClick = (
    id: string,
    name: string,
    type: "income" | "passiveIncome" | "expense" | "asset" | "liability" | "dailyExpense",
  ) => {
    setItemToDelete({ id, name, type });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      switch (itemToDelete.type) {
        case "income":
          await deleteEarnedIncome(itemToDelete.id).unwrap();
          break;
        case "passiveIncome":
          await deletePassiveIncome(itemToDelete.id).unwrap();
          break;
        case "expense":
          await deleteExpenseCategory(itemToDelete.id).unwrap();
          refetchExpenseCategories();
          break;
        case "asset":
          await deleteAsset(itemToDelete.id).unwrap();
          break;
        case "liability":
          await deleteLiability(itemToDelete.id).unwrap();
          break;
        case "dailyExpense":
          await deleteDailyExpense(itemToDelete.id).unwrap();
          refetchDailyExpenses();
          refetchExpenseCategories();
          break;
      }
      refetch();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error(`Failed to delete ${itemToDelete.type}:`, err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddIncome = async () => {
    if (!addIncomeForm.name.trim()) return;
    
    try {
      await createEarnedIncome({
        name: addIncomeForm.name,
        amount: addIncomeForm.amount,
        date: addIncomeForm.date,
      }).unwrap();
      refetch();
      setIsAddIncomeModalOpen(false);
      setAddIncomeForm({ name: "", amount: 0, date: new Date().toISOString().split("T")[0] });
    } catch (err) {
      console.error("Failed to add income:", err);
    }
  };

  const handleUpdateIncome = async () => {
    if (!editIncomeForm.name.trim() || editingIncomeId === null) return;
    
    try {
      if (editingIncomeType === "earned") {
        await updateEarnedIncome({
          id: editingIncomeId,
          name: editIncomeForm.name,
          amount: editIncomeForm.amount,
          date: editIncomeForm.date,
        }).unwrap();
      } else {
        await updatePassiveIncome({
          id: editingIncomeId,
          name: editIncomeForm.name,
          amount: editIncomeForm.amount,
          date: editIncomeForm.date,
        }).unwrap();
      }
      refetch();
      setEditingIncomeId(null);
      setIsEditIncomeModalOpen(false);
      setEditIncomeForm({ name: "", amount: 0, date: new Date().toISOString().split("T")[0] });
    } catch (err) {
      console.error("Failed to update income:", err);
    }
  };

  const handleAddPassiveIncome = async () => {
    if (!addIncomeForm.name.trim()) return;
    
    try {
      await createPassiveIncome({
        name: addIncomeForm.name,
        amount: addIncomeForm.amount,
        date: addIncomeForm.date,
      }).unwrap();
      refetch();
      setIsAddIncomeModalOpen(false);
      setAddIncomeForm({ name: "", amount: 0, date: new Date().toISOString().split("T")[0] });
    } catch (err) {
      console.error("Failed to add passive income:", err);
    }
  };

  const handleAddExpense = async () => {
    if (!addExpenseForm.name.trim()) return;
    
    try {
      await createExpenseCategory({
        name: addExpenseForm.name,
        amount: addExpenseForm.amount,
        date: addExpenseForm.date,
      }).unwrap();
      refetch();
      refetchExpenseCategories();
      setIsAddExpenseModalOpen(false);
      setAddExpenseForm({ name: "", amount: 0, date: new Date().toISOString().split("T")[0] });
    } catch (err) {
      console.error("Failed to add expense category:", err);
    }
  };

  const handleUpdateExpense = async () => {
    if (!editExpenseForm.name.trim() || editingExpenseId === null) return;
    
    try {
      await updateExpenseCategory({
        id: editingExpenseId,
        name: editExpenseForm.name,
        amount: editExpenseForm.amount,
        date: editExpenseForm.date,
      }).unwrap();
      refetch();
      refetchExpenseCategories();
      setEditingExpenseId(null);
      setIsEditExpenseModalOpen(false);
      setEditExpenseForm({ name: "", amount: 0, date: new Date().toISOString().split("T")[0] });
    } catch (err) {
      console.error("Failed to update expense category:", err);
    }
  };

  const handleAddAsset = async () => {
    if (!addAssetForm.name.trim()) return;
    
    try {
      await createAsset({
        name: addAssetForm.name,
        value: addAssetForm.value,
        date: addAssetForm.date,
      }).unwrap();
      refetch();
      setIsAddAssetModalOpen(false);
      setAddAssetForm({ name: "", value: 0, date: new Date().toISOString().split("T")[0] });
    } catch (err) {
      console.error("Failed to add asset:", err);
    }
  };

  const handleUpdateAsset = async () => {
    if (!editAssetForm.name.trim() || editingAssetId === null) return;
    
    try {
      await updateAsset({
        id: editingAssetId,
        name: editAssetForm.name,
        value: editAssetForm.value,
        date: editAssetForm.date,
      }).unwrap();
      refetch();
      setEditingAssetId(null);
      setIsEditAssetModalOpen(false);
      setEditAssetForm({ name: "", value: 0, date: new Date().toISOString().split("T")[0] });
    } catch (err) {
      console.error("Failed to update asset:", err);
    }
  };

  const handleAddLiability = async () => {
    if (!addLiabilityForm.name.trim()) return;
    
    try {
      await createLiability({
        name: addLiabilityForm.name,
        value: addLiabilityForm.value,
        date: addLiabilityForm.date,
      }).unwrap();
      refetch();
      setIsAddLiabilityModalOpen(false);
      setAddLiabilityForm({ name: "", value: 0, date: new Date().toISOString().split("T")[0] });
    } catch (err) {
      console.error("Failed to add liability:", err);
    }
  };

  const handleUpdateLiability = async () => {
    if (!editLiabilityForm.name.trim() || editingLiabilityId === null) return;
    
    try {
      await updateLiability({
        id: editingLiabilityId,
        name: editLiabilityForm.name,
        value: editLiabilityForm.value,
        date: editLiabilityForm.date,
      }).unwrap();
      refetch();
      setEditingLiabilityId(null);
      setIsEditLiabilityModalOpen(false);
      setEditLiabilityForm({ name: "", value: 0, date: new Date().toISOString().split("T")[0] });
    } catch (err) {
      console.error("Failed to update liability:", err);
    }
  };

  const handleEditExpense = (category: {
    id: string;
    name: string;
    amount: number;
    date?: string;
  }) => {
    setEditingExpenseId(category.id);
    setEditExpenseForm({
      name: category.name,
      amount: category.amount,
      date: category.date ? category.date.split("T")[0] : new Date().toISOString().split("T")[0],
    });
    setIsEditExpenseModalOpen(true);
  };

  const handleClearCategoryFilter = () => {
    setSelectedCategoryFilter(null);
    setShowCategoryFilter(false);
  };

  // Income edit handlers
  const handleEditIncome = (item: any, type: "earned" | "passive") => {
    setEditingIncomeId(item.id);
    setEditingIncomeType(type);
    setEditIncomeForm({
      name: item.name,
      amount: item.amount,
      date: item.date ? item.date.split("T")[0] : new Date().toISOString().split("T")[0],
    });
    setIsEditIncomeModalOpen(true);
  };

  // Asset edit handlers
  const handleEditAsset = (item: any) => {
    setEditingAssetId(item.id);
    setEditAssetForm({
      name: item.name,
      value: item.value,
      date: item.date ? item.date.split("T")[0] : new Date().toISOString().split("T")[0],
    });
    setIsEditAssetModalOpen(true);
  };

  // Liability edit handlers
  const handleEditLiability = (item: any) => {
    setEditingLiabilityId(item.id);
    setEditLiabilityForm({
      name: item.name,
      value: item.value,
      date: item.date ? item.date.split("T")[0] : new Date().toISOString().split("T")[0],
    });
    setIsEditLiabilityModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="mb-2 text-red-600">Error loading dashboard</p>
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getCategoryName = (type: string) => {
    switch (type) {
      case "income":
        return "Income";
      case "passiveIncome":
        return "Passive Income";
      case "expense":
        return "Expense Category";
      case "asset":
        return "Asset";
      case "liability":
        return "Liability";
      case "dailyExpense":
        return "Daily Expense";
      default:
        return "Item";
    }
  };

  const expenseCategories = expenseCategoriesData?.data || [];
  const totalExpenseCategories = expenseCategories.reduce(
    (sum, cat) => sum + cat.budget,
    0,
  );
  const totalSpent = expenseCategories.reduce((sum, cat) => sum + cat.spent, 0);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-800">
              Financial Dashboard
            </h1>
            <p className="text-gray-600">
              Track your income, expense categories, assets, liabilities, and
              daily expenses
            </p>
          </div>
          <NepaliDateFilter onFilterChange={setFilter} initialFilter={filter} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-green-100 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Total Income</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ${totalIncome.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-red-100 p-3">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            ${totalExpenses.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-blue-100 p-3">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Net Cash Flow</span>
          </div>
          <p
            className={`text-2xl font-bold ${
              totalIncome - totalExpenses >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            ${(totalIncome - totalExpenses).toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-lg bg-purple-100 p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Net Worth</span>
          </div>
          <p
            className={`text-2xl font-bold ${
              financialData?.data?.summary?.netWorth &&
              financialData.data.summary.netWorth >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            ${financialData?.data?.summary?.netWorth?.toLocaleString() || "0"}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FinanceCard
          title="Income"
          type="income"
          items={allIncomes}
          total={totalIncome}
          onAdd={() => setIsAddIncomeModalOpen(true)}
          onUpdate={handleUpdateIncome}
          onDelete={(id, name) => handleDeleteClick(id, name, "income")}
          onEdit={(item) => handleEditIncome(item, "earned")}
          editingId={editingIncomeId}
          editForm={editIncomeForm}
          onEditFormChange={setEditIncomeForm}
          onSaveEdit={handleUpdateIncome}
          onCancelEdit={() => {
            setEditingIncomeId(null);
            setIsEditIncomeModalOpen(false);
          }}
          icon={TrendingUp}
          color="text-green-600"
          bgColor="bg-white"
        />

        {/* Expense Categories with ExpenseCategoryCard */}
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Expense Categories
                </h2>
              </div>
              <button
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-white transition-colors hover:bg-blue-600"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add</span>
              </button>
            </div>
          </div>

          <div className="max-h-[600px] overflow-y-auto p-6">
            <div className="space-y-2">
              {expenseCategories.map((category) => (
                <ExpenseCategoryCard
                  key={category.id}
                  category={category}
                  onEdit={handleEditExpense}
                  onDelete={(id, name) =>
                    handleDeleteClick(id, name, "expense")
                  }
                />
              ))}

              {expenseCategories.length === 0 && (
                <div className="py-12 text-center text-gray-500">
                  No expense categories found. Click "Add" to get started.
                </div>
              )}
            </div>

            {expenseCategories.length > 0 && (
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <p className="text-sm text-gray-500">Total Budget</p>
                    <p className="text-xl font-bold text-gray-800">
                      ${totalExpenseCategories.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <p className="text-sm text-gray-500">Total Spent</p>
                    <p className="text-xl font-bold text-red-600">
                      ${totalSpent.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <FinanceCard
          title="Assets"
          type="asset"
          items={assets.map((asset) => ({
            id: asset.id,
            name: asset.name,
            value: asset.value,
            date: asset.date,
          }))}
          total={totalAssets}
          onAdd={() => setIsAddAssetModalOpen(true)}
          onUpdate={handleUpdateAsset}
          onDelete={(id, name) => handleDeleteClick(id, name, "asset")}
          onEdit={handleEditAsset}
          editingId={editingAssetId}
          editForm={editAssetForm}
          onEditFormChange={setEditAssetForm}
          onSaveEdit={handleUpdateAsset}
          onCancelEdit={() => {
            setEditingAssetId(null);
            setIsEditAssetModalOpen(false);
          }}
          icon={Wallet}
          color="text-blue-600"
          bgColor="bg-white"
        />

        <FinanceCard
          title="Liabilities"
          type="liability"
          items={liabilities.map((liab) => ({
            id: liab.id,
            name: liab.name,
            value: liab.value,
            date: liab.date,
          }))}
          total={totalLiabilities}
          onAdd={() => setIsAddLiabilityModalOpen(true)}
          onUpdate={handleUpdateLiability}
          onDelete={(id, name) => handleDeleteClick(id, name, "liability")}
          onEdit={handleEditLiability}
          editingId={editingLiabilityId}
          editForm={editLiabilityForm}
          onEditFormChange={setEditLiabilityForm}
          onSaveEdit={handleUpdateLiability}
          onCancelEdit={() => {
            setEditingLiabilityId(null);
            setIsEditLiabilityModalOpen(false);
          }}
          icon={AlertTriangle}
          color="text-orange-600"
          bgColor="bg-white"
        />
      </div>

      {/* Daily Expenses Section with Grouping by Nepali Date and Category Filter */}
      <div className="mt-8">
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Daily Expenses
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Category Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
                    selectedCategoryFilter
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span className="text-sm">
                    {selectedCategoryFilter ? "Filtered" : "Filter"}
                  </span>
                  {selectedCategoryFilter && (
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-gray-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearCategoryFilter();
                      }}
                    />
                  )}
                </button>
                
                {/* Filter Dropdown */}
                {showCategoryFilter && (
                  <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-200 px-4 py-2">
                      <h3 className="font-medium text-gray-800">Filter by Category</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2">
                      <button
                        onClick={() => {
                          setSelectedCategoryFilter(null);
                          setShowCategoryFilter(false);
                        }}
                        className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        All Categories
                      </button>
                      {expenseCategoriesData?.data?.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategoryFilter(category.id);
                            setShowCategoryFilter(false);
                          }}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100 ${
                            selectedCategoryFilter === category.id
                              ? "bg-blue-50 text-blue-600"
                              : ""
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  setEditingDailyExpenseId(null);
                  resetDailyExpenseForm();
                  setIsAddDailyExpenseModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Daily Expenses List - Grouped by Nepali Date */}
            {dailyExpensesLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-6">
                {dailyExpensesData?.groupedByNepaliDate &&
                dailyExpensesData.groupedByNepaliDate.length > 0 ? (
                  dailyExpensesData.groupedByNepaliDate.map((group) => (
                    <div key={group.englishDate} className="overflow-hidden rounded-lg border border-gray-200">
                      {/* Date Header with Nepali Date */}
                      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 px-4">
                        <div className="flex items-center gap-4">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {group.nepaliDate}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(group.englishDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <p className="text-sm text-gray-500">Total for day</p>
                          <p className="text-xl font-bold text-red-600">
                            ${group.totalAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Expenses List for this date */}
                      <div className="divide-y divide-gray-100">
                        {group.expenses.map((expense) => (
                          <div
                            key={expense.id}
                            className="flex items-center justify-between p-4 transition-colors hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-4">
                              <div className="rounded-lg bg-red-100 p-2">
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-800">
                                  {expense.description}
                                </p>
                                <div className="mt-1 flex items-center gap-3">
                                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                    {expense.expenseCategory?.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="text-lg font-semibold text-red-600">
                                ${expense.amount.toLocaleString()}
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditDailyExpense(expense)}
                                  className="rounded-lg p-2 hover:bg-gray-200"
                                >
                                  <Pencil className="h-4 w-4 text-blue-500" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteClick(
                                      expense.id,
                                      expense.description,
                                      "dailyExpense",
                                    )
                                  }
                                  className="rounded-lg p-2 hover:bg-gray-200"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    {selectedCategoryFilter 
                      ? "No expenses found for the selected category in this period."
                      : "No daily expenses found for this period. Click 'Add Expense' to get started."}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => {
            refetch();
            refetchExpenseCategories();
            refetchDailyExpenses();
          }}
          className="rounded-full bg-blue-500 p-3 text-white shadow-lg transition-colors hover:bg-blue-600"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Add Income Modal */}
      <Modal isOpen={isAddIncomeModalOpen} onClose={() => setIsAddIncomeModalOpen(false)} title="Add Income">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              placeholder="e.g., Salary, Freelance"
              value={addIncomeForm.name}
              onChange={(e) => setAddIncomeForm({ ...addIncomeForm, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              placeholder="0.00"
              value={addIncomeForm.amount}
              onChange={(e) => setAddIncomeForm({ ...addIncomeForm, amount: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="date"
                value={addIncomeForm.date}
                onChange={(e) => setAddIncomeForm({ ...addIncomeForm, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddIncome}
              className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsAddIncomeModalOpen(false)}
              className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Income Modal */}
      <Modal isOpen={isEditIncomeModalOpen} onClose={() => setIsEditIncomeModalOpen(false)} title="Edit Income">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={editIncomeForm.name}
              onChange={(e) => setEditIncomeForm({ ...editIncomeForm, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={editIncomeForm.amount}
              onChange={(e) => setEditIncomeForm({ ...editIncomeForm, amount: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="date"
                value={editIncomeForm.date}
                onChange={(e) => setEditIncomeForm({ ...editIncomeForm, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleUpdateIncome}
              className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
            >
              Update
            </button>
            <button
              onClick={() => setIsEditIncomeModalOpen(false)}
              className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Expense Category Modal */}
      <Modal isOpen={isAddExpenseModalOpen} onClose={() => setIsAddExpenseModalOpen(false)} title="Add Expense Category">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category Name</label>
            <input
              type="text"
              placeholder="e.g., Groceries, Rent, Entertainment"
              value={addExpenseForm.name}
              onChange={(e) => setAddExpenseForm({ ...addExpenseForm, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Budget Amount</label>
            <input
              type="number"
              placeholder="0.00"
              value={addExpenseForm.amount}
              onChange={(e) => setAddExpenseForm({ ...addExpenseForm, amount: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="date"
                value={addExpenseForm.date}
                onChange={(e) => setAddExpenseForm({ ...addExpenseForm, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddExpense}
              className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsAddExpenseModalOpen(false)}
              className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Expense Category Modal */}
      <Modal isOpen={isEditExpenseModalOpen} onClose={() => setIsEditExpenseModalOpen(false)} title="Edit Expense Category">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category Name</label>
            <input
              type="text"
              value={editExpenseForm.name}
              onChange={(e) => setEditExpenseForm({ ...editExpenseForm, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Budget Amount</label>
            <input
              type="number"
              value={editExpenseForm.amount}
              onChange={(e) => setEditExpenseForm({ ...editExpenseForm, amount: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="date"
                value={editExpenseForm.date}
                onChange={(e) => setEditExpenseForm({ ...editExpenseForm, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleUpdateExpense}
              className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
            >
              Update
            </button>
            <button
              onClick={() => setIsEditExpenseModalOpen(false)}
              className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Asset Modal */}
      <Modal isOpen={isAddAssetModalOpen} onClose={() => setIsAddAssetModalOpen(false)} title="Add Asset">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              placeholder="e.g., House, Car, Stocks"
              value={addAssetForm.name}
              onChange={(e) => setAddAssetForm({ ...addAssetForm, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Value</label>
            <input
              type="number"
              placeholder="0.00"
              value={addAssetForm.value}
              onChange={(e) => setAddAssetForm({ ...addAssetForm, value: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="date"
                value={addAssetForm.date}
                onChange={(e) => setAddAssetForm({ ...addAssetForm, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddAsset}
              className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsAddAssetModalOpen(false)}
              className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Asset Modal */}
      <Modal isOpen={isEditAssetModalOpen} onClose={() => setIsEditAssetModalOpen(false)} title="Edit Asset">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={editAssetForm.name}
              onChange={(e) => setEditAssetForm({ ...editAssetForm, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Value</label>
            <input
              type="number"
              value={editAssetForm.value}
              onChange={(e) => setEditAssetForm({ ...editAssetForm, value: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="date"
                value={editAssetForm.date}
                onChange={(e) => setEditAssetForm({ ...editAssetForm, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleUpdateAsset}
              className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
            >
              Update
            </button>
            <button
              onClick={() => setIsEditAssetModalOpen(false)}
              className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Liability Modal */}
      <Modal isOpen={isAddLiabilityModalOpen} onClose={() => setIsAddLiabilityModalOpen(false)} title="Add Liability">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              placeholder="e.g., Mortgage, Car Loan, Credit Card"
              value={addLiabilityForm.name}
              onChange={(e) => setAddLiabilityForm({ ...addLiabilityForm, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Value</label>
            <input
              type="number"
              placeholder="0.00"
              value={addLiabilityForm.value}
              onChange={(e) => setAddLiabilityForm({ ...addLiabilityForm, value: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="date"
                value={addLiabilityForm.date}
                onChange={(e) => setAddLiabilityForm({ ...addLiabilityForm, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleAddLiability}
              className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={() => setIsAddLiabilityModalOpen(false)}
              className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Liability Modal */}
      <Modal isOpen={isEditLiabilityModalOpen} onClose={() => setIsEditLiabilityModalOpen(false)} title="Edit Liability">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={editLiabilityForm.name}
              onChange={(e) => setEditLiabilityForm({ ...editLiabilityForm, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Value</label>
            <input
              type="number"
              value={editLiabilityForm.value}
              onChange={(e) => setEditLiabilityForm({ ...editLiabilityForm, value: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="date"
                value={editLiabilityForm.date}
                onChange={(e) => setEditLiabilityForm({ ...editLiabilityForm, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleUpdateLiability}
              className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
            >
              Update
            </button>
            <button
              onClick={() => setIsEditLiabilityModalOpen(false)}
              className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Daily Expense Modal */}
      <Modal isOpen={isAddDailyExpenseModalOpen} onClose={() => setIsAddDailyExpenseModalOpen(false)} title="Add Daily Expense">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              placeholder="e.g., Grocery shopping"
              value={dailyExpenseForm.description}
              onChange={(e) => setDailyExpenseForm({ ...dailyExpenseForm, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              placeholder="0.00"
              value={dailyExpenseForm.amount}
              onChange={(e) => setDailyExpenseForm({ ...dailyExpenseForm, amount: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="date"
                value={dailyExpenseForm.date}
                onChange={(e) => setDailyExpenseForm({ ...dailyExpenseForm, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <select
              value={dailyExpenseForm.expenseCategoryId}
              onChange={(e) => setDailyExpenseForm({ ...dailyExpenseForm, expenseCategoryId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {expenseCategoriesData?.data?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleDailyExpenseSubmit}
              className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsAddDailyExpenseModalOpen(false);
                resetDailyExpenseForm();
              }}
              className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Daily Expense Modal */}
      <Modal isOpen={isEditDailyExpenseModalOpen} onClose={() => setIsEditDailyExpenseModalOpen(false)} title="Edit Daily Expense">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              value={dailyExpenseForm.description}
              onChange={(e) => setDailyExpenseForm({ ...dailyExpenseForm, description: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={dailyExpenseForm.amount}
              onChange={(e) => setDailyExpenseForm({ ...dailyExpenseForm, amount: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="date"
                value={dailyExpenseForm.date}
                onChange={(e) => setDailyExpenseForm({ ...dailyExpenseForm, date: e.target.value })}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <select
              value={dailyExpenseForm.expenseCategoryId}
              onChange={(e) => setDailyExpenseForm({ ...dailyExpenseForm, expenseCategoryId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {expenseCategoriesData?.data?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleDailyExpenseSubmit}
              className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
            >
              Update
            </button>
            <button
              onClick={() => {
                setIsEditDailyExpenseModalOpen(false);
                setEditingDailyExpenseId(null);
                resetDailyExpenseForm();
              }}
              className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {itemToDelete && getCategoryName(itemToDelete.type)}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-red-600">
                "{itemToDelete?.name}"
              </span>
              ?
              <br />
              <span className="mt-2 block text-sm text-gray-500">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel
              onClick={() => setDeleteDialogOpen(false)}
              className="mt-0"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default withRoleAuth(Dashboard, ["ADMIN", "USER"]);