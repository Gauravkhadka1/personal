// client/src/components/FinanceCard.tsx

"use client";

import React, { useState } from "react";
import { Pencil, Trash2, Plus, X, Check, Calendar } from "lucide-react";

interface FinanceItem {
  id: string;
  name: string;
  amount?: number;
  value?: number;
  date?: string;
}

interface FinanceCardProps {
  title: string;
  type: "income" | "asset" | "liability";
  items: FinanceItem[];
  total: number;
  onAdd: (data: { name: string; amount?: number; value?: number; date?: string }) => void;
  onUpdate: (id: string, data: { name: string; amount?: number; value?: number; date?: string }) => void;
  onDelete: (id: string, name: string) => void;
  onEdit?: (item: FinanceItem) => void;
  editingId?: string | null;
  editForm?: { name: string; amount?: number; value?: number; date?: string };
  onEditFormChange?: (form: any) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const FinanceCard: React.FC<FinanceCardProps> = ({
  title,
  type,
  items,
  total,
  onAdd,
  onUpdate,
  onDelete,
  onEdit,
  editingId,
  editForm,
  onEditFormChange,
  onSaveEdit,
  onCancelEdit,
  icon: Icon,
  color,
  bgColor,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", amount: 0, value: 0, date: new Date().toISOString().split("T")[0] });

  const fieldLabel = type === "asset" || type === "liability" ? "Value" : "Amount";

  const handleAdd = async () => {
    if (!newItem.name.trim()) return;
    
    const submitData = {
      name: newItem.name,
      ...(type === "asset" || type === "liability" 
        ? { value: newItem.value } 
        : { amount: newItem.amount }),
      date: newItem.date,
    };
    
    await onAdd(submitData);
    setIsAdding(false);
    setNewItem({ name: "", amount: 0, value: 0, date: new Date().toISOString().split("T")[0] });
  };

  const handleSaveEdit = () => {
    if (onSaveEdit) onSaveEdit();
  };

  const handleCancelEdit = () => {
    if (onCancelEdit) onCancelEdit();
  };

  return (
    <div className={`overflow-hidden rounded-xl ${bgColor} shadow-lg`}>
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          </div>
          {!isAdding && !editingId && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-white transition-colors hover:bg-blue-600"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-6">
        {/* Add Form */}
        {isAdding && (
          <div className="mb-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Add New {title.slice(0, -1)}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <input
                type="number"
                placeholder={fieldLabel}
                value={type === "asset" || type === "liability" ? newItem.value : newItem.amount}
                onChange={(e) =>
                  type === "asset" || type === "liability"
                    ? setNewItem({ ...newItem, value: parseFloat(e.target.value) || 0 })
                    : setNewItem({ ...newItem, amount: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="date"
                  value={newItem.date}
                  onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewItem({ name: "", amount: 0, value: 0, date: new Date().toISOString().split("T")[0] });
                  }}
                  className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {editingId && editForm && onEditFormChange && (
          <div className="mb-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">
              Edit {title.slice(0, -1)}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => onEditFormChange({ ...editForm, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Name"
                autoFocus
              />
              <input
                type="number"
                value={type === "asset" || type === "liability" ? editForm.value : editForm.amount}
                onChange={(e) =>
                  type === "asset" || type === "liability"
                    ? onEditFormChange({ ...editForm, value: parseFloat(e.target.value) || 0 })
                    : onEditFormChange({ ...editForm, amount: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={fieldLabel}
              />
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="date"
                  value={editForm.date || new Date().toISOString().split("T")[0]}
                  onChange={(e) => onEditFormChange({ ...editForm, date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 rounded-lg bg-green-500 py-2 text-white hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 rounded-lg bg-gray-300 py-2 text-gray-700 hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-2">
          {items.length === 0 && !isAdding && !editingId && (
            <div className="py-8 text-center text-gray-500">
              No {title.toLowerCase()} added yet
            </div>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-800">{item.name}</p>
                {item.date && (
                  <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <p className={`font-semibold ${color}`}>
                  ${(item.amount || item.value || 0).toLocaleString()}
                </p>
                <div className="flex gap-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                    >
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(item.id, item.name)}
                    className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        {items.length > 0 && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">Total {title}</p>
              <p className={`text-xl font-bold ${color}`}>
                ${total.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceCard;