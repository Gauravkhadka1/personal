"use client";

import React, { useState, useEffect } from "react";
import {
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useGetLessonCategoriesQuery,
  Lesson,
} from "@/state/api";
import { X, Upload } from "lucide-react";
import toast from "react-hot-toast";

interface LessonFormProps {
  lesson?: Lesson | null;
  onClose: () => void;
  onSuccess: () => void;
}

const LessonForm = ({ lesson, onClose, onSuccess }: LessonFormProps) => {
  const [createLesson] = useCreateLessonMutation();
  const [updateLesson] = useUpdateLessonMutation();
  const { data: categories } = useGetLessonCategoriesQuery();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    contentType: "TEXT" as "TEXT" | "IMAGE" | "TEXT_IMAGE",
    imageUrl: "",
    categoryId: "",
  });

  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        content: lesson.content || "",
        contentType: lesson.contentType,
        imageUrl: lesson.imageUrl || "",
        categoryId: lesson.categoryId,
      });
      setImagePreview(lesson.imageUrl || "");
    }
  }, [lesson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.categoryId) {
      toast.error("Title and category are required");
      return;
    }

    if (formData.contentType === "TEXT" && !formData.content) {
      toast.error("Content is required for text lessons");
      return;
    }

    if (formData.contentType === "IMAGE" && !formData.imageUrl) {
      toast.error("Image URL is required for image lessons");
      return;
    }

    if (formData.contentType === "TEXT_IMAGE" && (!formData.content || !formData.imageUrl)) {
      toast.error("Both content and image URL are required for text-image lessons");
      return;
    }

    try {
      if (lesson) {
        await updateLesson({
          id: lesson.id,
          data: formData,
        }).unwrap();
        toast.success("Lesson updated successfully");
      } else {
        await createLesson(formData).unwrap();
        toast.success("Lesson created successfully");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.data?.message || "Operation failed");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload to a server and get a URL
      // For demo, we'll create a local preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFormData({ ...formData, imageUrl: previewUrl });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {lesson ? "Edit Lesson" : "Create Lesson"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a category</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Type *
            </label>
            <select
              value={formData.contentType}
              onChange={(e) => setFormData({ ...formData, contentType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TEXT">Text Only</option>
              <option value="IMAGE">Image Only</option>
              <option value="TEXT_IMAGE">Text & Image</option>
            </select>
          </div>

          {(formData.contentType === "TEXT" || formData.contentType === "TEXT_IMAGE") && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter lesson content..."
              />
            </div>
          )}

          {(formData.contentType === "IMAGE" || formData.contentType === "TEXT_IMAGE") && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <div className="mb-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                    </div>
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  )}
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={(e) => {
                  setFormData({ ...formData, imageUrl: e.target.value });
                  setImagePreview(e.target.value);
                }}
                placeholder="Or enter image URL"
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors"
            >
              {lesson ? "Update Lesson" : "Create Lesson"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonForm;