// client/src/components/DraggablePolicyList.tsx

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
import { SortablePolicyCard } from "./SortablePolicyCard";

interface DraggablePolicyListProps {
  policies: any[];
  onReorder: (policyIds: number[]) => void;
  onEditPolicy: (policy: any) => void;
  onDeletePolicy: (id: number) => void;
  onViewPolicy: (policy: any) => void;
  isAdmin: boolean;
}

export const DraggablePolicyList: React.FC<DraggablePolicyListProps> = ({
  policies,
  onReorder,
  onEditPolicy,
  onDeletePolicy,
  onViewPolicy,
  isAdmin,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Prevents accidental drag when clicking
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = policies.findIndex((item) => item.id === active.id);
      const newIndex = policies.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(policies, oldIndex, newIndex);
      onReorder(newOrder.map((item) => item.id));
    }
  };

  if (!policies.length) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={policies.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {policies.map((policy) => (
            <SortablePolicyCard
              key={policy.id}
              policy={policy}
              onEdit={() => onEditPolicy(policy)}
              onDelete={() => onDeletePolicy(policy.id)}
              onView={() => onViewPolicy(policy)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};