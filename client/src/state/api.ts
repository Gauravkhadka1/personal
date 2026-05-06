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
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface PassiveIncome {
  id: string;
  name: string;
  amount: number;
  userId: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  amount: number;
  userId: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  value: number;
  userId: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Liability {
  id: string;
  name: string;
  value: number;
  userId: number;
  date: string;
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
    currentCash: number;
    totalDailyExpenses: number;
  };
  details: {
    earnedIncomes: EarnedIncome[];
    passiveIncomes: PassiveIncome[];
    expenseCategories: ExpenseCategory[];
    assets: Asset[];
    liabilities: Liability[];
  };
}

export interface DailyExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  expenseCategoryId: string;
  expenseCategory: {
    id: string;
    name: string;
    amount: number;
  };
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategorySummary {
  id: string;
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  percentageUsed: string;
  status: "overspent" | "warning" | "good";
}

export interface NepaliFilter {
  nepaliYear?: number;
  nepaliMonth?: number;
  startDate?: string;
  endDate?: string;
}

export interface AvailableFilters {
  years: number[];
  months: { value: number; label: string }[];
}

export interface FilteredResponse<T> {
  data: T;
  filter: {
    nepaliYear: number | null;
    nepaliMonth: number | null;
    nepaliMonthName: string | null;
    dateRange: {
      start: string;
      end: string;
    } | null;
  };
  pagination?: any;
  categoryTotals?: any;
  summary?: any;
}

export interface ExpenseCategoryWithBudget {
  id: string;
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: "overspent" | "warning" | "good";
  date: string;
}

export interface GroupedDailyExpenses {
  nepaliDate: string;
  englishDate: string;
  expenses: DailyExpense[];
  totalAmount: number;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
  workoutDayId: string;
  workoutLogs?: WorkoutLog[];
}

export interface WorkoutDay {
  id: string;
  dayName: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutLog {
  id: string;
  date: string;
  sets: number;
  reps: number;
  weight: number;
  completed: boolean;
  notes?: string;
  exerciseId: string;
  exercise: WorkoutExercise & { workoutDay: WorkoutDay };
}

export interface WorkoutReport {
  summary: {
    totalWorkouts: number;
    totalSets: number;
    totalReps: number;
    totalVolume: number;
  };
  byMuscleGroup: Array<{
    muscleGroup: string;
    totalSets: number;
    totalVolume: number;
    exercises: string[];
  }>;
  byDayOfWeek: Array<{
    dayName: string;
    totalSets: number;
    totalVolume: number;
  }>;
  recentLogs: WorkoutLog[];
}

// Add these to the api endpoints

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
    "ExpenseCategory",
    "Asset",
    "Liability",
    "DailyExpense",
    "ExpenseCategorySummary",
    "AvailableFilters",
    "WorkoutLogs",
    "Workout",
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

       // ============ FINANCE ENDPOINTS ============

    // Available Filters
    getAvailableFilters: build.query<AvailableFilters, void>({
      query: () => "finance/available-filters",
      providesTags: ["AvailableFilters"],
    }),

    // Financial Summary with Nepali filter
    getFinancialSummary: build.query<
      FilteredResponse<FinancialSummary>,
      NepaliFilter
    >({
      query: (params) => ({
        url: "finance/summary",
        params: params || {},
      }),
      providesTags: [
        "EarnedIncome",
        "PassiveIncome",
        "ExpenseCategory",
        "Liability",
      ],
    }),

    // Earned Income
    getEarnedIncomes: build.query<
      FilteredResponse<EarnedIncome[]> & { pagination: any },
      NepaliFilter
    >({
      query: (params) => ({
        url: "finance/earned-income",
        params: params || {},
      }),
      providesTags: ["EarnedIncome"],
    }),
    createEarnedIncome: build.mutation<
      EarnedIncome,
      { name: string; amount: number; date?: string }
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
      { id: string; name: string; amount: number; date?: string }
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
    getPassiveIncomes: build.query<
      FilteredResponse<PassiveIncome[]> & { pagination: any },
      NepaliFilter
    >({
      query: (params) => ({
        url: "finance/passive-income",
        params: params || {},
      }),
      providesTags: ["PassiveIncome"],
    }),
    createPassiveIncome: build.mutation<
      PassiveIncome,
      { name: string; amount: number; date?: string }
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
      { id: string; name: string; amount: number; date?: string }
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

    // Expense Category
    // Updated getExpenseCategories query
    getExpenseCategories: build.query<
      {
        data: ExpenseCategoryWithBudget[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
        filter: any;
      },
      NepaliFilter
    >({
      query: (params) => ({
        url: "finance/expense-category",
        params: params || {},
      }),
      providesTags: ["ExpenseCategory"],
    }),
    createExpenseCategory: build.mutation<
      ExpenseCategory,
      { name: string; amount: number; date?: string }
    >({
      query: (body) => ({
        url: "finance/expense-category",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ExpenseCategory"],
    }),
    updateExpenseCategory: build.mutation<
      ExpenseCategory,
      { id: string; name: string; amount: number; date?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `finance/expense-category/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ExpenseCategory"],
    }),
    deleteExpenseCategory: build.mutation<void, string>({
      query: (id) => ({
        url: `finance/expense-category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ExpenseCategory"],
    }),

    // Asset
    getAssets: build.query<Asset[], void>({
      query: () => "finance/asset",
      providesTags: ["Asset"],
    }),
    createAsset: build.mutation<
      Asset,
      { name: string; value: number; date?: string }
    >({
      query: (body) => ({
        url: "finance/asset",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Asset"],
    }),
    updateAsset: build.mutation<
      Asset,
      { id: string; name: string; value: number; date?: string }
    >({
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
    createLiability: build.mutation<
      Liability,
      { name: string; value: number; date?: string }
    >({
      query: (body) => ({
        url: "finance/liability",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Liability"],
    }),
    updateLiability: build.mutation<
      Liability,
      { id: string; name: string; value: number; date?: string }
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

    getDailyExpenses: build.query<
      FilteredResponse<DailyExpense[]> & {
        pagination: any;
        categoryTotals: any[];
        groupedByNepaliDate: GroupedDailyExpenses[];
      },
      NepaliFilter
    >({
      query: (params) => ({
        url: "finance/daily-expense",
        params: params || {},
      }),
      providesTags: ["DailyExpense"],
    }),

    createDailyExpense: build.mutation<
      DailyExpense,
      {
        description: string;
        amount: number;
        date: string;
        expenseCategoryId: string;
      }
    >({
      query: (body) => ({
        url: "finance/daily-expense",
        method: "POST",
        body,
      }),
      invalidatesTags: ["DailyExpense", "ExpenseCategorySummary"],
    }),

    updateDailyExpense: build.mutation<
      DailyExpense,
      {
        id: string;
        description: string;
        amount: number;
        date: string;
        expenseCategoryId: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `finance/daily-expense/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["DailyExpense", "ExpenseCategorySummary"],
    }),

    deleteDailyExpense: build.mutation<void, string>({
      query: (id) => ({
        url: `finance/daily-expense/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DailyExpense", "ExpenseCategorySummary"],
    }),

    getExpenseCategorySummary: build.query<
      FilteredResponse<{
        data: ExpenseCategorySummary[];
        summary: { totalBudget: number; totalSpent: number };
      }>,
      NepaliFilter
    >({
      query: (params) => ({
        url: "finance/expense-category-summary",
        params: params || {},
      }),
      providesTags: ["ExpenseCategorySummary"],
    }),

    getExpenseCategoriesList: build.query<
      { id: string; name: string; amount: number }[],
      void
    >({
      query: () => "daily-expenses/categories",
      providesTags: ["ExpenseCategory"],
    }),


   // ============================== WORKOUT ENDPOINTS ================================================================
    createWorkoutDay: build.mutation<WorkoutDay, { dayName: string }>({
      query: (body) => ({
        url: "workout/day",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Workout"],
    }),

    getWorkoutPlan: build.query<{ data: WorkoutDay[] }, void>({
      query: () => "workout/plan",
      providesTags: ["Workout"],
    }),

    getWorkoutByDay: build.query<{ data: WorkoutDay }, string>({
      query: (dayName) => `workout/day/${dayName}`,
      providesTags: ["Workout"],
    }),

    addExerciseToDay: build.mutation<
      WorkoutExercise,
      {
        dayId: string;
        name: string;
        muscleGroup: string;
        defaultSets?: number;
        defaultReps?: number;
        defaultWeight?: number;
      }
    >({
      query: ({ dayId, ...body }) => ({
        url: `workout/day/${dayId}/exercise`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Workout"],
    }),

    updateExercise: build.mutation<
      WorkoutExercise,
      {
        id: string;
        name?: string;
        muscleGroup?: string;
        defaultSets?: number;
        defaultReps?: number;
        defaultWeight?: number;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `workout/exercise/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Workout"],
    }),

    deleteExercise: build.mutation<void, string>({
      query: (id) => ({
        url: `workout/exercise/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Workout"],
    }),

    logWorkout: build.mutation<
      WorkoutLog,
      {
        exerciseId: string;
        sets: number;
        reps: number;
        weight: number;
        notes?: string;
        date?: string;
      }
    >({
      query: ({ exerciseId, ...body }) => ({
        url: `workout/log/${exerciseId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Workout", "WorkoutLogs"],
    }),

    getWorkoutLogs: build.query<
      { data: WorkoutLog[] },
      { exerciseId?: string; date?: string; startDate?: string; endDate?: string }
    >({
      query: (params) => ({
        url: "workout/logs",
        params,
      }),
      providesTags: ["WorkoutLogs"],
    }),

    getWorkoutReport: build.query<
      { data: WorkoutReport },
      { startDate?: string; endDate?: string }
    >({
      query: (params) => ({
        url: "workout/report",
        params,
      }),
      providesTags: ["WorkoutLogs"],
    }),

    updateWorkoutLog: build.mutation<
      WorkoutLog,
      {
        id: string;
        sets?: number;
        reps?: number;
        weight?: number;
        completed?: boolean;
        notes?: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `workout/log/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["WorkoutLogs"],
    }),

    deleteWorkoutLog: build.mutation<void, string>({
      query: (id) => ({
        url: `workout/log/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WorkoutLogs"],
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

  // Filter hooks
  useGetAvailableFiltersQuery,

  // Financial hooks
  useGetFinancialSummaryQuery,
  useGetEarnedIncomesQuery,
  useCreateEarnedIncomeMutation,
  useUpdateEarnedIncomeMutation,
  useDeleteEarnedIncomeMutation,
  useGetPassiveIncomesQuery,
  useCreatePassiveIncomeMutation,
  useUpdatePassiveIncomeMutation,
  useDeletePassiveIncomeMutation,

  // Expense Category hooks
  useGetExpenseCategoriesQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,

  // Asset hooks
  useGetAssetsQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,

  // Liability hooks
  useGetLiabilitiesQuery,
  useCreateLiabilityMutation,
  useUpdateLiabilityMutation,
  useDeleteLiabilityMutation,

  // Daily Expense hooks
  useGetDailyExpensesQuery,
  useCreateDailyExpenseMutation,
  useUpdateDailyExpenseMutation,
  useDeleteDailyExpenseMutation,
  useGetExpenseCategorySummaryQuery,
  useGetExpenseCategoriesListQuery,

  useCreateWorkoutDayMutation,
  useAddExerciseToDayMutation,
  useUpdateExerciseMutation,
  useDeleteExerciseMutation,
  useLogWorkoutMutation,
  useGetWorkoutLogsQuery,
  useGetWorkoutReportQuery,
  useUpdateWorkoutLogMutation,
  useDeleteWorkoutLogMutation,
  useGetWorkoutPlanQuery,
} = api;
