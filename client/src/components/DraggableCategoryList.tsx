// client/src/components/DraggableCategoryList.tsx
"use client";

import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCategoryCard } from "./SortableCategoryCard";

interface DraggableCategoryListProps {
  categories: any[];
  selectedCategoryId: number | null;
  onCategoryChange: (categoryId: number) => void;
  onReorder: (categoryIds: number[]) => void;
  onEditCategory: (category: any) => void;
  onDeleteCategory: (id: number, hasPolicies: boolean) => void;
  isAdmin: boolean;
}

export const DraggableCategoryList: React.FC<DraggableCategoryListProps> = ({
  categories,
  selectedCategoryId,
  onCategoryChange,
  onReorder,
  onEditCategory,
  onDeleteCategory,
  isAdmin,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((item) => item.id === active.id);
      const newIndex = categories.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      onReorder(newOrder.map((item) => item.id));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={categories.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <SortableCategoryCard
              key={category.id}
              category={category}
              isSelected={selectedCategoryId === category.id}
              onSelect={() => onCategoryChange(category.id)}
              onEdit={() => onEditCategory(category)}
              onDelete={() =>
                onDeleteCategory(category.id, (category.policies?.length || 0) > 0)
              }
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};