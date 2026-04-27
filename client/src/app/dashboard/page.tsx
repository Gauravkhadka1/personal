"use client";

import React from "react";
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
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useGetAssetsQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useCreateLiabilityMutation,
  useUpdateLiabilityMutation,
  useDeleteLiabilityMutation,
} from "@/state/api";
import { useAuth } from "../../context/AuthContext";
import withRoleAuth from "../../hoc/withRoleAuth";

const Dashboard = () => {
    const { user } = useAuth();
  // Fetch financial summary
  const {
    data: financialData,
    isLoading,
    error,
    refetch,
  } = useGetFinancialSummaryQuery();

  // Mutations for each type
  const [createEarnedIncome] = useCreateEarnedIncomeMutation();
  const [updateEarnedIncome] = useUpdateEarnedIncomeMutation();
  const [deleteEarnedIncome] = useDeleteEarnedIncomeMutation();

  const [createExpense] = useCreateExpenseMutation();
  const [updateExpense] = useUpdateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  const [createAsset] = useCreateAssetMutation();
  const [updateAsset] = useUpdateAssetMutation();
  const [deleteAsset] = useDeleteAssetMutation();

  const [createLiability] = useCreateLiabilityMutation();
  const [updateLiability] = useUpdateLiabilityMutation();
  const [deleteLiability] = useDeleteLiabilityMutation();

  // Transform data for FinanceCard components

  const earnedIncomes = financialData?.details?.earnedIncomes || [];
  const passiveIncomes = financialData?.details?.passiveIncomes || [];
  const expenses = financialData?.details?.expenses || [];
    const assets = financialData?.details?.assets || [];
  const liabilities = financialData?.details?.liabilities || [];

  // Combine all incomes
  const allIncomes = [...earnedIncomes, ...passiveIncomes].map((income) => ({
    id: income.id,
    name: income.name,
    amount: income.amount,
  }));

  const totalIncome = financialData?.summary?.totalIncome || 0;
  const totalExpenses = financialData?.summary?.totalExpenses || 0;
  const totalLiabilities = financialData?.summary?.totalLiabilities || 0;
  const totalAssets = financialData?.summary?.totalAssets || 0;

  // Handlers for Income
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
      const isEarned = earnedIncomes.some((inc) => inc.id === id);
      if (isEarned) {
        await updateEarnedIncome({ id, name: data.name, amount: data.amount || 0 }).unwrap();
      } else {
        await updateEarnedIncome({ id, name: data.name, amount: data.amount || 0 }).unwrap();
      }
      refetch();
    } catch (err) {
      console.error("Failed to update income:", err);
    }
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      await deleteEarnedIncome(id).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to delete income:", err);
    }
  };

  // Handlers for Expense
  const handleAddExpense = async (data: { name: string; amount?: number; value?: number }) => {
    try {
      await createExpense({ name: data.name, amount: data.amount || 0 }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to add expense:", err);
    }
  };

  const handleUpdateExpense = async (
    id: string,
    data: { name: string; amount?: number; value?: number }
  ) => {
    try {
      await updateExpense({ id, name: data.name, amount: data.amount || 0 }).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to update expense:", err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  // Handlers for Asset
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

  const handleDeleteAsset = async (id: string) => {
    try {
      await deleteAsset(id).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to delete asset:", err);
    }
  };

  // Handlers for Liability
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

  const handleDeleteLiability = async (id: string) => {
    try {
      await deleteLiability(id).unwrap();
      refetch();
    } catch (err) {
      console.error("Failed to delete liability:", err);
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

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-800">
          Financial Dashboard
        </h1>
        <p className="text-gray-600">
          Track your income, expenses, assets, and liabilities
        </p>
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

      {/* Main Grid - 2x2 Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Row */}
        <FinanceCard
          title="Income"
          type="income"
          items={allIncomes}
          total={totalIncome}
          onAdd={handleAddIncome}
          onUpdate={handleUpdateIncome}
          onDelete={handleDeleteIncome}
          icon={TrendingUp}
          color="text-green-600"
          bgColor="bg-white"
        />

        <FinanceCard
          title="Expenses"
          type="expense"
          items={expenses}
          total={totalExpenses}
          onAdd={handleAddExpense}
          onUpdate={handleUpdateExpense}
          onDelete={handleDeleteExpense}
          icon={TrendingDown}
          color="text-red-600"
          bgColor="bg-white"
        />

        {/* Bottom Row */}
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
          onDelete={handleDeleteAsset}
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
          onDelete={handleDeleteLiability}
          icon={AlertTriangle}
          color="text-orange-600"
          bgColor="bg-white"
        />
      </div>

      {/* Refresh Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => refetch()}
          className="rounded-full bg-blue-500 p-3 text-white shadow-lg transition-colors hover:bg-blue-600"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;