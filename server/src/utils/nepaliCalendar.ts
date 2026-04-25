export interface NepaliMonthRange {
  nepaliMonth: number;
  nepaliMonthName: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Complete Nepali month data structure for years 2080-2082
 * Including corrected data for 2082 based on your requirements
 */
const NEPALI_YEAR_DATA = {
  2080: {
    // 2080 BS = 2023/2024 AD
    1: { start: '2023-04-14', end: '2023-05-14' },  // Baisakh
    2: { start: '2023-05-15', end: '2023-06-15' },  // Jestha
    3: { start: '2023-06-16', end: '2023-07-16' },  // Ashadh
    4: { start: '2023-07-17', end: '2023-08-17' },  // Shrawan
    5: { start: '2023-08-18', end: '2023-09-17' },  // Bhadra
    6: { start: '2023-09-18', end: '2023-10-17' },  // Ashwin
    7: { start: '2023-10-18', end: '2023-11-16' },  // Kartik
    8: { start: '2023-11-17', end: '2023-12-16' },  // Mangsir
    9: { start: '2023-12-17', end: '2024-01-14' },  // Poush
    10: { start: '2024-01-15', end: '2024-02-12' }, // Magh
    11: { start: '2024-02-13', end: '2024-03-13' }, // Falgun
    12: { start: '2024-03-14', end: '2024-04-12' }, // Chaitra
  },
  2081: {
    // 2081 BS = 2024/2025 AD
    1: { start: '2024-04-13', end: '2024-05-13' },  // Baisakh
    2: { start: '2024-05-14', end: '2024-06-14' },  // Jestha
    3: { start: '2024-06-15', end: '2024-07-15' },  // Ashadh
    4: { start: '2024-07-16', end: '2024-08-16' },  // Shrawan
    5: { start: '2024-08-17', end: '2024-09-16' },  // Bhadra
    6: { start: '2024-09-17', end: '2024-10-16' },  // Ashwin
    7: { start: '2024-10-17', end: '2024-11-15' },  // Kartik
    8: { start: '2024-11-16', end: '2024-12-15' },  // Mangsir
    9: { start: '2024-12-16', end: '2025-01-13' },  // Poush
    10: { start: '2025-01-14', end: '2025-02-12' }, // Magh
    11: { start: '2025-02-13', end: '2025-03-13' }, // Falgun
    12: { start: '2025-03-14', end: '2025-04-13' }, // Chaitra
  },
  2082: {
    // 2082 BS = 2025/2026 AD
    1: { start: '2025-04-14', end: '2025-05-14' },  // Baisakh (corrected based on your input)
    2: { start: '2025-05-15', end: '2025-06-14' },  // Jestha
    3: { start: '2025-06-15', end: '2025-07-16' },  // Ashadh
    4: { start: '2025-07-17', end: '2025-08-16' },  // Shrawan
    5: { start: '2025-08-17', end: '2025-09-16' },  // Bhadra
    6: { start: '2025-09-17', end: '2025-10-17' },  // Ashwin
    7: { start: '2025-10-18', end: '2025-11-16' },  // Kartik
    8: { start: '2025-11-17', end: '2025-12-15' },  // Mangsir
    9: { start: '2025-12-16', end: '2026-01-14' },  // Poush
    10: { start: '2026-01-15', end: '2026-02-13' }, // Magh
    11: { start: '2026-02-14', end: '2026-03-14' }, // Falgun
    12: { start: '2026-03-15', end: '2026-04-13' }, // Chaitra
  },
  2083: {
    // 2082 BS = 2025/2026 AD
    1: { start: '2026-04-14', end: '2026-05-14' },  // Baisakh (corrected based on your input)
    2: { start: '2026-05-15', end: '2026-06-14' },  // Jestha
    3: { start: '2026-06-15', end: '2026-07-16' },  // Ashadh
    4: { start: '2026-07-17', end: '2026-08-16' },  // Shrawan
    5: { start: '2026-08-17', end: '2026-09-16' },  // Bhadra
    6: { start: '2026-09-17', end: '2026-10-17' },  // Ashwin
    7: { start: '2026-10-18', end: '2026-11-16' },  // Kartik
    8: { start: '2026-11-17', end: '2026-12-15' },  // Mangsir
    9: { start: '2026-12-16', end: '2027-01-14' },  // Poush
    10: { start: '2027-01-15', end: '2027-02-12' }, // Magh
    11: { start: '2027-02-14', end: '2027-03-14' }, // Falgun
    12: { start: '2027-03-15', end: '2027-04-13' }, // Chaitra
  }
};

export const NEPALI_MONTH_NAMES: { [key: number]: string } = {
  1: 'Baisakh',
  2: 'Jestha',
  3: 'Ashadh',
  4: 'Shrawan',
  5: 'Bhadra',
  6: 'Ashwin',
  7: 'Kartik',
  8: 'Mangsir',
  9: 'Poush',
  10: 'Magh',
  11: 'Falgun',
  12: 'Chaitra'
};

// All the functions remain the same as in your original code
// They will automatically work with the extended data

/**
 * Get all 12 months with English date ranges for a specific Nepali year
 */
export function getNepaliYearMonths(nepaliYear: number): NepaliMonthRange[] {
  const yearData = NEPALI_YEAR_DATA[nepaliYear as keyof typeof NEPALI_YEAR_DATA];

  if (!yearData) {
    throw new Error(`No data available for Nepali year ${nepaliYear}`);
  }

  const months: NepaliMonthRange[] = [];

  for (let month = 1; month <= 12; month++) {
    const monthData = yearData[month as keyof typeof yearData];

    months.push({
      nepaliMonth: month,
      nepaliMonthName: NEPALI_MONTH_NAMES[month],
      startDate: new Date(monthData.start),
      endDate: new Date(monthData.end)
    });
  }

  return months;
}

/**
 * Get current Nepali year (approximate)
 */
export function getCurrentNepaliYear(): number {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  let nepaliYear = currentYear + 57;

  // Adjust for transition around April
  if (currentMonth < 3 || (currentMonth === 3 && currentDay < 14)) {
    nepaliYear--;
  }

  return nepaliYear;
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get specific month range for a Nepali year
 */
export function getNepaliMonthRange(nepaliYear: number, nepaliMonth: number): NepaliMonthRange | null {
  const months = getNepaliYearMonths(nepaliYear);
  return months.find(month => month.nepaliMonth === nepaliMonth) || null;
}

/**
 * Check if date is within a Nepali month
 */
export function isDateInNepaliMonth(date: Date, nepaliYear: number, nepaliMonth: number): boolean {
  const monthRange = getNepaliMonthRange(nepaliYear, nepaliMonth);
  if (!monthRange) return false;

  return date >= monthRange.startDate && date <= monthRange.endDate;
}

/**
 * Get available Nepali years in the system
 */
export function getAvailableNepaliYears(): number[] {
  return Object.keys(NEPALI_YEAR_DATA).map(Number).sort();
}

/**
 * Get Nepali month for a given English date
 */
export function getNepaliMonthFromDate(date: Date): { year: number; month: number; monthName: string } | null {
  const years = getAvailableNepaliYears();

  for (const year of years) {
    const months = getNepaliYearMonths(year);

    for (const month of months) {
      if (date >= month.startDate && date <= month.endDate) {
        return {
          year,
          month: month.nepaliMonth,
          monthName: month.nepaliMonthName
        };
      }
    }
  }

  return null;
}

export function hasCustomYearData(nepaliYear: number): boolean {
  return (NEPALI_YEAR_DATA as any)[nepaliYear] !== undefined;
}

/**
 * NEW: Helper function to get individual day mapping
 * This function helps understand day-by-day mapping for debugging
 */
export function getNepaliDateDetails(englishDate: Date): {
  nepaliYear: number;
  nepaliMonth: number;
  nepaliMonthName: string;
  nepaliDay: number;
} | null {
  const monthInfo = getNepaliMonthFromDate(englishDate);
  
  if (!monthInfo) {
    return null;
  }
  
  // Calculate the day number within the month
  const monthRange = getNepaliMonthRange(monthInfo.year, monthInfo.month);
  if (!monthRange) {
    return null;
  }
  
  const dayDiff = Math.floor(
    (englishDate.getTime() - monthRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const nepaliDay = dayDiff + 1; // Add 1 because day 1 should be 1, not 0
  
  return {
    nepaliYear: monthInfo.year,
    nepaliMonth: monthInfo.month,
    nepaliMonthName: monthInfo.monthName,
    nepaliDay: nepaliDay
  };
}

/**
 * Example usage for your specific dates:
 * To verify the mapping for Baishak 1 and Baishak 2 of 2082:
 */
export function test2082Mapping(): void {
  // Test Baishak 1, 2082 = April 14, 2025
  const baishak1 = new Date('2025-04-14');
  const baishak1Info = getNepaliDateDetails(baishak1);
  console.log('Baishak 1, 2082:', baishak1Info);
  
  // Test Baishak 2, 2082 = April 15, 2025
  const baishak2 = new Date('2025-04-15');
  const baishak2Info = getNepaliDateDetails(baishak2);
  console.log('Baishak 2, 2082:', baishak2Info);
  
  // Test month ranges for 2082
  const months2082 = getNepaliYearMonths(2082);
  console.log('\n2082 BS Month Ranges:');
  months2082.forEach(month => {
    console.log(`${month.nepaliMonthName} (${month.nepaliMonth}): ${formatDate(month.startDate)} to ${formatDate(month.endDate)}`);
  });
}



// You can call test2082Mapping() to verify the dates