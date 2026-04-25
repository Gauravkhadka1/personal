// client/src/components/SortablePolicyCard.tsx

"use client";

import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2 } from "lucide-react";

interface SortablePolicyCardProps {
  policy: any;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
  isAdmin: boolean;
}

export const SortablePolicyCard: React.FC<SortablePolicyCardProps> = ({
  policy,
  onEdit,
  onDelete,
  onView,
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
  } = useSortable({ id: policy.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-xl dark:border-gray-700 dark:bg-secondary ${
        isDragging ? "shadow-2xl" : ""
      }`}
      onMouseEnter={() => setIsHoveringDragArea(true)}
      onMouseLeave={() => setIsHoveringDragArea(false)}
    >
      <div className="flex items-start">
        {/* Drag Handle - Only visible when hovering outside content area */}
        {isAdmin && isHoveringDragArea && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab p-4 text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 px-4 py-3">
          <div className="mb-4 flex items-center justify-between">
            <div
              className="text-base max-w-none flex-1 cursor-pointer text-gray-800 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: policy.content }}
              onClick={onView}
            />
            <div className="ml-4 flex space-x-1">
              {isAdmin && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="text-gray-600 opacity-0 transition-opacity duration-200 hover:text-gray-700 group-hover:opacity-100 dark:text-gray-400"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="text-red-600 opacity-0 transition-opacity duration-200 hover:text-red-700 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};