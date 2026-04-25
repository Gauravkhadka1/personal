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

export interface PolicyCategory {
  id: number;
  name: string;
  description?: string;
  policies?: Policy[];
  createdAt: string;
  updatedAt: string;
}

export interface Policy {
  id: number;
  content: string;
  categoryId: number;
  category?: PolicyCategory;
  version: number;
  isActive: boolean;
  createdBy: number;
  createdByUser?: {
    userId: number;
    username: string;
    email: string;
  };
  updatedBy?: number;
  updatedByUser?: {
    userId: number;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    // Add this to your second API's prepareHeaders function to debug
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  reducerPath: "api",
  tagTypes: ["Users", "PolicyCategories", "Policies"],
  endpoints: (build) => ({
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
        url: `users/role/${userId}`, // Match backend route
        method: "PUT", // Change to PUT
        body: { role },
      }),
      invalidatesTags: ["Users"],
    }),

    // Policy Category Endpoints
    getCategories: build.query<PolicyCategory[], void>({
      query: () => "policies/categories",
      providesTags: ["PolicyCategories"],
    }),
    createCategory: build.mutation<
      PolicyCategory,
      { name: string; description?: string }
    >({
      query: (body) => ({
        url: "policies/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PolicyCategories"],
    }),
    updateCategory: build.mutation<
      PolicyCategory,
      { id: number; name: string; description?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `policies/categories/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PolicyCategories"],
    }),
    deleteCategory: build.mutation<void, number>({
      query: (id) => ({
        url: `policies/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PolicyCategories", "Policies"],
    }),

    getPolicies: build.query<Policy[], { categoryId?: number } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params && params.categoryId) {
          queryParams.append("categoryId", params.categoryId.toString());
        }
        return `policies/policies?${queryParams.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Policies" as const, id })),
              { type: "Policies", id: "LIST" },
            ]
          : [{ type: "Policies", id: "LIST" }],
    }),

    getPolicyById: build.query<Policy, number>({
      query: (id) => `policies/policies/${id}`,
      providesTags: (result, error, id) => [{ type: "Policies", id }],
    }),

    createPolicy: build.mutation<
      Policy,
      { content: string; categoryId: number }
    >({
      query: (body) => ({
        url: "policies/policies",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Policies", "PolicyCategories"],
    }),

    updatePolicy: build.mutation<
      Policy,
      { id: number; content: string; categoryId: number }
    >({
      query: ({ id, ...body }) => ({
        url: `policies/policies/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Policies", id }],
    }),

    deletePolicy: build.mutation<void, number>({
      query: (id) => ({
        url: `policies/policies/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Policies", "PolicyCategories"],
    }),

    // Add these to your API slice
    reorderCategories: build.mutation<void, { categoryIds: number[] }>({
      query: (body) => ({
        url: "policies/categories/reorder",
        method: "POST",
        body,
      }),
      invalidatesTags: ["PolicyCategories"],
    }),

    reorderPolicies: build.mutation<
      void,
      { categoryId: number; policyIds: number[] }
    >({
      query: (body) => ({
        url: "policies/policies/reorder",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Policies"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useRegisterUserMutation,
  useChangePasswordMutation,

  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetPoliciesQuery,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
  useDeletePolicyMutation,
  useReorderCategoriesMutation,
  useReorderPoliciesMutation,
} = api;
