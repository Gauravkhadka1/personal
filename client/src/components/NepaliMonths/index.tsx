// client/src/components/NepaliMonths/index.tsx
"use client";

import { format, isWithinInterval } from "date-fns";

export const getCurrentNepaliMonth = () => ({
 
  start: new Date(2026, 3, 14),  
  end: new Date(2026, 4, 14),    
});

export const getPreviousNepaliMonth = () => ({ 
  start: new Date(2026, 2, 14),  
  end: new Date(2026, 3, 13), 
});

// Utility functions
export const isInCurrentNepaliMonth = (date: Date) => {
  const { start, end } = getCurrentNepaliMonth();
  return isWithinInterval(new Date(date), { start, end });
};

export const isInPreviousNepaliMonth = (date: Date) => {
  const { start, end } = getPreviousNepaliMonth();
  return isWithinInterval(new Date(date), { start, end });
};

export const formatNepaliMonth = (date: Date) => {
  return format(date, "MMMM yyyy");
};

// Main component (can be used for context or future extensions)
const NepaliMonths = () => null;

export default NepaliMonths;