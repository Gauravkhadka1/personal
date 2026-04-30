// client/src/app/daily-expenses/page.tsx

"use client";

import React, { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import NepaliDateFilter from "@/components/NepaliDateFilter";
import {
  useGetDailyExpensesQuery,
  useCreateDailyExpenseMutation,
  useUpdateDailyExpenseMutation,
  useDeleteDailyExpenseMutation,
  useGetExpenseCategoriesQuery,
} from "@/state/api";
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

const DailyExpenses = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ nepaliYear?: number; nepaliMonth?: number; startDate?: string; endDate?: string }>({});
  const [formData, setFormData] = useState({
    description: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    expenseCategoryId: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: dailyExpensesData,
    isLoading,
    refetch,
  } = useGetDailyExpensesQuery(filter);

  const { data: categoriesResponse } = useGetExpenseCategoriesQuery();
  const categoriesData = categoriesResponse?.data || [];

  const [createDailyExpense] = useCreateDailyExpenseMutation();
  const [updateDailyExpense] = useUpdateDailyExpenseMutation();
  const [deleteDailyExpense] = useDeleteDailyExpenseMutation();

  const handleSubmit = async () => {
    if (
      !formData.description ||
      !formData.amount ||
      !formData.date ||
      !formData.expenseCategoryId
    )
      return;

    try {
      if (editingId) {
        await updateDailyExpense({ id: editingId, ...formData }).unwrap();
        setEditingId(null);
      } else {
        await createDailyExpense(formData).unwrap();
        setIsAdding(false);
      }
      resetForm();
      refetch();
    } catch (err) {
      console.error("Failed to save daily expense:", err);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDailyExpense(itemToDelete).unwrap();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      refetch();
    } catch (err) {
      console.error("Failed to delete daily expense:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (expense: any) => {
    setEditingId(expense.id);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      date: new Date(expense.date).toISOString().split("T")[0],
      expenseCategoryId: expense.expenseCategoryId,
    });
    setIsAdding(false);
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      expenseCategoryId: "",
    });
  };

  // Get filter display info
  const filterInfo = dailyExpensesData?.filter;
  const isFilterApplied = filterInfo?.nepaliYear || filterInfo?.dateRange;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-800">
          Daily Expenses
        </h1>
        <p className="text-gray-600">Track your daily spending by category</p>
        {isFilterApplied && (
          <div className="mt-2 rounded-lg bg-blue-50 p-2 text-sm text-blue-800">
            📊 Showing expenses for:{" "}
            {filterInfo?.nepaliYear && filterInfo?.nepaliMonth
              ? `${filterInfo.nepaliMonthName} ${filterInfo.nepaliYear} BS`
              : filterInfo?.dateRange
              ? `${new Date(filterInfo.dateRange.start).toLocaleDateString()} - ${new Date(filterInfo.dateRange.end).toLocaleDateString()}`
              : "All time"}
          </div>
        )}
      </div>

      {/* Nepali Date Filter */}
      <div className="mb-6">
        <NepaliDateFilter onFilterChange={setFilter} initialFilter={filter} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Daily Expenses List - Full Width */}
        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Expenses List
            </h2>
            <button
              onClick={() => {
                setIsAdding(true);
                setEditingId(null);
                resetForm();
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </button>
          </div>

          <div className="p-6">
            {/* Add/Edit Form */}
            {(isAdding || editingId) && (
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
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
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
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
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
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
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
                      value={formData.expenseCategoryId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expenseCategoryId: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select category</option>
                      {categoriesData.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
                  >
                    {editingId ? "Update" : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                      resetForm();
                    }}
                    className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Expenses List */}
            {isLoading ? (
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
                          onClick={() => handleEdit(expense)}
                          className="rounded-lg p-2 hover:bg-gray-200"
                        >
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(expense.id);
                            setDeleteDialogOpen(true);
                          }}
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
                    No expenses found for this period. Click "Add Expense" to
                    get started.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Daily Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this daily expense? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
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

export default withRoleAuth(DailyExpenses, ["ADMIN", "USER"]);