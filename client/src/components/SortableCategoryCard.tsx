// client/src/components/SortableCategoryCard.tsx
"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

interface SortableCategoryCardProps {
  category: any;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}

export const SortableCategoryCard: React.FC<SortableCategoryCardProps> = ({
  category,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  isAdmin,
}) => {
  const [isHoveringDragArea, setIsHoveringDragArea] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border bg-white transition-all duration-200 dark:bg-secondary ${
        isSelected
          ? "border-blue-500 shadow-md ring-2 ring-blue-500/20"
          : "border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-700"
      } ${isDragging ? "shadow-xl" : ""}`}
      onMouseEnter={() => setIsHoveringDragArea(true)}
      onMouseLeave={() => setIsHoveringDragArea(false)}
    >
      <div className="flex items-start">
        {/* Drag Handle - Only visible when hovering outside content area */}
        {isAdmin && isHoveringDragArea && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab p-3 text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 px-4 py-3" onClick={onSelect}>
          <div className="flex items-start justify-between">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white cursor-pointer">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mb-2 line-clamp-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
                    {category.description}
                  </p>
                )}
              </div>

              <Badge variant="secondary" className="cursor-pointer">
                {category.policies?.length || 0} Policies
              </Badge>
            </div>

            {isAdmin && (
              <div className="flex space-x-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};