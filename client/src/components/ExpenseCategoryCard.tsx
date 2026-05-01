// client/src/components/ExpenseCategoryCard.tsx

"use client";

import React from "react";
import { Pencil, Trash2, Calendar } from "lucide-react";

// Circular Progress Component (moved here for reusability)
const CircularProgress = ({
  percentage,
  size = 60,
  strokeWidth = 5,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 100) return "#ef4444";
    if (percentage >= 80) return "#eab308";
    return "#10b981";
  };

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="-rotate-90 transform" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-gray-800">
          {Math.min(Math.round(percentage), 100)}%
        </span>
      </div>
    </div>
  );
};

interface ExpenseCategoryCardProps {
  category: {
    id: string;
    name: string;
    budget: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
    status: "overspent" | "warning" | "good";
    date: string;
  };
  onEdit: (category: { id: string; name: string; amount: number }) => void;
  onDelete: (id: string, name: string) => void;
  isDeleting?: boolean;
  isEditing?: boolean;
}

const ExpenseCategoryCard: React.FC<ExpenseCategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
  isDeleting = false,
  isEditing = false,
}) => {
  const getStatusColor = () => {
    switch (category.status) {
      case "overspent":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-green-600";
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="grid grid-cols-5 gap-4">
             <h3 className="text-lg font-semibold text-gray-800">
              {category.name}
            </h3>
            <div>
              <p className="text-xs font-medium text-gray-500">Budget</p>
              <p className="text-lg font-semibold text-gray-800">
                ${category.budget.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Remaining</p>
              <p className={`text-lg font-semibold ${getStatusColor()}`}>
                ${Math.abs(category.remaining).toLocaleString()}
                {category.remaining < 0 && (
                  <span className="ml-1 text-sm font-normal text-red-600">
                    (over)
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CircularProgress
                percentage={Math.min(category.percentageUsed, 100)}
                size={50}
                strokeWidth={4}
              />
              <p className="mt-1 text-xs text-gray-500">
                {category.percentageUsed.toFixed(1)}% 
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => onEdit({
              id: category.id,
              name: category.name,
              amount: category.budget,
            })}
            disabled={isEditing || isDeleting}
            className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 disabled:opacity-50"
            title="Edit category"
          >
            <Pencil className="h-4 w-4 text-blue-500" />
          </button>
          <button
            onClick={() => onDelete(category.id, category.name)}
            disabled={isDeleting}
            className="rounded-lg p-1.5 transition-colors hover:bg-gray-100 disabled:opacity-50"
            title="Delete category"
          >
            {isDeleting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
            ) : (
              <Trash2 className="h-4 w-4 text-red-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseCategoryCard;