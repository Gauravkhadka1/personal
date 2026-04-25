// client/src/app/policies/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import {
  useGetCategoriesQuery,
  useGetPoliciesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
  useDeletePolicyMutation,
  useReorderCategoriesMutation,
  useReorderPoliciesMutation,
} from "@/state/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderTree } from "lucide-react";
import { toast } from "react-hot-toast";
import withRoleAuth from "../../hoc/withRoleAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/RichTextEditor";
import { DraggableCategoryList } from "@/components/DraggableCategoryList";
import { DraggablePolicyList } from "@/components/DraggablePolicyList";

const Policies = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [viewPolicyDialogOpen, setViewPolicyDialogOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // Category CRUD states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  // Policy CRUD states
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [policyContent, setPolicyContent] = useState("");
  const [policyCategoryId, setPolicyCategoryId] = useState<number | null>(null);

  // Fetch categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();

  // Fetch policies based on selected category
  const {
    data: policies,
    isLoading: policiesLoading,
    refetch: refetchPolicies,
  } = useGetPoliciesQuery(
    selectedCategoryId ? { categoryId: selectedCategoryId } : undefined,
  );

  // Category mutations
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [reorderCategories] = useReorderCategoriesMutation();

  // Policy mutations
  const [createPolicy] = useCreatePolicyMutation();
  const [updatePolicy] = useUpdatePolicyMutation();
  const [deletePolicy] = useDeletePolicyMutation();
  const [reorderPolicies] = useReorderPoliciesMutation();

  // Set initial category when categories load
  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
    if (categories) {
      setCategoriesList(categories);
    }
  }, [categories, selectedCategoryId]);

  // Refetch policies when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      refetchPolicies();
    }
  }, [selectedCategoryId, refetchPolicies]);

  const handleViewPolicy = (policy: any) => {
    setSelectedPolicy(policy);
    setViewPolicyDialogOpen(true);
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
  };

  // Category CRUD Handlers
  const handleOpenCategoryDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
      setCategoryDescription(category.description || "");
    } else {
      setEditingCategory(null);
      setCategoryName("");
      setCategoryDescription("");
    }
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory({
          id: editingCategory.id,
          name: categoryName,
          description: categoryDescription,
        }).unwrap();
        toast.success("Category updated successfully");
      } else {
        await createCategory({
          name: categoryName,
          description: categoryDescription,
        }).unwrap();
        toast.success("Category created successfully");
      }
      setCategoryDialogOpen(false);
      refetchCategories();
      // Reset selected category if needed
      if (!editingCategory) {
        setSelectedCategoryId(null);
      }
    } catch (error: any) {
      toast.error(error.data?.message || "Error saving category");
    }
  };

  const handleDeleteCategory = async (id: number, hasPolicies: boolean) => {
    if (hasPolicies) {
      toast.error(
        "Cannot delete category with existing policies. Delete policies first.",
      );
      return;
    }

    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(id).unwrap();
        toast.success("Category deleted successfully");
        refetchCategories();
        if (selectedCategoryId === id) {
          setSelectedCategoryId(categories?.[0]?.id || null);
        }
      } catch (error: any) {
        toast.error(error.data?.message || "Error deleting category");
      }
    }
  };

  const handleReorderCategories = async (categoryIds: number[]) => {
    try {
      await reorderCategories({ categoryIds }).unwrap();
      toast.success("Categories reordered successfully");
      refetchCategories();
    } catch (error: any) {
      toast.error(error.data?.message || "Error reordering categories");
    }
  };

  // Policy CRUD Handlers
  const handleOpenPolicyDialog = (policy?: any) => {
    if (policy) {
      setEditingPolicy(policy);
      setPolicyContent(policy.content);
      setPolicyCategoryId(policy.categoryId);
    } else {
      setEditingPolicy(null);
      setPolicyContent("");
      setPolicyCategoryId(selectedCategoryId);
    }
    setPolicyDialogOpen(true);
  };

  const handleSavePolicy = async () => {
    if (!policyContent.trim()) {
      toast.error("Policy content is required");
      return;
    }
    if (!policyCategoryId) {
      toast.error("Please select a category");
      return;
    }

    try {
      if (editingPolicy) {
        await updatePolicy({
          id: editingPolicy.id,
          content: policyContent,
          categoryId: policyCategoryId,
        }).unwrap();
        toast.success("Policy updated successfully");
      } else {
        await createPolicy({
          content: policyContent,
          categoryId: policyCategoryId,
        }).unwrap();
        toast.success("Policy created successfully");
      }
      setPolicyDialogOpen(false);
      refetchPolicies();
      refetchCategories();
    } catch (error: any) {
      toast.error(error.data?.message || "Error saving policy");
    }
  };

  const handleDeletePolicy = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this policy?")) {
      try {
        await deletePolicy(id).unwrap();
        toast.success("Policy deleted successfully");
        refetchPolicies();
        refetchCategories();
      } catch (error: any) {
        toast.error(error.data?.message || "Error deleting policy");
      }
    }
  };

  const handleReorderPolicies = async (policyIds: number[]) => {
    if (!selectedCategoryId) return;
    try {
      await reorderPolicies({
        categoryId: selectedCategoryId,
        policyIds,
      }).unwrap();
      toast.success("Policies reordered successfully");
      refetchPolicies();
    } catch (error: any) {
      toast.error(error.data?.message || "Error reordering policies");
    }
  };

  if (categoriesLoading || policiesLoading) {
    return (
      <div className="flex w-full flex-col p-8">
        <div className="mb-6">
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col dark:bg-primary">
      <div className="flex-1 p-6 md:p-8">
        {/* Categories Section */}
        <div className="mb-8 ">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Categories
            </h2>
            {isAdmin && (
              <Button onClick={() => handleOpenCategoryDialog()} size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="mr-1 h-4 w-4" />
                Add Category
              </Button>
            )}
          </div>

          {categoriesList.length > 0 ? (
            <DraggableCategoryList
              categories={categoriesList}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={handleCategoryChange}
              onReorder={handleReorderCategories}
              onEditCategory={handleOpenCategoryDialog}
              onDeleteCategory={handleDeleteCategory}
              isAdmin={isAdmin}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white py-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <FolderTree className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400">
                No categories found.
              </p>
              {isAdmin && (
                <Button
                  onClick={() => handleOpenCategoryDialog()}
                  variant="outline"
                  className="mt-3 bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Plus className="mr-1 h-4 w-4 " />
                  Create First Category
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Policies Section - Full Width */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Policies{" "}
              {selectedCategoryId &&
                categoriesList.find((c) => c.id === selectedCategoryId) &&
                `in ${categoriesList.find((c) => c.id === selectedCategoryId)?.name}`}
            </h2>
            {isAdmin && selectedCategoryId && (
              <Button onClick={() => handleOpenPolicyDialog()} size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="mr-1 h-4 w-4" />
                Add Policy
              </Button>
            )}
          </div>

          {policies && policies.length > 0 ? (
            <DraggablePolicyList
              policies={policies}
              onReorder={handleReorderPolicies}
              onEditPolicy={handleOpenPolicyDialog}
              onDeletePolicy={handleDeletePolicy}
              onViewPolicy={handleViewPolicy}
              isAdmin={isAdmin}
            />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <FolderTree className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-500 dark:text-gray-400">
                {selectedCategoryId
                  ? "No policies found in this category."
                  : "Select a category to view policies."}
              </p>
              {isAdmin && selectedCategoryId && (
                <Button
                  onClick={() => handleOpenPolicyDialog()}
                  variant="outline"
                  className="mt-3 bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Plus className="mr-1 h-4 w-4 " />
                  Create First Policy
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Dialog (Admin only) */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            <div>
              <Label htmlFor="categoryDescription">
                Description (Optional)
              </Label>
              <Textarea
                id="categoryDescription"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Enter category description"
                rows={3}
              />
            </div>
            <Button onClick={handleSaveCategory} className="w-full bg-blue-600 text-white hover:bg-blue-700">
              {editingCategory ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Policy Dialog (Admin only) */}
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? "Edit Policy" : "Create New Policy"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="policyCategory">Category *</Label>
              <select
                id="policyCategory"
                className="w-full rounded-md border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                value={policyCategoryId || ""}
                onChange={(e) =>
                  setPolicyCategoryId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                <option value="">Select a category</option>
                {categoriesList.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Policy Content *</Label>
              <RichTextEditor
                content={policyContent}
                onContentChange={setPolicyContent}
                placeholder="Write policy content here..."
              />
            </div>
            <Button onClick={handleSavePolicy} className="w-full bg-blue-600 text-white hover:bg-blue-700">
              {editingPolicy ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Policy Dialog */}
      <Dialog
        open={viewPolicyDialogOpen}
        onOpenChange={setViewPolicyDialogOpen}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>View Policy</DialogTitle>
          </DialogHeader>
          <div className="prose dark:prose-invert max-w-none">
            <RichTextEditor
              content={selectedPolicy?.content || ""}
              readOnly={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default withRoleAuth(Policies, ["ADMIN", "DESIGNER", "DEVELOPER", "INTERN"]);