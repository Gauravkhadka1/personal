import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface User {
  userId?: number;
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  profilePictureUrl?: string;
  role: "ADMIN" | "USER";
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPayload {
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  profilePictureUrl?: string;
  role: "ADMIN" | "USER";
  password: string;
  clientId?: number;
}

export interface EarnedIncome {
  id: string;
  name: string;
  amount: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface PassiveIncome {
  id: string;
  name: string;
  amount: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  value: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Liability {
  id: string;
  name: string;
  value: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  summary: {
    totalEarnedIncome: number;
    totalPassiveIncome: number;
    totalIncome: number;
    totalExpenses: number;
    totalAssets: number;
    totalLiabilities: number;
    netCashFlow: number;
    netWorth: number;
  };
  details: {
    earnedIncomes: EarnedIncome[];
    passiveIncomes: PassiveIncome[];
    expenses: Expense[];
       assets: Asset[];
    liabilities: Liability[];
  };
}

export interface DailyExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  source?: string;
}

export interface BudgetSetting {
  id: string;
  category: string;
  budgetLimit: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface RemainingAmountResponse {
  category: string;
  totalSpent: number;
  budgetLimit: number;
  remaining: number;
  percentageUsed: number;
  startDate: string;
  endDate: string;
}

export interface AllRemainingAmountsResponse {
  summary: {
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    averagePercentageUsed: number;
  };
  categories: Array<{
    category: string;
    totalSpent: number;
    budgetLimit: number;
    remaining: number;
    percentageUsed: number;
    recentExpenses: DailyExpense[];
  }>;
}

export interface DailyExpenseResponse extends DailyExpense {
  remainingAmount?: number;
  totalSpentThisMonth?: number;
  budgetLimit?: number;
}

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: [
    "Users",
    "PolicyCategories",
    "Policies",
    "EarnedIncome",
    "PassiveIncome",
    "Expense",
    "Asset",
    "Liability",
    "ExpenseCategory",
    "DailyExpense",
    "BudgetSetting",
    "RemainingAmount",
  ],
  endpoints: (build) => ({
    // User endpoints (existing)
    registerUser: build.mutation<{ message: string }, UserPayload>({
      query: (userData) => ({
        url: "users",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Users"],
    }),

    changePassword: build.mutation<
      { message: string },
      { userId: number; currentPassword: string; newPassword: string }
    >({
      query: ({ userId, currentPassword, newPassword }) => ({
        url: `users/${userId}/change-password`,
        method: "POST",
        body: { currentPassword, newPassword },
      }),
    }),

    getUsers: build.query<User[], void>({
      query: () => "users",
      providesTags: ["Users"],
    }),

    deleteUser: build.mutation<void, string>({
      query: (email) => ({
        url: `users/${email}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

    updateUserRole: build.mutation<void, { userId: number; role: string }>({
      query: ({ userId, role }) => ({
        url: `users/role/${userId}`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: ["Users"],
    }),

    getFinancialSummary: build.query<FinancialSummary, void>({
      query: () => "finance/summary",
      providesTags: ["EarnedIncome", "PassiveIncome", "Expense", "Liability"],
    }),

    // Earned Income
    getEarnedIncomes: build.query<EarnedIncome[], void>({
      query: () => "finance/earned-income",
      providesTags: ["EarnedIncome"],
    }),
    createEarnedIncome: build.mutation<
      EarnedIncome,
      { name: string; amount: number }
    >({
      query: (body) => ({
        url: "finance/earned-income",
        method: "POST",
        body,
      }),
      invalidatesTags: ["EarnedIncome"],
    }),
    updateEarnedIncome: build.mutation<
      EarnedIncome,
      { id: string; name: string; amount: number }
    >({
      query: ({ id, ...body }) => ({
        url: `finance/earned-income/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["EarnedIncome"],
    }),
    deleteEarnedIncome: build.mutation<void, string>({
      query: (id) => ({
        url: `finance/earned-income/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["EarnedIncome"],
    }),

    // Passive Income
    getPassiveIncomes: build.query<PassiveIncome[], void>({
      query: () => "finance/passive-income",
      providesTags: ["PassiveIncome"],
    }),
    createPassiveIncome: build.mutation<
      PassiveIncome,
      { name: string; amount: number }
    >({
      query: (body) => ({
        url: "finance/passive-income",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PassiveIncome"],
    }),
    updatePassiveIncome: build.mutation<
      PassiveIncome,
      { id: string; name: string; amount: number }
    >({
      query: ({ id, ...body }) => ({
        url: `finance/passive-income/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PassiveIncome"],
    }),
    deletePassiveIncome: build.mutation<void, string>({
      query: (id) => ({
        url: `finance/passive-income/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PassiveIncome"],
    }),

    // Expense
    getExpenses: build.query<Expense[], void>({
      query: () => "finance/expense",
      providesTags: ["Expense"],
    }),
    createExpense: build.mutation<Expense, { name: string; amount: number }>({
      query: (body) => ({
        url: "finance/expense",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Expense"],
    }),
    updateExpense: build.mutation<
      Expense,
      { id: string; name: string; amount: number }
    >({
      query: ({ id, ...body }) => ({
        url: `finance/expense/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Expense"],
    }),
    deleteExpense: build.mutation<void, string>({
      query: (id) => ({
        url: `finance/expense/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Expense"],
    }),

    getAssets: build.query<Asset[], void>({
  query: () => "finance/asset",
  providesTags: ["Asset"],
}),
createAsset: build.mutation<Asset, { name: string; value: number }>({
  query: (body) => ({
    url: "finance/asset",
    method: "POST",
    body,
  }),
  invalidatesTags: ["Asset"],
}),
updateAsset: build.mutation<Asset, { id: string; name: string; value: number }>({
  query: ({ id, ...body }) => ({
    url: `finance/asset/${id}`,
    method: "PUT",
    body,
  }),
  invalidatesTags: ["Asset"],
}),
deleteAsset: build.mutation<void, string>({
  query: (id) => ({
    url: `finance/asset/${id}`,
    method: "DELETE",
  }),
  invalidatesTags: ["Asset"],
}),

    // Liability
    getLiabilities: build.query<Liability[], void>({
      query: () => "finance/liability",
      providesTags: ["Liability"],
    }),
    createLiability: build.mutation<Liability, { name: string; value: number }>(
      {
        query: (body) => ({
          url: "finance/liability",
          method: "POST",
          body,
        }),
        invalidatesTags: ["Liability"],
      },
    ),
    updateLiability: build.mutation<
      Liability,
      { id: string; name: string; value: number }
    >({
      query: ({ id, ...body }) => ({
        url: `finance/liability/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Liability"],
    }),
    deleteLiability: build.mutation<void, string>({
      query: (id) => ({
        url: `finance/liability/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Liability"],
    }),


 getExpenseCategories: build.query<ExpenseCategory[], void>({
      query: () => "finance/daily-expenses/categories",
      providesTags: ["ExpenseCategory"],
    }),
    
    // Get all daily expenses
    getDailyExpenses: build.query<{
      data: DailyExpense[];
      pagination: any;
      categoryStats: any[];
    }, { page?: number; limit?: number; category?: string; month?: number; year?: number }>({
      query: (params) => ({
        url: "finance/daily-expenses",
        params,
      }),
      providesTags: ["DailyExpense"],
    }),
    
    // Get single daily expense
    getDailyExpenseById: build.query<DailyExpenseResponse, string>({
      query: (id) => `finance/daily-expenses/${id}`,
      providesTags: ["DailyExpense"],
    }),
    
    // Create daily expense
    createDailyExpense: build.mutation<
      DailyExpenseResponse,
      { name: string; amount: number; category: string; date?: string }
    >({
      query: (body) => ({
        url: "finance/daily-expenses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DailyExpense", "ExpenseCategory"],
    }),
    
    // Update daily expense
    updateDailyExpense: build.mutation<
      DailyExpenseResponse,
      { id: string; name?: string; amount?: number; category?: string; date?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `finance/daily-expenses/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["DailyExpense", "ExpenseCategory"],
    }),
    
    // Delete daily expense
    deleteDailyExpense: build.mutation<{ message: string; remainingAmount?: number }, string>({
      query: (id) => ({
        url: `finance/daily-expenses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DailyExpense", "ExpenseCategory"],
    }),
    
    // Get remaining amount for a category
    getRemainingAmount: build.query<
      RemainingAmountResponse,
      { category: string; month?: number; year?: number }
    >({
      query: ({ category, month, year }) => ({
        url: `finance/daily-expenses/remaining/${category}`,
        params: { month, year },
      }),
      providesTags: ["DailyExpense", "BudgetSetting"],
    }),
    
    // Get all remaining amounts (dashboard view)
    getAllRemainingAmounts: build.query<AllRemainingAmountsResponse, void>({
      query: () => "finance/daily-expenses/remaining/all",
      providesTags: ["DailyExpense", "BudgetSetting"],
    }),
    
    // Budget settings
    getBudgetSettings: build.query<BudgetSetting[], void>({
      query: () => "finance/daily-expenses/budget",
      providesTags: ["BudgetSetting"],
    }),
    
    setBudgetLimit: build.mutation<
      BudgetSetting,
      { category: string; budgetLimit: number }
    >({
      query: (body) => ({
        url: "finance/daily-expenses/budget",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BudgetSetting", "DailyExpense"],
    }),
    
    deleteBudgetSetting: build.mutation<void, string>({
      query: (category) => ({
        url: `finance/daily-expenses/budget/${category}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BudgetSetting", "DailyExpense"],
    }),
  }),
});

export const {
  // User hooks
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useRegisterUserMutation,
  useChangePasswordMutation,

  useGetFinancialSummaryQuery,
  useGetEarnedIncomesQuery,
  useCreateEarnedIncomeMutation,
  useUpdateEarnedIncomeMutation,
  useDeleteEarnedIncomeMutation,
  useGetPassiveIncomesQuery,
  useCreatePassiveIncomeMutation,
  useUpdatePassiveIncomeMutation,
  useDeletePassiveIncomeMutation,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
   useGetAssetsQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useGetLiabilitiesQuery,
  useCreateLiabilityMutation,
  useUpdateLiabilityMutation,
  useDeleteLiabilityMutation,
  useGetExpenseCategoriesQuery,
  useGetDailyExpensesQuery,
  useGetDailyExpenseByIdQuery,
  useCreateDailyExpenseMutation,
  useUpdateDailyExpenseMutation,
  useDeleteDailyExpenseMutation,
  useGetRemainingAmountQuery,
  useGetAllRemainingAmountsQuery,
  useGetBudgetSettingsQuery,
  useSetBudgetLimitMutation,
  useDeleteBudgetSettingMutation,
} = api;
