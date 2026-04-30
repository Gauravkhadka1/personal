// client/src/app/dashboard/page.tsx

"use client";

import React, { useState } from "react";
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

// Circular Progress Component (for other uses if needed)
const CircularProgress = ({
  percentage,
  size = 120,
  strokeWidth = 8,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 100) return "#ef4444";
    if (percentage >= 80) return "#eab308";
    return "#10b981";
  };

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="-rotate-90 transform" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">
          {Math.min(Math.round(percentage), 100)}%
        </span>
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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
    type: "income" | "expense" | "asset" | "liability" | "dailyExpense";
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Expense Category Edit states
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseForm, setEditExpenseForm] = useState({
    name: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
  });

  // Daily Expenses states
  const [isAddingDailyExpense, setIsAddingDailyExpense] = useState(false);
  const [editingDailyExpenseId, setEditingDailyExpenseId] = useState<
    string | null
  >(null);
  const [dailyExpenseForm, setDailyExpenseForm] = useState({
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    expenseCategoryId: "",
  });

  // Add these state variables in the Dashboard component
  const [isAddingExpenseCategory, setIsAddingExpenseCategory] = useState(false);
  const [newExpenseCategoryForm, setNewExpenseCategoryForm] = useState({
    name: "",
    amount: 0,
  });

  // Add this handler function
  const handleAddExpenseCategorySubmit = async () => {
    if (!newExpenseCategoryForm.name.trim()) return;

    await handleAddExpense({
      name: newExpenseCategoryForm.name,
      amount: newExpenseCategoryForm.amount,
      date: new Date().toISOString().split("T")[0],
    });

    setIsAddingExpenseCategory(false);
    setNewExpenseCategoryForm({ name: "", amount: 0 });
  };

  const {
    data: financialData,
    isLoading,
    error,
    refetch,
  } = useGetFinancialSummaryQuery(filter);

  // Use the enhanced getExpenseCategories query instead of categorySummary
  const { data: expenseCategoriesData, refetch: refetchExpenseCategories } =
    useGetExpenseCategoriesQuery(filter);

  // Daily Expenses queries
  const {
    data: dailyExpensesData,
    isLoading: dailyExpensesLoading,
    refetch: refetchDailyExpenses,
  } = useGetDailyExpensesQuery(filter);

  const [createEarnedIncome] = useCreateEarnedIncomeMutation();
  const [updateEarnedIncome] = useUpdateEarnedIncomeMutation();
  const [deleteEarnedIncome] = useDeleteEarnedIncomeMutation();

  const [createExpenseCategory] = useCreateExpenseCategoryMutation();
  const [updateExpenseCategory] = useUpdateExpenseCategoryMutation();
  const [deleteExpenseCategory] = useDeleteExpenseCategoryMutation();

  const [createAsset] = useCreateAssetMutation();
  const [updateAsset] = useUpdateAssetMutation();
  const [deleteAsset] = useDeleteAssetMutation();

  const [createLiability] = useCreateLiabilityMutation();
  const [updateLiability] = useUpdateLiabilityMutation();
  const [deleteLiability] = useDeleteLiabilityMutation();

  // Daily Expenses mutations
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
      } else {
        await createDailyExpense(dailyExpenseForm).unwrap();
        setIsAddingDailyExpense(false);
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
      date: new Date(expense.date).toISOString().split("T")[0],
      expenseCategoryId: expense.expenseCategoryId,
    });
    setIsAddingDailyExpense(false);
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
    type: "income" | "expense" | "asset" | "liability" | "dailyExpense",
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

  const handleAddIncome = async (data: {
    name: string;
    amount?: number;
    value?: number;
    date?: string;
  }) => {
    try {
      await createEarnedIncome({
        name: data.name,
        amount: data.amount || 0,
        date: data.date,
      }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to add income:", err);
    }
  };

  const handleUpdateIncome = async (
    id: string,
    data: { name: string; amount?: number; value?: number; date?: string },
  ) => {
    try {
      await updateEarnedIncome({
        id,
        name: data.name,
        amount: data.amount || 0,
        date: data.date,
      }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to update income:", err);
    }
  };

  const handleAddExpense = async (data: {
    name: string;
    amount?: number;
    value?: number;
    date?: string;
  }) => {
    try {
      await createExpenseCategory({
        name: data.name,
        amount: data.amount || 0,
        date: data.date,
      }).unwrap();
      refetch();
      refetchExpenseCategories();
    } catch (err) {
      console.error("Failed to add expense category:", err);
    }
  };

  const handleUpdateExpense = async (
    id: string,
    data: { name: string; amount?: number; value?: number; date?: string },
  ) => {
    try {
      await updateExpenseCategory({
        id,
        name: data.name,
        amount: data.amount || 0,
        date: data.date,
      }).unwrap();
      refetch();
      refetchExpenseCategories();
      setEditingExpenseId(null);
      setEditExpenseForm({
        name: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error("Failed to update expense category:", err);
    }
  };

  const handleAddAsset = async (data: {
    name: string;
    amount?: number;
    value?: number;
    date?: string;
  }) => {
    try {
      await createAsset({
        name: data.name,
        value: data.value || 0,
        date: data.date,
      }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to add asset:", err);
    }
  };

  const handleUpdateAsset = async (
    id: string,
    data: { name: string; amount?: number; value?: number; date?: string },
  ) => {
    try {
      await updateAsset({
        id,
        name: data.name,
        value: data.value || 0,
        date: data.date,
      }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to update asset:", err);
    }
  };

  const handleAddLiability = async (data: {
    name: string;
    amount?: number;
    value?: number;
    date?: string;
  }) => {
    try {
      await createLiability({
        name: data.name,
        value: data.value || 0,
        date: data.date,
      }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to add liability:", err);
    }
  };

  const handleUpdateLiability = async (
    id: string,
    data: { name: string; amount?: number; value?: number; date?: string },
  ) => {
    try {
      await updateLiability({
        id,
        name: data.name,
        value: data.value || 0,
        date: data.date,
      }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to update liability:", err);
    }
  };

  const handleEditExpense = (category: {
    id: string;
    name: string;
    amount: number;
  }) => {
    setEditingExpenseId(category.id);
    setEditExpenseForm({
      name: category.name,
      amount: category.amount,
      date: new Date().toISOString().split("T")[0],
    });
  };

  const cancelEditExpense = () => {
    setEditingExpenseId(null);
    setEditExpenseForm({
      name: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
    });
  };

  const saveEditExpense = async () => {
    if (!editExpenseForm.name.trim() || editingExpenseId === null) return;
    await handleUpdateExpense(editingExpenseId, {
      name: editExpenseForm.name,
      amount: editExpenseForm.amount,
      date: editExpenseForm.date,
    });
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

  // Display filter info if applied
  const filterInfo = financialData?.filter;
  const isFilterApplied = filterInfo?.nepaliYear || filterInfo?.dateRange;

  // Calculate totals from expense categories
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FinanceCard
          title="Income"
          type="income"
          items={allIncomes}
          total={totalIncome}
          onAdd={handleAddIncome}
          onUpdate={handleUpdateIncome}
          onDelete={(id, name) => handleDeleteClick(id, name, "income")}
          icon={TrendingUp}
          color="text-green-600"
          bgColor="bg-white"
        />

        {/* Enhanced Expense Categories with ExpenseCategoryCard */}
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Expense Categories
                </h2>
              </div>
              {/* Add Category Button */}
              {!isAddingExpenseCategory && !editingExpenseId && (
                <button
                  onClick={() => setIsAddingExpenseCategory(true)}
                  className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-white transition-colors hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Add</span>
                </button>
              )}
            </div>
          </div>

          {/* Category List with ExpenseCategoryCard */}
          <div className="max-h-[600px] overflow-y-auto p-6">
            {/* Inline Add Form */}
            {isAddingExpenseCategory && (
              <div className="mb-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Add New Category
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Category name (e.g., Groceries, Rent, Entertainment)"
                    value={newExpenseCategoryForm.name}
                    onChange={(e) =>
                      setNewExpenseCategoryForm({
                        ...newExpenseCategoryForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <input
                    type="number"
                    placeholder="Budget amount"
                    value={newExpenseCategoryForm.amount}
                    onChange={(e) =>
                      setNewExpenseCategoryForm({
                        ...newExpenseCategoryForm,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddExpenseCategorySubmit}
                      className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600"
                    >
                      Save Category
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingExpenseCategory(false);
                        setNewExpenseCategoryForm({ name: "", amount: 0 });
                      }}
                      className="flex-1 rounded-lg bg-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Form */}
            {editingExpenseId && (
              <div className="mb-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Edit Category
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editExpenseForm.name}
                    onChange={(e) =>
                      setEditExpenseForm({
                        ...editExpenseForm,
                        name: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Category name"
                    autoFocus
                  />
                  <input
                    type="number"
                    value={editExpenseForm.amount}
                    onChange={(e) =>
                      setEditExpenseForm({
                        ...editExpenseForm,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Budget amount"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEditExpense}
                      className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-sm text-white transition-colors hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditExpense}
                      className="flex-1 rounded-lg bg-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

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

              {expenseCategories.length === 0 &&
                !isAddingExpenseCategory &&
                !editingExpenseId && (
                  <div className="py-12 text-center text-gray-500">
                    No expense categories found. Click "Add New Category" to get
                    started.
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
          }))}
          total={totalAssets}
          onAdd={handleAddAsset}
          onUpdate={handleUpdateAsset}
          onDelete={(id, name) => handleDeleteClick(id, name, "asset")}
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
          }))}
          total={totalLiabilities}
          onAdd={handleAddLiability}
          onUpdate={handleUpdateLiability}
          onDelete={(id, name) => handleDeleteClick(id, name, "liability")}
          icon={AlertTriangle}
          color="text-orange-600"
          bgColor="bg-white"
        />
      </div>
      {/* Daily Expenses Section - At the bottom */}
      <div className="mt-8">
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Daily Expenses
              </h2>
            </div>
            <button
              onClick={() => {
                setIsAddingDailyExpense(true);
                setEditingDailyExpenseId(null);
                resetDailyExpenseForm();
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          </div>

          <div className="p-6">
            {/* Add/Edit Form */}
            {(isAddingDailyExpense || editingDailyExpenseId) && (
              <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                      <input
                        type="text"
                        placeholder="Grocery shopping"
                        value={dailyExpenseForm.description}
                        onChange={(e) =>
                          setDailyExpenseForm({
                            ...dailyExpenseForm,
                            description: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Amount
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                      <input
                        type="number"
                        placeholder="0.00"
                        value={dailyExpenseForm.amount}
                        onChange={(e) =>
                          setDailyExpenseForm({
                            ...dailyExpenseForm,
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded-lg border py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                      <input
                        type="date"
                        value={dailyExpenseForm.date}
                        onChange={(e) =>
                          setDailyExpenseForm({
                            ...dailyExpenseForm,
                            date: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      value={dailyExpenseForm.expenseCategoryId}
                      onChange={(e) =>
                        setDailyExpenseForm({
                          ...dailyExpenseForm,
                          expenseCategoryId: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category</option>
                      {expenseCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleDailyExpenseSubmit}
                    className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
                  >
                    {editingDailyExpenseId ? "Update" : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingDailyExpense(false);
                      setEditingDailyExpenseId(null);
                      resetDailyExpenseForm();
                    }}
                    className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Daily Expenses List */}
            {dailyExpensesLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="space-y-3">
                {dailyExpensesData?.data?.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-red-100 p-2">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {expense.description}
                        </p>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {expense.expenseCategory?.name}
                          </span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-500">
                            {new Date(expense.date).toLocaleDateString()}
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
                {(!dailyExpensesData?.data ||
                  dailyExpensesData.data.length === 0) && (
                  <div className="py-12 text-center text-gray-500">
                    No daily expenses found for this period. Click "Add Expense"
                    to get started.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
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
