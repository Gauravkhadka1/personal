'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  DollarSign,
  TrendingDown,
  AlertCircle,
  Target,
  PieChart,
  Loader2,
} from 'lucide-react';
import {
  useGetExpenseCategoriesQuery,
  useGetDailyExpensesQuery,
  useCreateDailyExpenseMutation,
  useUpdateDailyExpenseMutation,
  useDeleteDailyExpenseMutation,
  useGetAllRemainingAmountsQuery,
  useSetBudgetLimitMutation,
  useGetBudgetSettingsQuery,
  DailyExpense,
  ExpenseCategory,
} from '@/state/api';

const DailyExpensesManager = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<DailyExpense | null>(null);
  const [isSettingBudget, setIsSettingBudget] = useState(false);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    amount: 0,
    category: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [budgetData, setBudgetData] = useState({
    category: '',
    budgetLimit: 0,
  });

  // Fetch data with proper error handling
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading,
    error: categoriesError 
  } = useGetExpenseCategoriesQuery();
  
  const { 
    data: expensesData, 
    isLoading: expensesLoading,
    refetch: refetchExpenses 
  } = useGetDailyExpensesQuery({
    category: selectedCategory || undefined,
    month: selectedMonth,
    year: selectedYear,
  });
  
  const { 
    data: remainingAmounts, 
    isLoading: remainingLoading,
    refetch: refetchRemaining 
  } = useGetAllRemainingAmountsQuery();
  
  const { 
    data: budgetSettings, 
    refetch: refetchBudgets 
  } = useGetBudgetSettingsQuery();
  
  // Mutations
  const [createExpense, { isLoading: isCreating }] = useCreateDailyExpenseMutation();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateDailyExpenseMutation();
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteDailyExpenseMutation();
  const [setBudgetLimit, { isLoading: isSettingBudgetLimit }] = useSetBudgetLimitMutation();

  // Safely extract categories array
  const categories = React.useMemo(() => {
    if (Array.isArray(categoriesData)) {
      return categoriesData;
    }
    if (categoriesData && typeof categoriesData === 'object' && 'categories' in categoriesData) {
      return (categoriesData as any).categories || [];
    }
    return [];
  }, [categoriesData]);

  // Safely extract expenses array
  const expenses = React.useMemo(() => {
    if (Array.isArray(expensesData)) {
      return expensesData;
    }
    if (expensesData && typeof expensesData === 'object' && 'data' in expensesData) {
      return (expensesData as any).data || [];
    }
    return [];
  }, [expensesData]);

  // Safely extract category stats
  const categoryStats = React.useMemo(() => {
    if (remainingAmounts && typeof remainingAmounts === 'object' && 'categories' in remainingAmounts) {
      return (remainingAmounts as any).categories || [];
    }
    return [];
  }, [remainingAmounts]);

  const handleAddExpense = async () => {
    if (!formData.name || !formData.amount || !formData.category) {
      alert('Please fill all fields');
      return;
    }

    try {
      await createExpense({
        name: formData.name,
        amount: formData.amount,
        category: formData.category,
        date: formData.date,
      }).unwrap();
      
      setIsAddingExpense(false);
      setFormData({ name: '', amount: 0, category: '', date: new Date().toISOString().split('T')[0] });
      refetchExpenses();
      refetchRemaining();
      refetchBudgets();
    } catch (error) {
      console.error('Failed to add expense:', error);
      alert('Failed to add expense');
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    
    try {
      await updateExpense({
        id: editingExpense.id,
        name: formData.name,
        amount: formData.amount,
        category: formData.category,
        date: formData.date,
      }).unwrap();
      
      setEditingExpense(null);
      setFormData({ name: '', amount: 0, category: '', date: new Date().toISOString().split('T')[0] });
      refetchExpenses();
      refetchRemaining();
      refetchBudgets();
    } catch (error) {
      console.error('Failed to update expense:', error);
      alert('Failed to update expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id).unwrap();
        refetchExpenses();
        refetchRemaining();
        refetchBudgets();
      } catch (error) {
        console.error('Failed to delete expense:', error);
        alert('Failed to delete expense');
      }
    }
  };

  const handleSetBudget = async () => {
    if (!budgetData.category || !budgetData.budgetLimit) {
      alert('Please fill all fields');
      return;
    }

    try {
      await setBudgetLimit({
        category: budgetData.category,
        budgetLimit: budgetData.budgetLimit,
      }).unwrap();
      
      setIsSettingBudget(false);
      setBudgetData({ category: '', budgetLimit: 0 });
      refetchRemaining();
      refetchBudgets();
    } catch (error) {
      console.error('Failed to set budget:', error);
      alert('Failed to set budget');
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Show loading state
  if (categoriesLoading || expensesLoading || remainingLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading daily expenses...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (categoriesError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-red-600">Error loading categories</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-800">Daily Expenses Manager</h1>
        <p className="text-gray-600">
          Track your daily expenses, set budgets, and monitor your spending
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setIsAddingExpense(true)}
          disabled={isCreating}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {isCreating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          Add Expense
        </button>
        <button
          onClick={() => setIsSettingBudget(true)}
          disabled={isSettingBudgetLimit}
          className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
        >
          <Target className="h-5 w-5" />
          Set Budget
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories && categories.length > 0 ? (
                categories.map((cat: any) => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))
              ) : (
                <option disabled>No categories available</option>
              )}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Year</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Budget Overview Cards */}
      {categoryStats && categoryStats.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Budget Overview</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categoryStats.map((stat: any) => (
              <div key={stat.category} className="rounded-lg bg-white p-4 shadow">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{stat.category}</h3>
                  <span className={`text-sm font-medium ${
                    stat.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${stat.remaining?.toLocaleString() || '0'} left
                  </span>
                </div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Spent: ${stat.totalSpent?.toLocaleString() || '0'}</span>
                  <span>Budget: ${stat.budgetLimit?.toLocaleString() || '0'}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all ${getProgressColor(stat.percentageUsed || 0)}`}
                    style={{ width: `${Math.min(stat.percentageUsed || 0, 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {(stat.percentageUsed || 0).toFixed(1)}% used
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">Expenses</h2>
        </div>
        <div className="overflow-x-auto">
          {expenses && expenses.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {expenses.map((expense: DailyExpense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">{expense.name}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                        {expense.category}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-red-600">
                      ${expense.amount.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingExpense(expense);
                            setFormData({
                              name: expense.name,
                              amount: expense.amount,
                              category: expense.category,
                              date: expense.date.split('T')[0],
                            });
                          }}
                          disabled={isUpdating}
                          className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-gray-500">
              No expenses found. Click "Add Expense" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      {(isAddingExpense || editingExpense) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingExpense(false);
                  setEditingExpense(null);
                  setFormData({ name: '', amount: 0, category: '', date: new Date().toISOString().split('T')[0] });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Lunch, Coffee, Groceries"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories && categories.length > 0 ? (
                    categories.map((cat: any) => (
                      <option key={cat.id || cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No categories available</option>
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
                  disabled={isCreating || isUpdating}
                  className="flex-1 rounded-lg bg-blue-500 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
                >
                  {(isCreating || isUpdating) ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : (
                    editingExpense ? 'Update' : 'Save'
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsAddingExpense(false);
                    setEditingExpense(null);
                    setFormData({ name: '', amount: 0, category: '', date: new Date().toISOString().split('T')[0] });
                  }}
                  className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set Budget Modal */}
      {isSettingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Set Monthly Budget</h3>
              <button
                onClick={() => {
                  setIsSettingBudget(false);
                  setBudgetData({ category: '', budgetLimit: 0 });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                <select
                  value={budgetData.category}
                  onChange={(e) => setBudgetData({ ...budgetData, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories && categories.length > 0 ? (
                    categories.map((cat: any) => (
                      <option key={cat.id || cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>No categories available</option>
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Monthly Budget Limit</label>
                <input
                  type="number"
                  value={budgetData.budgetLimit}
                  onChange={(e) => setBudgetData({ ...budgetData, budgetLimit: parseFloat(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSetBudget}
                  disabled={isSettingBudgetLimit}
                  className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {isSettingBudgetLimit ? (
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  ) : (
                    'Set Budget'
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsSettingBudget(false);
                    setBudgetData({ category: '', budgetLimit: 0 });
                  }}
                  className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyExpensesManager;