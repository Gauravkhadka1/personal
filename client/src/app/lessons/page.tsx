"use client";

import React, { useState } from "react";
import LessonCategories from "@/components/LessonCategories";
import LessonList from "@/components/LessonList";
import { BookOpen, FolderOpen } from "lucide-react";

type Props = {};

const Lessons = (props: Props) => {
  const [activeTab, setActiveTab] = useState<"categories" | "lessons">("lessons");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("lessons")}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                activeTab === "lessons"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <BookOpen size={20} />
              <span className="font-medium">Lessons</span>
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-colors ${
                activeTab === "categories"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <FolderOpen size={20} />
              <span className="font-medium">Categories</span>
            </button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        {activeTab === "categories" ? <LessonCategories /> : <LessonList />}
      </div>
    </div>
  );
};

export default Lessons;