import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Trash,
  GripVertical,
  Globe,
  Lock,
  ChevronDown,
  ChevronUp,
  Pencil,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useGetUserChecklistsQuery,
  useCreateChecklistMutation,
  useUpdateChecklistMutation,
  useDeleteChecklistMutation,
  useReorderChecklistsMutation,
  Checklist,
  ChecklistItem,
} from "@/state/api";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, TriangleAlert } from "lucide-react";

const ChecklistItemComponent: React.FC<{
  item: ChecklistItem;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onTextChange: (id: number, text: string) => void;
}> = ({ item, onToggle, onDelete, onTextChange }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [localText, setLocalText] = React.useState(item.text);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalText(e.target.value);
  };

  const handleSubmit = () => {
    if (localText !== item.text) {
      onTextChange(item.id, localText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-md bg-transparent px-2">
      <GripVertical className="h-4 w-4 cursor-move text-muted-foreground" />
      <Checkbox
        checked={item.completed}
        onCheckedChange={() => onToggle(item.id)}
        className="h-5 w-5 rounded-md"
      />
      <Input
        ref={inputRef}
        type="text"
        value={localText}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        className={`flex-1 border-none shadow-none focus-visible:ring-0 ${
          item.completed ? "text-muted-foreground line-through" : ""
        }`}
        placeholder="Checklist item"
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(item.id)}
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
};

const SortableChecklistItem: React.FC<{
  id: number;
  item: ChecklistItem;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
  onTextChange: (id: number, text: string) => void;
}> = ({ id, item, onToggle, onDelete, onTextChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(item.text);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = () => {
    if (editText !== item.text) {
      onTextChange(item.id, editText);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditText(item.text);
    }
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-2 rounded-md px-2">
        <GripVertical
          className="h-4 w-4 cursor-move text-muted-foreground"
          {...listeners}
        />
        <Checkbox
          checked={item.completed}
          onCheckedChange={() => onToggle(item.id)}
          className="h-5 w-5 rounded-md"
        />
        {isEditing ? (
          <Input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="flex-1"
            placeholder="Checklist item"
          />
        ) : (
          <span
            className={`flex-1 cursor-text ${
              item.completed ? "text-muted-foreground line-through" : ""
            }`}
            onClick={handleEdit}
          >
            {item.text || "Add item"}
          </span>
        )}
        {isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
            onClick={handleSave}
          >
            <Check className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600"
            onClick={handleEdit}
          >
            <Pencil className="h-2 w-2" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(item.id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Circular Progress Bar Component
const CircularProgress: React.FC<{ progress: number; size?: number }> = ({
  progress,
  size = 48,
}) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 transform">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-green-500 transition-all duration-300 ease-in-out"
        />
      </svg>
      <span className="absolute text-xs font-medium">
        {Math.round(progress)}%
      </span>
    </div>
  );
};

const SortableChecklist: React.FC<{
  id: number;
  checklist: Checklist;
  isCollapsed: boolean;
  onToggleCollapse: (id: number) => void;
  onTitleChange: (id: number, title: string) => void;
  onDelete: (id: number) => void;
  onAddItem: (id: number) => void;
  onToggleItem: (checklistId: number, itemId: number) => void;
  onDeleteItem: (checklistId: number, itemId: number) => void;
  onUpdateItemText: (checklistId: number, itemId: number, text: string) => void;
  children: React.ReactNode;
}> = ({
  id,
  checklist,
  isCollapsed,
  onToggleCollapse,
  onTitleChange,
  onDelete,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onUpdateItemText,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(checklist.title);
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
    setEditTitle(checklist.title);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const handleTitleSave = () => {
    if (editTitle !== checklist.title) {
      onTitleChange(checklist.id, editTitle);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
      setEditTitle(checklist.title);
    }
  };

  const [isAddingItem, setIsAddingItem] = useState<Record<number, boolean>>({});

  // Calculate progress
  const completedCount = checklist.items.filter((i) => i.completed).length;
  const totalCount = checklist.items.length;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="group relative p-4 transition-colors hover:bg-gray-50 dark:hover:bg-secondary">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex flex-1 items-center gap-2">
            <GripVertical
              className="h-4 w-4 cursor-move text-muted-foreground"
              {...listeners}
            />

            <div className="ml-1 flex items-center gap-4">
              {/* Circular Progress Bar with Task Counter */}
              <div className="mt-2 flex items-center gap-3">
                <CircularProgress progress={progressPercentage} size={42} />
              </div>
              <div className="flex items-center gap-2">
                {isEditingTitle ? (
                  <Input
                    ref={titleInputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleTitleSave}
                    className="w-full text-lg font-medium"
                  />
                ) : (
                  <div
                    className="flex cursor-text items-center gap-2"
                    onClick={handleTitleEdit}
                  >
                    <span className="text-base font-medium">
                      {checklist.title}
                    </span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  ({totalCount} tasks)
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mr-4 h-8 w-8 p-0 text-muted-foreground"
            onClick={() => onToggleCollapse(checklist.id)}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(checklist.id)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>

        {!isCollapsed && children}

        {!isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-muted-foreground"
            onClick={() => onAddItem(checklist.id)}
            disabled={isAddingItem[checklist.id]}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isAddingItem[checklist.id] ? "Adding..." : "Add Item"}
          </Button>
        )}
      </div>
    </div>
  );
};

const Checklists: React.FC<{ isPublic?: boolean }> = ({ isPublic = false }) => {
  const { user } = useAuth();
  const { data: checklistsData = [], refetch } = useGetUserChecklistsQuery(
    user?.userId || 0,
  );
  const [createChecklist] = useCreateChecklistMutation();
  const [updateChecklist] = useUpdateChecklistMutation();
  const [deleteChecklist] = useDeleteChecklistMutation();
  const [reorderChecklists] = useReorderChecklistsMutation();

  const [localChecklists, setLocalChecklists] = useState<Checklist[]>([]);
  const [collapsedChecklists, setCollapsedChecklists] = useState<
    Record<number, boolean>
  >({});
  const [activeId, setActiveId] = useState<number | null>(null);
  const [activeChecklistId, setActiveChecklistId] = useState<number | null>(
    null,
  );

  const [deleteChecklistDialogOpen, setDeleteChecklistDialogOpen] =
    useState(false);
  const [checklistToDelete, setChecklistToDelete] = useState<number | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const checklistSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setLocalChecklists(checklistsData);

    // Only initialize collapsed state for NEW checklists, don't reset existing ones
    setCollapsedChecklists((prev) => {
      const newState = { ...prev };
      checklistsData.forEach((checklist) => {
        if (newState[checklist.id] === undefined) {
          newState[checklist.id] = true; // Only set for new checklists
        }
      });
      return newState;
    });
  }, [checklistsData]);

  useEffect(() => {
    const storedCollapsed = localStorage.getItem("checklistsCollapsed");
    if (storedCollapsed) {
      setCollapsedChecklists(JSON.parse(storedCollapsed));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "checklistsCollapsed",
      JSON.stringify(collapsedChecklists),
    );
  }, [collapsedChecklists]);

  const toggleChecklistCollapse = (checklistId: number) => {
    setCollapsedChecklists((prev) => ({
      ...prev,
      [checklistId]: !prev[checklistId],
    }));
  };

  const [isAddingItem, setIsAddingItem] = useState<Record<number, boolean>>({});
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);

  const addNewChecklist = async () => {
    if (isAddingChecklist) return;

    setIsAddingChecklist(true);
    try {
      const newChecklist = await createChecklist({
        checklistData: {
          title: "New Checklist",
          items: [
            {
              text: "",
              completed: false,
              order: 0,
              id: Date.now(),
              checklistId: 0,
            },
          ],
        },
        endpointType: "private",
      }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to create checklist:", error);
    } finally {
      setIsAddingChecklist(false);
    }
  };

  const addItem = async (checklistId: number) => {
    if (isAddingItem[checklistId]) return;

    setIsAddingItem((prev) => ({ ...prev, [checklistId]: true }));
    const checklist = localChecklists.find((c) => c.id === checklistId);
    if (!checklist) return;

    const newItems = [
      ...checklist.items,
      {
        id: Date.now(),
        text: "",
        completed: false,
        order: checklist.items.length,
        checklistId,
      },
    ];

    try {
      await updateChecklist({
        id: checklistId,
        checklistData: { items: newItems },
      });
      refetch();
    } catch (error) {
      console.error("Failed to add item:", error);
    } finally {
      setIsAddingItem((prev) => ({ ...prev, [checklistId]: false }));
    }
  };

  const deleteItem = async (checklistId: number, itemId: number) => {
    const checklist = localChecklists.find((c) => c.id === checklistId);
    if (!checklist) return;

    const updatedItems = checklist.items
      .filter((item) => item.id !== itemId)
      .map((item, index) => ({ ...item, order: index }));

    try {
      await updateChecklist({
        id: checklistId,
        checklistData: { items: updatedItems },
      });
      refetch();
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const toggleItem = async (checklistId: number, itemId: number) => {
    const checklist = localChecklists.find((c) => c.id === checklistId);
    if (!checklist) return;

    const updatedItems = checklist.items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    );

    try {
      await updateChecklist({
        id: checklistId,
        checklistData: { items: updatedItems },
      });
      refetch();
    } catch (error) {
      console.error("Failed to toggle item:", error);
    }
  };

  const updateItemText = async (
    checklistId: number,
    itemId: number,
    text: string,
  ) => {
    setLocalChecklists((prev) =>
      prev.map((checklist) =>
        checklist.id === checklistId
          ? {
              ...checklist,
              items: checklist.items.map((item) =>
                item.id === itemId ? { ...item, text } : item,
              ),
            }
          : checklist,
      ),
    );

    try {
      await updateChecklist({
        id: checklistId,
        checklistData: {
          items:
            localChecklists
              .find((c) => c.id === checklistId)
              ?.items.map((item) =>
                item.id === itemId ? { ...item, text } : item,
              ) || [],
        },
      });
    } catch (error) {
      console.error("Failed to update item text:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as number);
    // Find which checklist this item belongs to
    const checklist = localChecklists.find((c) =>
      c.items.some((item) => item.id === active.id),
    );
    if (checklist) {
      setActiveChecklistId(checklist.id);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!activeChecklistId || !over || active.id === over.id) {
      setActiveId(null);
      setActiveChecklistId(null);
      return;
    }

    const checklist = localChecklists.find((c) => c.id === activeChecklistId);
    if (!checklist) return;

    const oldIndex = checklist.items.findIndex((item) => item.id === active.id);
    const newIndex = checklist.items.findIndex((item) => item.id === over.id);

    if (oldIndex !== newIndex) {
      const newItems = arrayMove(checklist.items, oldIndex, newIndex).map(
        (item, index) => ({ ...item, order: index }),
      );

      // Optimistic update
      setLocalChecklists((prev) =>
        prev.map((c) =>
          c.id === activeChecklistId ? { ...c, items: newItems } : c,
        ),
      );

      try {
        await updateChecklist({
          id: activeChecklistId,
          checklistData: { items: newItems },
        });
        refetch();
      } catch (error) {
        console.error("Failed to move item:", error);
        refetch(); // Revert optimistic update
      }
    }

    setActiveId(null);
    setActiveChecklistId(null);
  };

  const handleChecklistDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveChecklistId(active.id as number);
  };

  const handleChecklistDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveChecklistId(null);
      return;
    }

    const oldIndex = localChecklists.findIndex((c) => c.id === active.id);
    const newIndex = localChecklists.findIndex((c) => c.id === over.id);

    if (oldIndex !== newIndex) {
      const newChecklists = arrayMove(localChecklists, oldIndex, newIndex);

      // Optimistic update
      setLocalChecklists(newChecklists);

      try {
        await reorderChecklists(newChecklists.map((c) => c.id));
        refetch();
      } catch (error) {
        console.error("Failed to reorder checklists:", error);
        refetch(); // Revert optimistic update
      }
    }

    setActiveChecklistId(null);
  };

  const handleDeleteChecklist = async (checklistId: number) => {
    try {
      await deleteChecklist(checklistId);
      refetch();
    } catch (error) {
      console.error("Failed to delete checklist:", error);
    }
  };

  const handleChecklistTitleChange = async (
    checklistId: number,
    title: string,
  ) => {
    setLocalChecklists((prev) =>
      prev.map((c) => (c.id === checklistId ? { ...c, title } : c)),
    );

    try {
      const checklist = localChecklists.find((c) => c.id === checklistId);
      if (!checklist) return;

      await updateChecklist({
        id: checklistId,
        checklistData: {
          title,
          items: checklist.items, // Include existing items in the update
        },
      });
    } catch (error) {
      console.error("Failed to update checklist title:", error);
    }
  };

  const getActiveItem = () => {
    if (!activeId || !activeChecklistId) return null;
    const checklist = localChecklists.find((c) => c.id === activeChecklistId);
    return checklist?.items.find((item) => item.id === activeId);
  };

  const activeItem = getActiveItem();

  return (
    <Card className="m-4 border border-gray-200 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-secondary">
      <CardContent className="p-0">
        <DndContext
          sensors={checklistSensors}
          collisionDetection={closestCenter}
          onDragStart={handleChecklistDragStart}
          onDragEnd={handleChecklistDragEnd}
        >
          <div
            className="custom-scrollbar divide-y divide-gray-200 dark:divide-gray-700 dark:bg-secondary"
            style={{ maxHeight: "400px", overflowY: "auto" }}
          >
            {localChecklists.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No checklists yet
                </p>
              </div>
            )}

            <SortableContext
              items={localChecklists.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {localChecklists.map((checklist) => {
                const isCollapsed = collapsedChecklists[checklist.id];
                const incompleteItems = checklist.items.filter(
                  (item) => !item.completed,
                );
                const completedItems = checklist.items.filter(
                  (item) => item.completed,
                );

                return (
                  <SortableChecklist
                    key={checklist.id}
                    id={checklist.id}
                    checklist={checklist}
                    isCollapsed={isCollapsed}
                    onToggleCollapse={toggleChecklistCollapse}
                    onTitleChange={handleChecklistTitleChange}
                    onDelete={(id) => {
                      setChecklistToDelete(id);
                      setDeleteChecklistDialogOpen(true);
                    }}
                    onAddItem={addItem}
                    onToggleItem={toggleItem}
                    onDeleteItem={deleteItem}
                    onUpdateItemText={updateItemText}
                  >
                    {!isCollapsed && (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        {/* Incomplete items */}
                        <SortableContext
                          items={incompleteItems.map((item) => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-0.5 dark:text-gray-300">
                            {incompleteItems.map((item) => (
                              <SortableChecklistItem
                                key={item.id}
                                id={item.id}
                                item={item}
                                onToggle={() =>
                                  toggleItem(checklist.id, item.id)
                                }
                                onDelete={() =>
                                  deleteItem(checklist.id, item.id)
                                }
                                onTextChange={(id, text) =>
                                  updateItemText(checklist.id, id, text)
                                }
                              />
                            ))}
                          </div>
                        </SortableContext>

                        {/* Completed items */}
                        {completedItems.length > 0 && (
                          <SortableContext
                            items={completedItems.map((item) => item.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="mt-4 space-y-0.5">
                              <p className="text-sm text-muted-foreground">
                                Completed
                              </p>
                              {completedItems.map((item) => (
                                <SortableChecklistItem
                                  key={item.id}
                                  id={item.id}
                                  item={item}
                                  onToggle={() =>
                                    toggleItem(checklist.id, item.id)
                                  }
                                  onDelete={() =>
                                    deleteItem(checklist.id, item.id)
                                  }
                                  onTextChange={(id, text) =>
                                    updateItemText(checklist.id, id, text)
                                  }
                                />
                              ))}
                            </div>
                          </SortableContext>
                        )}

                        <DragOverlay>
                          {activeItem ? (
                            <div className="flex items-center gap-2 rounded-md bg-white px-2 shadow-md dark:bg-gray-800">
                              <GripVertical className="h-4 w-4 cursor-move text-muted-foreground" />
                              <Checkbox
                                checked={activeItem.completed}
                                className="h-5 w-5 rounded-md"
                              />
                              <span className="flex-1">
                                {activeItem.text || "Add item"}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : null}
                        </DragOverlay>
                      </DndContext>
                    )}
                  </SortableChecklist>
                );
              })}
            </SortableContext>

            <DragOverlay>
              {activeChecklistId ? (
                <div className="rounded bg-white p-4 shadow-md dark:bg-gray-800">
                  <div className="mb-2 flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-medium">
                      {
                        localChecklists.find((c) => c.id === activeChecklistId)
                          ?.title
                      }
                    </span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </div>
        </DndContext>

        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={addNewChecklist}
            disabled={isAddingChecklist}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isAddingChecklist ? "Adding..." : "Add Checklist"}
          </Button>
        </div>

        <AlertDialog
          open={deleteChecklistDialogOpen}
          onOpenChange={setDeleteChecklistDialogOpen}
        >
          <AlertDialogContent className="sm:max-w-[425px]">
            <div className="flex flex-col items-center gap-4">
              <TriangleAlert className="h-12 w-12 text-destructive" />
              <div className="space-y-2 text-center">
                <AlertDialogTitle>Delete Checklist?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  This action cannot be undone. This will permanently delete
                  your checklist and all its items.
                </AlertDialogDescription>
              </div>
            </div>
            <AlertDialogFooter className="gap-4 sm:justify-center">
              <AlertDialogCancel className="mt-2">
                No, keep it.
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (checklistToDelete) {
                    handleDeleteChecklist(checklistToDelete);
                  }
                  setDeleteChecklistDialogOpen(false);
                }}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Yes, delete!
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default Checklists;
