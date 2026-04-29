// client/src/app/dashboard/page.tsx

"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import FinanceCard from "@/components/FinanceCard";
import {
  useGetUsersQuery,
  useGetFinancialSummaryQuery,
  useCreateEarnedIncomeMutation,
  useUpdateEarnedIncomeMutation,
  useDeleteEarnedIncomeMutation,
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

// Circular Progress Component
const CircularProgress = ({ 
  percentage, 
  size = 120, 
  strokeWidth = 8 
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
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
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
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
    type: 'income' | 'expense' | 'asset' | 'liability';
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpenseForm, setEditExpenseForm] = useState({ name: '', amount: 0 });

  // Get current month date range for category summary
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const {
    data: financialData,
    isLoading,
    error,
    refetch,
  } = useGetFinancialSummaryQuery();

  const { data: categorySummaryData, refetch: refetchCategorySummary } = useGetExpenseCategorySummaryQuery({
    startDate,
    endDate,
  });

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

  const earnedIncomes = financialData?.details?.earnedIncomes || [];
  const passiveIncomes = financialData?.details?.passiveIncomes || [];
  const expenseCategories = financialData?.details?.expenseCategories || [];
  const assets = financialData?.details?.assets || [];
  const liabilities = financialData?.details?.liabilities || [];

  const allIncomes = [...earnedIncomes, ...passiveIncomes].map((income) => ({
    id: income.id,
    name: income.name,
    amount: income.amount,
  }));

  const totalIncome = financialData?.summary?.totalIncome || 0;
  const totalExpenses = financialData?.summary?.totalExpenses || 0;
  const totalLiabilities = financialData?.summary?.totalLiabilities || 0;
  const totalAssets = financialData?.summary?.totalAssets || 0;

  const handleDeleteClick = (id: string, name: string, type: 'income' | 'expense' | 'asset' | 'liability') => {
    setItemToDelete({ id, name, type });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      switch (itemToDelete.type) {
        case 'income':
          await deleteEarnedIncome(itemToDelete.id).unwrap();
          break;
        case 'expense':
          await deleteExpenseCategory(itemToDelete.id).unwrap();
          break;
        case 'asset':
          await deleteAsset(itemToDelete.id).unwrap();
          break;
        case 'liability':
          await deleteLiability(itemToDelete.id).unwrap();
          break;
      }
      refetch();
      refetchCategorySummary();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (err) {
      console.error(`Failed to delete ${itemToDelete.type}:`, err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddIncome = async (data: { name: string; amount?: number; value?: number }) => {
    try {
      await createEarnedIncome({ name: data.name, amount: data.amount || 0 }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to add income:", err);
    }
  };

  const handleUpdateIncome = async (
    id: string,
    data: { name: string; amount?: number; value?: number }
  ) => {
    try {
      await updateEarnedIncome({ id, name: data.name, amount: data.amount || 0 }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to update income:", err);
    }
  };

  const handleAddExpense = async (data: { name: string; amount?: number; value?: number }) => {
    try {
      await createExpenseCategory({ name: data.name, amount: data.amount || 0 }).unwrap();
      refetch();
      refetchCategorySummary();
    } catch (err) {
      console.error("Failed to add expense category:", err);
    }
  };

  const handleUpdateExpense = async (
    id: string,
    data: { name: string; amount?: number; value?: number }
  ) => {
    try {
      await updateExpenseCategory({ id, name: data.name, amount: data.amount || 0 }).unwrap();
      refetch();
      refetchCategorySummary();
      setEditingExpenseId(null);
      setEditExpenseForm({ name: '', amount: 0 });
    } catch (err) {
      console.error("Failed to update expense category:", err);
    }
  };

  const handleAddAsset = async (data: { name: string; amount?: number; value?: number }) => {
    try {
      await createAsset({ name: data.name, value: data.value || 0 }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to add asset:", err);
    }
  };

  const handleUpdateAsset = async (
    id: string,
    data: { name: string; amount?: number; value?: number }
  ) => {
    try {
      await updateAsset({ id, name: data.name, value: data.value || 0 }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to update asset:", err);
    }
  };

  const handleAddLiability = async (data: { name: string; amount?: number; value?: number }) => {
    try {
      await createLiability({ name: data.name, value: data.value || 0 }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to add liability:", err);
    }
  };

  const handleUpdateLiability = async (
    id: string,
    data: { name: string; amount?: number; value?: number }
  ) => {
    try {
      await updateLiability({ id, name: data.name, value: data.value || 0 }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to update liability:", err);
    }
  };

  const startEditExpense = (category: { id: string; name: string; amount: number }) => {
    setEditingExpenseId(category.id);
    setEditExpenseForm({ name: category.name, amount: category.amount });
  };

  const cancelEditExpense = () => {
    setEditingExpenseId(null);
    setEditExpenseForm({ name: '', amount: 0 });
  };

  const saveEditExpense = async (id: string) => {
    if (!editExpenseForm.name.trim()) return;
    await handleUpdateExpense(id, { name: editExpenseForm.name, amount: editExpenseForm.amount });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overspent":
        return "text-red-600 bg-red-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "good":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
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
      case 'income': return 'Income';
      case 'expense': return 'Expense Category';
      case 'asset': return 'Asset';
      case 'liability': return 'Liability';
      default: return 'Item';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-800">
          Financial Dashboard
        </h1>
        <p className="text-gray-600">
          Track your income, expense categories, assets, and liabilities
        </p>
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
              totalIncome - totalExpenses >= 0 ? "text-green-600" : "text-red-600"
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
              financialData?.summary?.netWorth && financialData.summary.netWorth >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            ${financialData?.summary?.netWorth?.toLocaleString() || "0"}
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
          onDelete={(id, name) => handleDeleteClick(id, name, 'income')}
          icon={TrendingUp}
          color="text-green-600"
          bgColor="bg-white"
        />

        {/* Enhanced Expense Categories with integrated budget details and edit controls */}
        <div className="rounded-xl bg-white shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-800">Expense Categories</h2>
              </div>
              <button
                onClick={() => {
                  const name = prompt("Enter category name:");
                  const budget = prompt("Enter budget amount:");
                  if (name && budget) {
                    handleAddExpense({ name, amount: parseFloat(budget) });
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Category
              </button>
            </div>
          </div>
          
          {/* Category List with Integrated Budget Details */}
          <div className="p-6 max-h-[600px] overflow-y-auto">
            <div className="space-y-6">
              {categorySummaryData?.data?.map((category) => (
                <div key={category.id} className="rounded-lg bg-gray-50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex-1">
                      {editingExpenseId === category.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editExpenseForm.name}
                            onChange={(e) => setEditExpenseForm({ ...editExpenseForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Category name"
                            autoFocus
                          />
                          <input
                            type="number"
                            value={editExpenseForm.amount}
                            onChange={(e) => setEditExpenseForm({ ...editExpenseForm, amount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Budget amount"
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => saveEditExpense(category.id)}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditExpense}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold text-gray-800">{category.name}</h3>
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(category.status)}`}
                          >
                            {category.status === "overspent"
                              ? "Over Budget"
                              : category.status === "warning"
                                ? "Near Limit"
                                : "On Track"}
                          </span>
                        </>
                      )}
                    </div>
                    
                    {editingExpenseId !== category.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditExpense({ id: category.id, name: category.name, amount: category.budget })}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category.id, category.name, 'expense')}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Circular Progress */}
                  {editingExpenseId !== category.id && (
                    <>
                      <div className="flex justify-center mb-6">
                        <CircularProgress 
                          percentage={Math.min(parseFloat(category.percentageUsed), 100)} 
                          size={100}
                          strokeWidth={8}
                        />
                      </div>

                      {/* Budget Details Grid */}
                      <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">Budget</p>
                          <p className="text-lg font-bold text-gray-800">
                            ${category.budget.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">Spent</p>
                          <p className="text-lg font-bold text-red-600">
                            ${category.spent.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">Remaining</p>
                          <p className={`text-lg font-bold ${
                            category.remaining < 0 ? "text-red-600" : "text-green-600"
                          }`}>
                            ${Math.abs(category.remaining).toLocaleString()}
                            {category.remaining < 0 && <span className="text-sm ml-1">over</span>}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">Usage</p>
                          <p className="text-lg font-bold text-gray-800">
                            {category.percentageUsed}%
                          </p>
                        </div>
                      </div>

                      {/* Linear progress bar for quick reference */}
                      <div className="mt-4 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            category.status === "overspent"
                              ? "bg-red-500"
                              : category.status === "warning"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(parseFloat(category.percentageUsed), 100)}%`,
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {(!categorySummaryData?.data || categorySummaryData.data.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  No expense categories found. Click "Add Category" to track spending.
                </div>
              )}
            </div>
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
          onDelete={(id, name) => handleDeleteClick(id, name, 'asset')}
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
          onDelete={(id, name) => handleDeleteClick(id, name, 'liability')}
          icon={AlertTriangle}
          color="text-orange-600"
          bgColor="bg-white"
        />
      </div>

      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => refetch()}
          className="rounded-full bg-blue-500 p-3 text-white shadow-lg transition-colors hover:bg-blue-600"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete && getCategoryName(itemToDelete.type)}</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-red-600">"{itemToDelete?.name}"</span>?
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
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