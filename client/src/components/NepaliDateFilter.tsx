'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Filter, X } from 'lucide-react';
import { useGetAvailableFiltersQuery } from '@/state/api';

interface NepaliDateFilterProps {
  onFilterChange: (filter: { nepaliYear?: number; nepaliMonth?: number; startDate?: string; endDate?: string }) => void;
  initialFilter?: { nepaliYear?: number; nepaliMonth?: number; startDate?: string; endDate?: string };
  showDateRange?: boolean;
}

const NepaliDateFilter: React.FC<NepaliDateFilterProps> = ({ 
  onFilterChange, 
  initialFilter = {},
  showDateRange = true 
}) => {
  const { data: availableFilters } = useGetAvailableFiltersQuery();
  const [filterType, setFilterType] = useState<'nepali' | 'dateRange'>('nepali');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(initialFilter.nepaliYear);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(initialFilter.nepaliMonth);
  const [startDate, setStartDate] = useState<string>(initialFilter.startDate || '');
  const [endDate, setEndDate] = useState<string>(initialFilter.endDate || '');

  useEffect(() => {
    if (filterType === 'nepali' && selectedYear && selectedMonth) {
      onFilterChange({ nepaliYear: selectedYear, nepaliMonth: selectedMonth });
    } else if (filterType === 'dateRange' && startDate && endDate) {
      onFilterChange({ startDate, endDate });
    }
  }, [selectedYear, selectedMonth, startDate, endDate, filterType, onFilterChange]);

  const handleClearFilters = () => {
    setSelectedYear(undefined);
    setSelectedMonth(undefined);
    setStartDate('');
    setEndDate('');
    onFilterChange({});
  };

  const currentFilterDisplay = () => {
    if (filterType === 'nepali' && selectedYear && selectedMonth) {
      const monthName = availableFilters?.months.find(m => m.value === selectedMonth)?.label;
      return `📅 ${monthName} ${selectedYear} BS`;
    } else if (filterType === 'dateRange' && startDate && endDate) {
      return `📅 ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    }
    return 'No filter applied';
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-800">Date Filter</h3>
        </div>
        <button
          onClick={handleClearFilters}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      </div>

      {/* Filter Type Toggle */}
      {showDateRange && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setFilterType('nepali')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filterType === 'nepali'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Nepali Calendar
          </button>
          <button
            onClick={() => setFilterType('dateRange')}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              filterType === 'dateRange'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Date Range
          </button>
        </div>
      )}

      {/* Nepali Calendar Filter */}
      {filterType === 'nepali' && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Select Year (BS)
            </label>
            <select
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Year</option>
              {availableFilters?.years.map((year) => (
                <option key={year} value={year}>
                  {year} BS
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Select Month
            </label>
            <select
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={!selectedYear}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Select Month</option>
              {availableFilters?.months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Date Range Filter */}
      {filterType === 'dateRange' && showDateRange && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Current Filter Display */}
      <div className="mt-4 rounded-lg bg-blue-50 p-3">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Active Filter:</span> {currentFilterDisplay()}
        </p>
      </div>
    </div>
  );
};

export default NepaliDateFilter;