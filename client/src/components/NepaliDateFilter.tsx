// client/src/components/NepaliDateFilter.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { useGetAvailableFiltersQuery } from '@/state/api';

interface NepaliDateFilterProps {
  onFilterChange: (filter: { nepaliYear?: number; nepaliMonth?: number }) => void;
  initialFilter?: { nepaliYear?: number; nepaliMonth?: number };
}

const NepaliDateFilter: React.FC<NepaliDateFilterProps> = ({ 
  onFilterChange, 
  initialFilter = {}
}) => {
  const { data: availableFilters } = useGetAvailableFiltersQuery();
  const [selectedYear, setSelectedYear] = useState<number | undefined>(initialFilter.nepaliYear);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(initialFilter.nepaliMonth);

  // Get current Nepali year and month (this is a simplified version - you may need proper conversion)
  const getCurrentNepaliYearMonth = () => {
    const now = new Date();
    // This is a simplified mapping - you should use a proper Nepali date library
    // For demo purposes, we'll use approximate values
    const currentYear = 2083; // Approximate Nepali year for demo
    const currentMonth = 4; // 1-12
    return { year: currentYear, month: currentMonth };
  };

  useEffect(() => {
    // Set default to current year and month if no filter is applied
    if (!selectedYear && !selectedMonth && availableFilters) {
      const current = getCurrentNepaliYearMonth();
      const currentYearExists = availableFilters.years?.includes(current.year);
      setSelectedYear(currentYearExists ? current.year : availableFilters.years?.[0]);
      setSelectedMonth(current.month);
    }
  }, [availableFilters]);

  useEffect(() => {
    if (selectedYear && selectedMonth) {
      onFilterChange({ nepaliYear: selectedYear, nepaliMonth: selectedMonth });
    }
  }, [selectedYear, selectedMonth, onFilterChange]);

  const currentFilterDisplay = () => {
    if (selectedYear && selectedMonth) {
      const monthName = availableFilters?.months.find(m => m.value === selectedMonth)?.label;
      return `${monthName} ${selectedYear} BS`;
    }
    return 'Loading...';
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-blue-500" />
        <span className="text-sm font-medium text-gray-700">Filter by:</span>
      </div>

      <div className="flex gap-3">
        <select
          value={selectedYear || ''}
          onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Year</option>
          {availableFilters?.years.map((year) => (
            <option key={year} value={year}>
              {year} BS
            </option>
          ))}
        </select>

        <select
          value={selectedMonth || ''}
          onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : undefined)}
          disabled={!selectedYear}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
  );
};

export default NepaliDateFilter;