"use client";

import React, { useState } from "react";
import {
  useGetLessonCategoriesQuery,
  useCreateLessonCategoryMutation,
  useUpdateLessonCategoryMutation,
  useDeleteLessonCategoryMutation,
  LessonCategory,
} from "@/state/api";
import { Plus, Edit2, Trash2, X, Check, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

const LessonCategories = () => {
  const { data: categories, isLoading, refetch } = useGetLessonCategoriesQuery();
  const [createCategory] = useCreateLessonCategoryMutation();
  const [updateCategory] = useUpdateLessonCategoryMutation();
  const [deleteCategory] = useDeleteLessonCategoryMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<LessonCategory | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory.id, ...formData }).unwrap();
        toast.success("Category updated successfully");
      } else {
        await createCategory(formData).unwrap();
        toast.success("Category created successfully");
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: "", description: "" });
      refetch();
    } catch (error: any) {
      toast.error(error.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string, lessonCount: number) => {
    if (lessonCount > 0) {
      toast.error(`Cannot delete category with ${lessonCount} lessons. Delete or reassign lessons first.`);
      return;
    }
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(id).unwrap();
        toast.success("Category deleted successfully");
        refetch();
      } catch (error: any) {
        toast.error(error.data?.message || "Delete failed");
      }
    }
  };

  const handleEdit = (category: LessonCategory) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || "" });
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Lesson Categories</h1>
        <button
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: "", description: "" });
            setIsModalOpen(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-blue-500" size={24} />
                  <h3 className="text-lg font-semibold text-gray-800">
                    {category.name}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id, category.lessonCount)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {category.description && (
                <p className="text-gray-600 text-sm mb-4">{category.description}</p>
              )}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  Created: {new Date(category.createdAt).toLocaleDateString()}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {category.lessonCount} {category.lessonCount === 1 ? "Lesson" : "Lessons"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingCategory ? "Edit Category" : "Create Category"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCategory(null);
                  setFormData({ name: "", description: "" });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  {editingCategory ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCategory(null);
                    setFormData({ name: "", description: "" });
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonCategories;