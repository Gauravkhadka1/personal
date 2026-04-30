// client/src/components/FinanceCard.tsx
'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Check,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Home,
  Car,
  CreditCard,
  Smartphone,
  LucideIcon,
  Calendar
} from 'lucide-react';

export interface FinanceItem {
  id: string;
  name: string;
  amount?: number;
  value?: number;
  date?: string;
}

interface FinanceCardProps {
  title: string;
  type: 'income' | 'expense' | 'asset' | 'liability';
  items: FinanceItem[];
  total: number;
  onAdd: (data: { name: string; amount?: number; value?: number; date?: string }) => void;
  onUpdate: (id: string, data: { name: string; amount?: number; value?: number; date?: string }) => void;
  onDelete: (id: string, name: string) => void;
  icon?: LucideIcon;
  color?: string;
  bgColor?: string;
}

const FinanceCard: React.FC<FinanceCardProps> = ({
  title,
  type,
  items,
  total,
  onAdd,
  onUpdate,
  onDelete,
  icon: Icon,
  color = 'text-gray-600',
  bgColor = 'bg-gray-50',
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    amount: 0, 
    value: 0, 
    date: new Date().toISOString().split('T')[0] 
  });

  const isAmountType = type === 'income' || type === 'expense';
  const isValueType = type === 'asset' || type === 'liability';

  const handleSubmit = () => {
    if (!formData.name) return;
    
    const submitData = {
      name: formData.name,
      ...(isAmountType && { amount: formData.amount }),
      ...(isValueType && { value: formData.value }),
      date: formData.date,
    };
    
    if (editingId) {
      onUpdate(editingId, submitData);
      setEditingId(null);
    } else {
      onAdd(submitData);
      setIsAdding(false);
    }
    
    setFormData({ name: '', amount: 0, value: 0, date: new Date().toISOString().split('T')[0] });
  };

  const handleEdit = (item: FinanceItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      amount: item.amount || 0,
      value: item.value || 0,
      date: item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', amount: 0, value: 0, date: new Date().toISOString().split('T')[0] });
  };

  const getItemIcon = (itemName: string): LucideIcon => {
    const name = itemName.toLowerCase();
    if (name.includes('salary') || name.includes('job')) return Briefcase;
    if (name.includes('rent')) return Home;
    if (name.includes('car') || name.includes('vehicle')) return Car;
    if (name.includes('credit') || name.includes('loan')) return CreditCard;
    if (name.includes('phone') || name.includes('mobile')) return Smartphone;
    return DollarSign;
  };

  const iconColor = () => {
    switch (type) {
      case 'income': return 'text-green-600';
      case 'expense': return 'text-red-600';
      case 'asset': return 'text-blue-600';
      case 'liability': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const totalColor = () => {
    switch (type) {
      case 'income': return 'text-green-600';
      case 'expense': return 'text-red-600';
      case 'asset': return 'text-blue-600';
      case 'liability': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`${bgColor} rounded-xl shadow-lg overflow-hidden`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-5 h-5 ${color}`} />}
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add</span>
        </button>
      </div>

      {/* Items List */}
      <div className="p-4 max-h-80 overflow-y-auto">
        <div className="space-y-2">
          {/* Add Form */}
          {isAdding && (
            <div className="bg-white rounded-lg p-3 border-2 border-blue-200">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <input
                type="number"
                placeholder={isAmountType ? "Amount" : "Value"}
                value={isAmountType ? formData.amount : formData.value}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (isAmountType) {
                    setFormData({ ...formData, amount: isNaN(val) ? 0 : val });
                  } else {
                    setFormData({ ...formData, value: isNaN(val) ? 0 : val });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Items */}
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow">
              {editingId === item.id ? (
                <div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                  />
                  <input
                    type="number"
                    value={isAmountType ? formData.amount : formData.value}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (isAmountType) {
                        setFormData({ ...formData, amount: isNaN(val) ? 0 : val });
                      } else {
                        setFormData({ ...formData, value: isNaN(val) ? 0 : val });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                  />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmit}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1.5 rounded-lg"
                    >
                      Update
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-1.5 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {React.createElement(getItemIcon(item.name), {
                      className: `w-5 h-5 ${iconColor()}`,
                    })}
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className={`text-sm font-semibold ${totalColor()}`}>
                        {isAmountType 
                          ? `$${item.amount?.toLocaleString()}`
                          : `$${item.value?.toLocaleString()}`
                        }
                      </p>
                      {item.date && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(item.date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id, item.name)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {items.length === 0 && !isAdding && (
            <div className="text-center py-8 text-gray-500">
              No items yet. Click "Add" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Footer - Total */}
      <div className="px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-600">Total {title}:</span>
          <span className={`text-xl font-bold ${totalColor()}`}>
            ${total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FinanceCard;