// client/src/components/FinanceCard.tsx

"use client";

import React from "react";
import { Pencil, Trash2, Plus, Calendar } from "lucide-react";

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
  onAdd: () => void;
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
  onDelete,
  onEdit,
  icon: Icon,
  color,
  bgColor,
}) => {
  const fieldLabel = type === "asset" || type === "liability" ? "Value" : "Amount";

  return (
    <div className={`overflow-hidden rounded-xl ${bgColor} shadow-lg`}>
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-white transition-colors hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Add</span>
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-6">
        {/* Items List */}
        <div className="space-y-2">
          {items.length === 0 && (
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