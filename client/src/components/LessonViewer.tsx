"use client";

import React from "react";
import { Lesson } from "@/state/api";
import { X, Calendar, BookOpen } from "lucide-react";

interface LessonViewerProps {
  lesson: Lesson;
  onClose: () => void;
}

const LessonViewer = ({ lesson, onClose }: LessonViewerProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{lesson.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {lesson.category && (
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-blue-500" />
            <span className="text-sm text-gray-600">{lesson.category.name}</span>
            <span className="text-sm text-gray-400">•</span>
            <Calendar size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              {new Date(lesson.createdAt).toLocaleDateString()}
            </span>
          </div>
        )}

        {lesson.imageUrl && (
          <div className="mb-6">
            <img
              src={lesson.imageUrl}
              alt={lesson.title}
              className="w-full rounded-lg shadow-md"
            />
          </div>
        )}

        {lesson.content && (
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {lesson.content}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
          Last updated: {new Date(lesson.updatedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;