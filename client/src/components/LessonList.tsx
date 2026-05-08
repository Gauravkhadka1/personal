"use client";

import React, { useState } from "react";
import {
  useGetLessonsQuery,
  useDeleteLessonMutation,
  Lesson,
  useGetLessonCategoriesQuery,
} from "@/state/api";
import { Edit2, Trash2, Eye, Plus, Image, FileText, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import LessonForm from "./LessonForm";
import LessonViewer from "./LessonViewer";

const LessonList = () => {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [contentType, setContentType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);

  const { data: lessonsData, isLoading, refetch } = useGetLessonsQuery({
    page,
    limit: 10,
    categoryId: selectedCategory || undefined,
    contentType: contentType || undefined,
    search: search || undefined,
  });
  
  const { data: categories } = useGetLessonCategoriesQuery();
  const [deleteLesson] = useDeleteLessonMutation();

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this lesson?")) {
      try {
        await deleteLesson(id).unwrap();
        toast.success("Lesson deleted successfully");
        refetch();
      } catch (error: any) {
        toast.error(error.data?.message || "Delete failed");
      }
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "TEXT":
        return <FileText size={16} className="text-green-500" />;
      case "IMAGE":
        return <ImageIcon size={16} className="text-purple-500" />;
      case "TEXT_IMAGE":
        return <ImageIcon size={16} className="text-orange-500" />;
      default:
        return null;
    }
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
        <h1 className="text-2xl font-bold text-gray-800">Lessons</h1>
        <button
          onClick={() => {
            setEditingLesson(null);
            setIsFormOpen(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Lesson
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Search lessons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="TEXT">Text Only</option>
          <option value="IMAGE">Image Only</option>
          <option value="TEXT_IMAGE">Text & Image</option>
        </select>
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessonsData?.data.map((lesson) => (
          <div
            key={lesson.id}
            className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
          >
            {lesson.imageUrl && (
              <div className="h-48 overflow-hidden">
                <img
                  src={lesson.imageUrl}
                  alt={lesson.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-800 flex-1">
                  {lesson.title}
                </h3>
                <div className="flex gap-2 ml-2">
                  <button
                    onClick={() => setViewingLesson(lesson)}
                    className="text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingLesson(lesson);
                      setIsFormOpen(true);
                    }}
                    className="text-gray-500 hover:text-green-500 transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(lesson.id)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {lesson.category && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                  {getContentTypeIcon(lesson.contentType)}
                  {lesson.category.name}
                </span>
              )}
              {lesson.content && (
                <p className="text-gray-600 text-sm mt-2 line-clamp-3">
                  {lesson.content}
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {new Date(lesson.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {lessonsData?.pagination && lessonsData.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {page} of {lessonsData.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === lessonsData.pagination.totalPages}
            className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Lesson Form Modal */}
      {isFormOpen && (
        <LessonForm
          lesson={editingLesson}
          onClose={() => {
            setIsFormOpen(false);
            setEditingLesson(null);
          }}
          onSuccess={() => {
            refetch();
            setIsFormOpen(false);
            setEditingLesson(null);
          }}
        />
      )}

      {/* Lesson Viewer Modal */}
      {viewingLesson && (
        <LessonViewer
          lesson={viewingLesson}
          onClose={() => setViewingLesson(null)}
        />
      )}
    </div>
  );
};

export default LessonList;